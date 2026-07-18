"use client";

import React, { useEffect, useState } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { useExportStore } from "@/store/useExportStore";

import { useLayerBlobs } from "@/hooks/useBlobStorage";
import dynamic from "next/dynamic";
import * as Comlink from "comlink";
import type { PdfProcessor } from "@/workers/media/pdf/pdf-builder.worker";

const PDFFileViewer = dynamic(
  () => import("./PDFFileViewer").then((mod) => mod.PDFFileViewer),
  { ssr: false },
);

export function PDFWorkspaceArea() {
  const layers = useLayerStore((s) => s.layers);
  const activeTool = useToolStore((s) => s.activeTool);
  const exportTrigger = useExportStore((s) => s.exportTrigger);
  const [isMerging, setIsMerging] = useState(false);
  const { blobs } = useLayerBlobs(layers);

  const pdfLayers = layers.filter((l) => blobs[l.fileId]);

  useEffect(() => {
    if (
      exportTrigger > 0 &&
      activeTool?.startsWith("pdf-") &&
      pdfLayers.length > 0
    ) {
      const handleExport = async () => {
        setIsMerging(true);
        try {
          const worker = new Worker(
            new URL("@/workers/media/pdf/pdf-builder.worker", import.meta.url),
            { type: "module" },
          );
          const api = Comlink.wrap<PdfProcessor>(worker);

          let finalBlob: Blob;
          let filename: string;

          if (
            activeTool === "pdf-merge" ||
            activeTool === "pdf-extract-pages" ||
            activeTool === "pdf-delete-pages"
          ) {
            const payload = pdfLayers.map((layer) => ({
              blob: blobs[layer.fileId],
              pageOrder: (layer as import("@/types/layer").PDFLayer).pageOrder,
            }));
            finalBlob = await api.mergePdfs(payload);
            filename = `merged-file-forge-${Date.now()}.pdf`;
          } else if (activeTool === "pdf-split") {
            // For split, process the first uploaded PDF layer
            finalBlob = await api.splitPdf(
              blobs[pdfLayers[0].fileId],
              (pdfLayers[0] as import("@/types/layer").PDFLayer).pageOrder,
            );
            filename = `split-file-forge-${Date.now()}.zip`;
          } else if (activeTool === "pdf-images-to-pdf") {
            const imageBlobs = pdfLayers.map((layer) => blobs[layer.fileId]);
            finalBlob = await api.imagesToPdf(imageBlobs);
            filename = `images-to-pdf-forge-${Date.now()}.pdf`;
          } else if (activeTool === "pdf-watermark") {
            const layer = pdfLayers[0];
            const text =
              (layer as import("@/types/layer").PDFLayer).watermarkText ||
              prompt("Enter Watermark Text:") ||
              "CONFIDENTIAL";
            finalBlob = await api.watermarkPdf(
              blobs[layer.fileId],
              text,
              (layer as import("@/types/layer").PDFLayer).pageOrder,
            );
            filename = `watermarked-file-forge-${Date.now()}.pdf`;
          } else {
            worker.terminate();
            setIsMerging(false);
            return;
          }

          worker.terminate();

          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
          console.error("PDF Operation Failed:", e);
          alert("Failed to process PDF.");
        } finally {
          setIsMerging(false);
        }
      };
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  if (pdfLayers.length === 0) return null;

  let descriptionText =
    "Drag to reorder or remove pages before exporting. Click Export when done.";
  if (activeTool === "pdf-split") {
    descriptionText =
      "Remove pages you don't want. Click Export to split the remaining pages into separate PDFs.";
  } else if (activeTool === "pdf-images-to-pdf") {
    descriptionText =
      "Drag to reorder your images. Click Export to combine them into a single PDF.";
  }

  return (
    <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8 pointer-events-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              PDF Documents
              {isMerging && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">{descriptionText}</p>
          </div>
        </div>

        {pdfLayers.map((layer) => (
          <div
            key={layer.id}
            className="bg-panel border border-panel-border rounded-2xl shadow-xl overflow-hidden relative"
          >
            <div className="bg-muted px-6 py-3 border-b border-panel-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {layer.name}
              </h3>
              <button
                onClick={() => useLayerStore.getState().removeLayer(layer.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                title="Remove PDF"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            <div className="p-4 bg-background/50 flex justify-center">
              {blobs[layer.fileId]?.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(blobs[layer.fileId])}
                  alt={layer.name}
                  className="max-w-full max-h-[600px] object-contain rounded-md shadow-sm border border-panel-border"
                />
              ) : (
                <PDFFileViewer blob={blobs[layer.fileId]} layerId={layer.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
