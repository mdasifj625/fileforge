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

                {/* Future implementation: Map child layers (like Watermarks) where parentId === page.id */}
              </div>
            );
          })}
        </Document>
      )}
    </div>
  );
}
