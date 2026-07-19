"use client";

import React, { useEffect, useState } from "react";
import { useLayerStore } from "@/store/useLayerStore";
import { useShallow } from "zustand/react/shallow";
import { useLayerBlobs } from "@/hooks/useBlobStorage";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Configure react-pdf worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfCanvasArea() {
  const pdfLayer = useLayerStore(
    useShallow((s) => s.layers.find((l) => l.type === "pdf")),
  );

  const pages = useLayerStore(
    useShallow((s) =>
      s.layers.filter((l) => l.type === "page" && l.parentId === pdfLayer?.id),
    ),
  );

  // Fetch the actual PDF blob for react-pdf to render
  const { blobs, isLoading: isBlobsLoading } = useLayerBlobs(
    pdfLayer ? [pdfLayer] : [],
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const pdfBlob = pdfLayer ? blobs[pdfLayer.fileId] : null;

  return (
    <div className="w-full h-full bg-panel overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 gap-8">
      {!pdfLayer || !pdfBlob ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
          <p className="text-sm font-medium">
            {isBlobsLoading ? "Loading PDF..." : "No PDF loaded."}
          </p>
        </div>
      ) : (
        <Document
          file={pdfBlob}
          loading={
            <div className="text-sm font-medium text-muted-foreground">
              Parsing Document...
            </div>
          }
          className="flex flex-col items-center gap-8"
        >
          {pages.map((page) => {
            const pageIndex = "pageIndex" in page ? page.pageIndex : 0;
            return (
              <div
                key={page.id}
                className="relative bg-white shadow-md border border-panel-border shrink-0"
                style={{
                  width: page.originalWidth,
                  height: page.originalHeight,
                }}
              >
                {/* Native DOM rendering via react-pdf */}
                <Page
                  pageNumber={pageIndex + 1}
                  width={page.originalWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="overflow-hidden"
                />

                {/* Map child layers (like Watermarks) where parentId === page.id */}
                <PageOverlays pageId={page.id} />
              </div>
            );
          })}
        </Document>
      )}
    </div>
  );
}

function PageOverlays({ pageId }: { pageId: string }) {
  const childLayers = useLayerStore(
    useShallow((s) =>
      s.layers.filter((l) => l.parentId === pageId && l.type !== "page"),
    ),
  );

  const { blobs } = useLayerBlobs(childLayers);

  if (childLayers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {childLayers.map((layer) => {
        if (!layer.visible) return null;

        const blob = blobs[layer.fileId];
        const objUrl = blob ? URL.createObjectURL(blob) : undefined;

        // Clean up object URLs when unmounted would be nice, but browser GC handles small amounts,
        // or we could use a custom hook. For now, this is okay for MVP native overlays.

        return (
          <div
            key={layer.id}
            className="absolute"
            style={{
              left: layer.x,
              top: layer.y,
              width: layer.originalWidth * layer.scaleX,
              height: layer.originalHeight * layer.scaleY,
              transform: `rotate(${layer.rotation}deg)`,
              opacity: layer.opacity ?? 1,
              mixBlendMode:
                layer.blendMode !== "normal"
                  ? (layer.blendMode as React.CSSProperties["mixBlendMode"])
                  : undefined,
              pointerEvents: "auto",
            }}
          >
            {layer.type === "image" && objUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={objUrl}
                alt={layer.name}
                className="w-full h-full object-contain block"
              />
            ) : (
              <div className="w-full h-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold text-xs p-1 text-center overflow-hidden">
                {layer.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
