"use client";

import React, { useEffect } from "react";
import { CanvasArea } from "./CanvasArea";
import { PropertiesPanel } from "./PropertiesPanel";
import { ExportModal } from "./ExportModal";
import { Undo2, Redo2 } from "lucide-react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { useExportStore } from "@/store/useExportStore";
import { useWorkspaceActions } from "@/store";

export function WorkspaceLayout({
  children,
  title,
}: Readonly<{
  children?: React.ReactNode;
  title?: string;
}>) {
  const pastCount = useLayerStore((s) => s.past?.length || 0);
  const futureCount = useLayerStore((s) => s.future?.length || 0);
  const undo = useLayerStore((s) => s.undo);
  const redo = useLayerStore((s) => s.redo);
  const triggerExport = useExportStore((s) => s.triggerExport);
  const hasLayers = useLayerStore((s) => s.layers.length > 0);
  const activeTool = useToolStore((s) => s.activeTool);
  const hydrateLayers = useLayerStore((s) => s.hydrateLayers);
  const { startOver } = useWorkspaceActions();

  useEffect(() => {
    hydrateLayers();
  }, [hydrateLayers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const { activeLayerId, removeLayer } = useLayerStore.getState();
        if (activeLayerId) {
          removeLayer(activeLayerId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[80vh] w-full overflow-hidden bg-background text-foreground">
      {/* Center Canvas Area (PixiJS WebGL preview will go here) */}
      <div className="order-1 md:order-1 flex-none md:flex-1 h-[calc(45vh-4rem)] md:h-auto flex flex-col relative overflow-hidden bg-panel md:border-r border-panel-border">
        {/* Top bar — hidden on mobile, shown on desktop */}
        <header className="hidden md:flex h-14 border-b border-panel-border items-center justify-between px-5 bg-background/50 backdrop-blur-md z-10 shrink-0 relative">
          {/* Left Side: Tool title */}
          <div className="flex items-center gap-2">
            {title && (
              <h1 className="text-sm font-bold text-foreground truncate max-w-[200px] md:max-w-none">
                {title}
              </h1>
            )}
          </div>

          {/* Center: Undo / Redo */}
          <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            <button
              onClick={undo}
              disabled={pastCount === 0}
              className="p-2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={redo}
              disabled={futureCount === 0}
              className="p-2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo"
            >
              <Redo2 size={18} />
            </button>
          </div>

          {/* Right Side: Start Over & Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={startOver}
              disabled={!hasLayers}
              className="px-4 py-2 text-sm font-semibold bg-panel border border-panel-border hover:border-primary/50 text-foreground rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-panel-border"
            >
              Start Over
            </button>
            <button
              onClick={triggerExport}
              disabled={!hasLayers}
              className="px-5 py-2 text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              {activeTool === "compress" ? "Compress" : "Export"}
            </button>
          </div>
        </header>
        <main className="flex-1 relative overflow-hidden">
          <CanvasArea />
          {children}
        </main>{" "}
      </div>

      {/* Right Properties Panel */}
      <div className="order-2 md:order-2 shrink-0 z-30">
        <PropertiesPanel />
      </div>
      <ExportModal />
    </div>
  );
}
