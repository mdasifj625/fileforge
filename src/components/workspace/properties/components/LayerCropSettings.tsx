import React from "react";
import { FileLayer } from "@/store/useWorkspaceStore";

interface Props {
  activeLayer: FileLayer;
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void;
}

export function LayerCropSettings({
  activeLayer,
  updateLayerTransform,
}: Props) {
  return (
    <>
      <div>
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          Crop
        </h3>

        <div className="mb-4">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
            Constraint
          </label>
          <select
            value={activeLayer.cropAspectRatio || "free"}
            onChange={(e) => {
              const val = e.target.value;
              let ratio: number | "original" | "free" | null = null;
              if (val === "free") ratio = "free";
              else if (val === "original") ratio = "original";
              else ratio = parseFloat(val);

              let newCropRect = activeLayer.cropRect || {
                x: 0,
                y: 0,
                width: activeLayer.originalWidth,
                height: activeLayer.originalHeight,
              };

              if (ratio !== "free" && ratio !== null) {
                const targetRatio =
                  ratio === "original"
                    ? activeLayer.originalWidth / activeLayer.originalHeight
                    : ratio;

                let newW = newCropRect.width;
                let newH = newCropRect.height;

                if (newW / newH > targetRatio) {
                  newW = newH * targetRatio;
                } else {
                  newH = newW / targetRatio;
                }

                const cx = newCropRect.x + newCropRect.width / 2;
                const cy = newCropRect.y + newCropRect.height / 2;

                newCropRect = {
                  x: cx - newW / 2,
                  y: cy - newH / 2,
                  width: newW,
                  height: newH,
                };
              }

              updateLayerTransform(activeLayer.id, {
                cropAspectRatio: ratio,
                cropRect: newCropRect,
              });
            }}
            className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="free">Free</option>
            <option value="original">Original Image</option>
            <option value="1">1:1 Square</option>
            <option value="1.7777777777777777">16:9 Landscape</option>
            <option value="1.3333333333333333">4:3 Landscape</option>
            <option value="0.75">3:4 Portrait</option>
            <option value="0.5625">9:16 Portrait</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Crop X */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Offset X
            </label>
            <input
              type="number"
              value={Math.round(activeLayer.cropRect?.x || 0)}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  updateLayerTransform(activeLayer.id, {
                    cropRect: {
                      ...(activeLayer.cropRect || {
                        x: 0,
                        y: 0,
                        width: activeLayer.originalWidth,
                        height: activeLayer.originalHeight,
                      }),
                      x: num,
                    },
                  });
                }
              }}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
            />
          </div>

          {/* Crop Y */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Offset Y
            </label>
            <input
              type="number"
              value={Math.round(activeLayer.cropRect?.y || 0)}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  updateLayerTransform(activeLayer.id, {
                    cropRect: {
                      ...(activeLayer.cropRect || {
                        x: 0,
                        y: 0,
                        width: activeLayer.originalWidth,
                        height: activeLayer.originalHeight,
                      }),
                      y: num,
                    },
                  });
                }
              }}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
            />
          </div>

          {/* Crop Width */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Width
            </label>
            <input
              type="number"
              value={Math.round(
                activeLayer.cropRect?.width ?? activeLayer.originalWidth,
              )}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  updateLayerTransform(activeLayer.id, {
                    cropRect: {
                      ...(activeLayer.cropRect || {
                        x: 0,
                        y: 0,
                        width: activeLayer.originalWidth,
                        height: activeLayer.originalHeight,
                      }),
                      width: num,
                    },
                  });
                }
              }}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
            />
          </div>

          {/* Crop Height */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Height
            </label>
            <input
              type="number"
              value={Math.round(
                activeLayer.cropRect?.height ?? activeLayer.originalHeight,
              )}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  updateLayerTransform(activeLayer.id, {
                    cropRect: {
                      ...(activeLayer.cropRect || {
                        x: 0,
                        y: 0,
                        width: activeLayer.originalWidth,
                        height: activeLayer.originalHeight,
                      }),
                      height: num,
                    },
                  });
                }
              }}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
            />
          </div>
        </div>
      </div>
      <hr className="border-panel-border" />
    </>
  );
}
