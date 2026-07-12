"use client";

import React, { useEffect } from "react";
import { Toolbar } from "./Toolbar";
import { CanvasArea } from "./CanvasArea";
import { PropertiesPanel } from "./PropertiesPanel";
import { ExportModal } from "./ExportModal";
import { Undo2, Redo2 } from "lucide-react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function WorkspaceLayout({ children }: { children?: React.ReactNode }) {
  const pastCount = useWorkspaceStore((s) => s.past?.length || 0);
  const futureCount = useWorkspaceStore((s) => s.future?.length || 0);
  const undo = useWorkspaceStore((s) => s.undo);
  const redo = useWorkspaceStore((s) => s.redo);
  const triggerExport = useWorkspaceStore((s) => s.triggerExport);

  const theme = useWorkspaceStore((s) => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

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
    <div className="flex flex-col md:flex-row h-[70vh] min-h-[600px] w-full max-w-[1600px] mx-auto overflow-hidden bg-background text-foreground border border-panel-border md:rounded-2xl shadow-2xl">
      {/* Left Toolbar / Navigation */}
      <div className="order-3 md:order-1 shrink-0 z-20">
        <Toolbar />
      </div>

      {/* Center Canvas Area (PixiJS WebGL preview will go here) */}
      <div className="order-1 md:order-2 flex-1 flex flex-col relative overflow-hidden bg-panel md:border-x border-panel-border">
        {/* Top bar can contain tool title, export button, undo/redo */}
        <header className="h-14 border-b border-panel-border flex items-center justify-between px-4 bg-background/50 backdrop-blur-md z-10 shrink-0">
          <div className="text-sm font-semibold text-muted-foreground tracking-wide">
            File Forge Workspace
          </div>
          <div className="flex gap-3 items-center">
            {/* Theme Toggle placeholder or active here */}
            <button
              onClick={() =>
                useWorkspaceStore
                  .getState()
                  .setTheme(theme === "dark" ? "light" : "dark")
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
            <button
              onClick={triggerExport}
              className="px-3 py-1.5 text-sm font-medium bg-primary hover:bg-primary-hover text-primary-foreground rounded-md transition-colors shadow-sm shadow-primary/20"
            >
              Export
            </button>
          </div>
        </header>
        <main className="flex-1 relative overflow-hidden">
          <CanvasArea />
          {children}
        </main>{" "}
      </div>

      {/* Right Properties Panel */}
      <div className="order-2 md:order-3 shrink-0 z-30">
        <PropertiesPanel />
      </div>
      <ExportModal />
    </div>
  );
}
