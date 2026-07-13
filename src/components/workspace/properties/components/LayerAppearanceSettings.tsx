import React from "react";
import { FileLayer } from "@/store/useWorkspaceStore";

interface Props {
  activeLayer: FileLayer;
  handleTransformChange: (key: string, value: string) => void;
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void;
}

export function LayerAppearanceSettings({
  activeLayer,
  handleTransformChange,
  updateLayerTransform,
}: Props) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Appearance
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Opacity
            </label>
            <span className="text-xs font-mono text-foreground">
              {Math.round((activeLayer.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={activeLayer.opacity ?? 1}
            onChange={(e) => handleTransformChange("opacity", e.target.value)}
            className="w-full accent-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Blend Mode
          </label>
          <select
            value={activeLayer.blendMode || "normal"}
            onChange={(e) =>
              updateLayerTransform(activeLayer.id, {
                blendMode: e.target.value as FileLayer["blendMode"],
              })
            }
            className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
          </select>
        </div>
      </div>
    </div>
  );
}
