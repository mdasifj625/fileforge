"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import dynamic from "next/dynamic";
import * as Comlink from "comlink";
import type { PdfProcessor } from "@/workers/pdf.worker";

const PDFFileViewer = dynamic(
  () => import("./PDFFileViewer").then((mod) => mod.PDFFileViewer),
  { ssr: false },
);

export function PDFWorkspaceArea() {
  const layers = useWorkspaceStore((state) => state.layers);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const exportTrigger = useWorkspaceStore((state) => state.exportTrigger);
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchBlobs = async () => {
      const newBlobs: Record<string, Blob> = {};
      let changed = false;

      for (const layer of layers) {
        if (!blobs[layer.fileId]) {
          const fileRecord = await db.files.get(layer.fileId);
          if (fileRecord && fileRecord.type === "application/pdf") {
            newBlobs[layer.fileId] = fileRecord.blob;
            changed = true;
          }
        } else {
          newBlobs[layer.fileId] = blobs[layer.fileId];
        }
      }

      if (mounted && changed) {
        setBlobs((prev) => ({ ...prev, ...newBlobs }));
      }
    };
    fetchBlobs();
    return () => {
      mounted = false;
    };
  }, [layers, blobs]);

  const pdfLayers = layers.filter((l) => blobs[l.fileId]);

  useEffect(() => {
    if (
      exportTrigger > 0 &&
      activeTool === "pdf-merge" &&
      pdfLayers.length > 0
    ) {
      const handleExport = async () => {
        setIsMerging(true);
        try {
          const worker = new Worker(
            new URL("@/workers/pdf.worker", import.meta.url),
            { type: "module" },
          );
          const api = Comlink.wrap<PdfProcessor>(worker);

          const payload = pdfLayers.map((layer) => ({
            blob: blobs[layer.fileId],
            pageOrder: layer.pageOrder,
          }));

          const mergedBlob = await api.mergePdfs(payload);
          worker.terminate();

          const url = URL.createObjectURL(mergedBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `merged-file-forge-${Date.now()}.pdf`;
          a.click();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
          console.error("PDF Merge Failed:", e);
          alert("Failed to merge PDFs.");
        } finally {
          setIsMerging(false);
        }
      };
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  if (pdfLayers.length === 0) return null;

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
            <p className="text-muted-foreground text-sm">
              Drag to reorder or remove pages before merging. Click Export when
              done.
            </p>
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
                onClick={() =>
                  useWorkspaceStore.getState().removeLayer(layer.id)
                }
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
            <div className="p-4 bg-background/50">
              <PDFFileViewer blob={blobs[layer.fileId]} layerId={layer.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
