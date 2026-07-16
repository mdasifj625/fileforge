import React from "react";
import { Layer } from "@/types/layer";
import { useLayerStore } from "@/store/useLayerStore";

interface Props {
  layer?: Layer;
}

export function WatermarkSettings({ layer }: Readonly<Props>) {
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);
  if (!layer) return null;
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
          value={layer.type === "pdf" ? layer.watermarkText || "" : ""}
          placeholder="CONFIDENTIAL"
          onChange={(e) => {
            updateLayerTransform(layer.id, {
              ...(layer.type === "pdf" && { watermarkText: e.target.value }),
            });
          }}
          className="w-full bg-panel border border-panel-border rounded-lg p-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    </div>
  );
}
