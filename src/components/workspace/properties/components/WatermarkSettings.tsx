import React from "react";
import { FileLayer } from "@/store/useWorkspaceStore";

interface Props {
  activeLayer: FileLayer;
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void;
}

export function WatermarkSettings({
  activeLayer,
  updateLayerTransform,
}: Props) {
  return (
    <div className="pt-6 border-t border-panel-border mt-6">
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Watermark Properties
      </h3>
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Text
        </label>
        <input
          type="text"
          value={activeLayer.watermarkText || ""}
          placeholder="CONFIDENTIAL"
          onChange={(e) => {
            updateLayerTransform(activeLayer.id, {
              watermarkText: e.target.value,
            });
          }}
          className="w-full bg-panel border border-panel-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    </div>
  );
}
