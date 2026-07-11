"use client";

import React from "react";
import { Toolbar } from "./Toolbar";
import { CanvasArea } from "./CanvasArea";
import { PropertiesPanel } from "./PropertiesPanel";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

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

        {/* Bottom Timeline / Layer Panel */}
        <footer className="h-48 border-t border-zinc-800 bg-zinc-950 p-4 flex flex-col z-20 relative">
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3 flex items-center justify-between">
            <span>Layers</span>
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-[10px]">
              {useWorkspaceStore.getState().layers?.length || 0}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {/* This should technically be separated into a LayersPanel component, but fine here for now */}
            <LayerList />
          </div>
        </footer>
      </div>

      {/* Right Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}

// Quick inline component for the layers list
function LayerList() {
  const layers = useWorkspaceStore((state) => state.layers);
  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const setActiveLayerId = useWorkspaceStore((state) => state.setActiveLayerId);

  if (!layers || layers.length === 0) {
    return (
      <div className="text-sm text-zinc-600 text-center py-4">
        No layers yet. Drop a file!
      </div>
    );
  }

  return (
    <>
      {layers.map((layer) => (
        <button
          key={layer.id}
          onClick={() => setActiveLayerId(layer.id)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-3 ${
            activeLayerId === layer.id
              ? "bg-blue-600/20 text-blue-400"
              : "text-zinc-300 hover:bg-zinc-900"
          }`}
        >
          <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 overflow-hidden shrink-0">
            IMG
          </div>
          <span className="truncate flex-1 font-medium">{layer.name}</span>
        </button>
      ))}
    </>
  );
}
