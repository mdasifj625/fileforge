import React from "react";
import { Toolbar } from "./Toolbar";
import { CanvasArea } from "./CanvasArea";
import { PropertiesPanel } from "./PropertiesPanel";

export function WorkspaceLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-50">
      {/* Left Toolbar / Navigation */}
      <Toolbar />

      {/* Center Canvas Area (PixiJS WebGL preview will go here) */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-900 border-x border-zinc-800">
        {/* Top bar can contain tool title, export button, undo/redo */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950/50 backdrop-blur-sm z-10">
          <div className="text-sm font-medium text-zinc-400">
            File Forge Workspace
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors">
              Undo
            </button>
            <button className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-sm shadow-blue-900/50">
              Export
            </button>
          </div>
        </header>

        <main className="flex-1 relative">
          <CanvasArea />
          {children}
        </main>

        {/* Optional Bottom Timeline / Layer Panel */}
        <footer className="h-48 border-t border-zinc-800 bg-zinc-950 p-2">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">
            Layers & Timeline
          </div>
          {/* Layers UI goes here */}
        </footer>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
