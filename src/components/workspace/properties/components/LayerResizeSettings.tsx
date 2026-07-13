import React from "react";
import { FileLayer } from "@/store/useWorkspaceStore";

interface Props {
  activeLayer: FileLayer;
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void;
}

export function LayerResizeSettings({
  activeLayer,
  updateLayerTransform,
}: Props) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Resize Image
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Width (px)
          </label>
          <input
            type="number"
            value={Math.round(
              activeLayer.originalWidth * Math.abs(activeLayer.scaleX),
            )}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                const newScale = val / activeLayer.originalWidth;
                const sign = activeLayer.scaleX < 0 ? -1 : 1;
                updateLayerTransform(activeLayer.id, {
                  scaleX: newScale * sign,
                });
              }
            }}
            className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Height (px)
          </label>
          <input
            type="number"
            value={Math.round(
              activeLayer.originalHeight * Math.abs(activeLayer.scaleY),
            )}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) {
                const newScale = val / activeLayer.originalHeight;
                const sign = activeLayer.scaleY < 0 ? -1 : 1;
                updateLayerTransform(activeLayer.id, {
                  scaleY: newScale * sign,
                });
              }
            }}
            className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="lockRatio"
          className="accent-primary"
          checked={true}
          onChange={() => alert("Aspect ratio locking is coming soon!")}
        />
        <label htmlFor="lockRatio" className="text-xs text-muted-foreground">
          Lock aspect ratio
        </label>
      </div>
    </div>
  );
}
