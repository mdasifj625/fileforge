"use client";

import React from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function PropertiesPanel() {
  const { activeLayerId, layers, updateLayerTransform } = useWorkspaceStore();

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const handleTransformChange = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num });
    }
  };

  return (
    <aside className="w-80 bg-background flex flex-col z-20 border-l border-panel-border shadow-2xl">
      <div className="h-14 border-b border-panel-border flex items-center px-5 bg-background/50 backdrop-blur-md">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
          Properties
        </h2>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {activeLayer ? (
          <div className="space-y-8">
            {/* Transform Settings */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                Transform
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* X Position */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    X
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={Math.round(activeLayer.x)}
                      onChange={(e) =>
                        handleTransformChange("x", e.target.value)
                      }
                      className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Y Position */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Y
                  </label>
                  <input
                    type="number"
                    value={Math.round(activeLayer.y)}
                    onChange={(e) => handleTransformChange("y", e.target.value)}
                    className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                </div>

                {/* Scale X */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Width (%)
                  </label>
                  <input
                    type="number"
                    value={Math.round(activeLayer.scaleX * 100)}
                    onChange={(e) =>
                      handleTransformChange(
                        "scaleX",
                        (parseFloat(e.target.value) / 100).toString(),
                      )
                    }
                    className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                </div>

                {/* Scale Y */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Height (%)
                  </label>
                  <input
                    type="number"
                    value={Math.round(activeLayer.scaleY * 100)}
                    onChange={(e) =>
                      handleTransformChange(
                        "scaleY",
                        (parseFloat(e.target.value) / 100).toString(),
                      )
                    }
                    className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <hr className="border-panel-border" />

            {/* Appearance Settings Placeholder */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                Appearance
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Opacity
                  </span>
                  <span className="text-xs font-mono text-foreground bg-panel border border-panel-border px-2 py-1 rounded-md">
                    100%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Blend Mode
                  </span>
                  <span className="text-xs font-mono text-foreground bg-panel border border-panel-border px-2 py-1 rounded-md">
                    Normal
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4 font-medium">
            Select a layer to view and edit its properties
          </div>
        )}
      </div>
    </aside>
  );
}
