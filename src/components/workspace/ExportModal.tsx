"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useExportStore } from "@/store";
import { exportManager } from "@/engines/ExportManager";

export function ExportModal() {
  const { exportImageBlob, setExportImageBlob } = useExportStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Use exportImageBlob for now as the trigger to open the modal
  if (!mounted || !exportImageBlob) return null;

  const handleClose = () => {
    setExportImageBlob(null);
  };

  const engine = exportManager.getActiveEngine();

  if (!engine) {
    console.error("No active export engine found for this tool.");
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:p-4">
      <div className="bg-panel md:border border-panel-border md:rounded-xl shadow-2xl w-full h-full max-w-5xl flex flex-col md:flex-row overflow-hidden md:h-auto md:max-h-[90vh]">
        {engine.getUI(handleClose)}
      </div>
    </div>,
    document.body,
  );
}
