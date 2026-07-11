"use client";

import React from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function PropertiesPanel() {
  const { activeTool } = useWorkspaceStore();

  return (
    <aside className="w-80 bg-zinc-950 flex flex-col z-20">
      <div className="h-14 border-b border-zinc-800 flex items-center px-4">
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wide">
          Properties
        </h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {activeTool ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                {activeTool} Settings
              </h3>
              {/* Placeholder for dynamic tool controls */}
              <div className="p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 text-sm text-zinc-400 text-center">
                Select an element to see its properties
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-zinc-500 text-center px-4">
            Select a tool or layer to view properties
          </div>
        )}
      </div>
    </aside>
  );
}
