import React from "react";
import { FileLayer } from "@/store/useWorkspaceStore";

interface Props {
  activeLayer: FileLayer;
  handleTransformChange: (key: string, value: string) => void;
}

export function LayerTransformSettings({
  activeLayer,
  handleTransformChange,
}: Props) {
  return (
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
              onChange={(e) => handleTransformChange("x", e.target.value)}
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
  );
}
