"use client";

import React, { useEffect, useState } from "react";
import { useLayerStore } from "@/store/useLayerStore";
import { useShallow } from "zustand/react/shallow";

export function PdfCanvasArea() {
  const pages = useLayerStore(
    useShallow((s) => s.layers.filter((l) => l.type === "page")),
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-panel overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 gap-8">
      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
          <p className="text-sm font-medium">No PDF loaded.</p>
        </div>
      ) : (
        pages.map((page) => (
          <div
            key={page.id}
            className="relative bg-white shadow-md border border-panel-border shrink-0"
            style={{
              width: page.originalWidth,
              height: page.originalHeight,
              // Apply scaling if needed in the future
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-black/10 font-bold text-4xl select-none">
              Page {("pageIndex" in page ? page.pageIndex : 0) + 1}
            </div>
            {/* Future implementation: Native DOM rendering layers here */}
          </div>
        ))
      )}
    </div>
  );
}
