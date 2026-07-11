"use client";

import React, { useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { CanvasArea } from "./CanvasArea";
import { PropertiesPanel } from "./PropertiesPanel";
import { Undo2, Redo2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function WorkspaceLayout({ children }: { children?: React.ReactNode }) {
  const pastCount = useWorkspaceStore((s) => s.past?.length || 0);
  const futureCount = useWorkspaceStore((s) => s.future?.length || 0);
  const undo = useWorkspaceStore((s) => s.undo);
  const redo = useWorkspaceStore((s) => s.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "Delete" || e.key === "Backspace") {
        const { activeLayerId, removeLayer } = useWorkspaceStore.getState();
        if (activeLayerId) {
          removeLayer(activeLayerId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Left Toolbar / Navigation */}
      <Toolbar />

      {/* Center Canvas Area (PixiJS WebGL preview will go here) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-panel border-x border-panel-border">
        {/* Top bar can contain tool title, export button, undo/redo */}
        <header className="h-14 border-b border-panel-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-md z-10">
          <div className="text-sm font-semibold text-muted-foreground tracking-wide">
            File Forge Workspace
          </div>
          <div className="flex gap-3 items-center">
            {/* Theme Toggle placeholder or active here */}
            <button
              onClick={() =>
                useWorkspaceStore
                  .getState()
                  .setTheme(
                    useWorkspaceStore.getState().theme === "dark"
                      ? "light"
                      : "dark",
                  )
              }
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              title="Toggle Theme"
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
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
            </button>
            <div className="h-4 w-px bg-panel-border mx-1"></div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={pastCount === 0}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Undo"
              >
                <Undo2 size={18} />
              </button>
              <button
                onClick={redo}
                disabled={futureCount === 0}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Redo"
              >
                <Redo2 size={18} />
              </button>
            </div>

            <div className="h-4 w-px bg-panel-border mx-1"></div>
            <button className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors shadow-sm shadow-primary/20">
              Export
            </button>
          </div>
        </header>

        <main className="flex-1 relative">
          <CanvasArea />
          {children}
        </main>

        {/* Bottom Timeline / Layer Panel */}
        <footer className="h-48 border-t border-panel-border bg-background p-4 flex flex-col z-20 relative shadow-2xl">
          <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-3 flex items-center justify-between">
            <span>Layers</span>
            <span className="bg-muted text-foreground px-2 py-0.5 rounded-full text-[10px]">
              {useWorkspaceStore.getState().layers?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            <LayerList />
          </div>
        </footer>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}

function LayerList() {
  const layers = useWorkspaceStore((state) => state.layers);
  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const setActiveLayerId = useWorkspaceStore((state) => state.setActiveLayerId);
  const removeLayer = useWorkspaceStore((state) => state.removeLayer);

  if (!layers || layers.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6 font-medium">
        No layers yet. Drop a file!
      </div>
    );
  }

  return (
    <>
      {layers.map((layer) => (
        <div key={layer.id} className="flex items-center gap-1 group pr-2">
          <button
            onClick={() => setActiveLayerId(layer.id)}
            className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-3 ${
              activeLayerId === layer.id
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div
              className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 transition-colors ${
                activeLayerId === layer.id
                  ? "bg-primary/20 text-primary"
                  : "bg-panel border border-panel-border text-muted-foreground"
              }`}
            >
              IMG
            </div>
            <span className="truncate flex-1">{layer.name}</span>
          </button>
          <button
            onClick={() => removeLayer(layer.id)}
            title="Delete Layer"
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-panel rounded-md transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ))}
    </>
  );
}
