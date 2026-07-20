import { useState } from "react";
import { ImageLayer } from "@/types/layer";
import { Link, Unlock, RotateCcw, Check } from "lucide-react";
import { db } from "@/db";
import * as Comlink from "comlink";
import { ImageProcessor } from "@/workers/media/image/canvas-image.worker";
import { useLayerStore } from "@/store/useLayerStore";

interface Props {
  layer: ImageLayer;
  updateLayerTransform: (id: string, updates: Partial<ImageLayer>) => void;
}

export function LayerCropSettings({
  layer,
  updateLayerTransform,
}: Readonly<Props>) {
  const [lockAspect, setLockAspect] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const replaceLayer = useLayerStore((s) => s.replaceLayer);

  const currentRect = layer.cropRect || {
    x: 0,
    y: 0,
    width: layer.originalWidth,
    height: layer.originalHeight,
  };

  const handleReset = () => {
    updateLayerTransform(layer.id, {
      cropAspectRatio: "free",
      cropRect: {
        x: 0,
        y: 0,
        width: layer.originalWidth,
        height: layer.originalHeight,
      },
    });
  };

  const handleApplyCrop = async () => {
    if (!layer.cropRect || isApplying) return;
    setIsApplying(true);
    try {
      const fileRecord = await db.files.get(layer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/media/image/canvas-image.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<ImageProcessor>(worker);

      const newBlob = await api.applyCrop(fileRecord.blob, layer.cropRect);

      const newFileId = crypto.randomUUID();
      await db.files.put({
        id: newFileId,
        blob: newBlob,
        name: `cropped-${fileRecord.name}`,
        type: fileRecord.type,
        size: newBlob.size,
        createdAt: Date.now(),
      });

      const bitmap = await createImageBitmap(newBlob);
      const newLayerId = crypto.randomUUID();

      replaceLayer(layer.id, {
        ...layer,
        id: newLayerId,
        fileId: newFileId,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
        cropRect: undefined,
      });

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to apply crop.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleWidthChange = (val: number) => {
    let newH = currentRect.height;
    if (lockAspect && currentRect.width > 0) {
      newH = (val / currentRect.width) * currentRect.height;
    }
    updateLayerTransform(layer.id, {
      cropRect: { ...currentRect, width: val, height: newH },
    });
  };

  const handleHeightChange = (val: number) => {
    let newW = currentRect.width;
    if (lockAspect && currentRect.height > 0) {
      newW = (val / currentRect.height) * currentRect.width;
    }
    updateLayerTransform(layer.id, {
      cropRect: { ...currentRect, width: newW, height: val },
    });
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            Crop & Size
          </h3>
          <button
            onClick={handleReset}
            className="text-[10px] flex items-center gap-1 bg-panel border border-panel-border px-2 py-1 rounded hover:bg-muted text-muted-foreground transition-all"
            title="Reset Crop"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="mb-6">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
            Constraint
          </label>
          <select
            value={layer.cropAspectRatio || "free"}
            onChange={(e) => {
              const val = e.target.value;
              let ratio: number | "original" | "free" | null = null;
              if (val === "free") ratio = "free";
              else if (val === "original") ratio = "original";
              else ratio = parseFloat(val);

              let newCropRect = { ...currentRect };

              if (ratio !== "free" && ratio !== null) {
                const targetRatio =
                  ratio === "original"
                    ? layer.originalWidth / layer.originalHeight
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

              updateLayerTransform(layer.id, {
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

        <button
          onClick={handleApplyCrop}
          disabled={isApplying || !layer.cropRect}
          className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold mb-6 flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {isApplying ? "Applying..." : "Bake & Apply Crop"}
        </button>

        <div className="space-y-4">
          {/* Crop Area Size Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Crop Area Size
              </label>
              <span className="text-xs font-mono">
                {(() => {
                  const cropRatio =
                    currentRect.width / (currentRect.height || 1);
                  let maxW = layer.originalWidth;
                  if (layer.originalWidth / cropRatio > layer.originalHeight) {
                    maxW = layer.originalHeight * cropRatio;
                  }
                  return Math.round((currentRect.width / maxW) * 100);
                })()}
                %
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={(() => {
                const cropRatio = currentRect.width / (currentRect.height || 1);
                let maxW = layer.originalWidth;
                if (layer.originalWidth / cropRatio > layer.originalHeight) {
                  maxW = layer.originalHeight * cropRatio;
                }
                return Math.round((currentRect.width / maxW) * 100);
              })()}
              onChange={(e) => {
                const percentage = parseFloat(e.target.value);
                const cropRatio = currentRect.width / (currentRect.height || 1);
                let maxW = layer.originalWidth;
                let maxH = layer.originalWidth / cropRatio;

                if (layer.originalWidth / cropRatio > layer.originalHeight) {
                  maxH = layer.originalHeight;
                  maxW = layer.originalHeight * cropRatio;
                }

                const newWidth = (percentage / 100) * maxW;
                const newHeight = (percentage / 100) * maxH;

                const cx = currentRect.x + currentRect.width / 2;
                const cy = currentRect.y + currentRect.height / 2;

                let newX = cx - newWidth / 2;
                let newY = cy - newHeight / 2;

                if (newX < 0) newX = 0;
                if (newY < 0) newY = 0;
                if (newX + newWidth > layer.originalWidth)
                  newX = layer.originalWidth - newWidth;
                if (newY + newHeight > layer.originalHeight)
                  newY = layer.originalHeight - newHeight;

                updateLayerTransform(layer.id, {
                  cropRect: {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                  },
                });
              }}
              className="w-full accent-primary h-2 bg-panel-border rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            {/* Width */}
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Crop Width
              </label>
              <input
                type="number"
                value={Math.round(currentRect.width)}
                onChange={(e) =>
                  handleWidthChange(parseFloat(e.target.value) || 1)
                }
                className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>

            {/* Aspect Lock */}
            <button
              onClick={() => setLockAspect(!lockAspect)}
              className={`p-2 rounded-lg mt-5 transition-colors ${lockAspect ? "bg-primary text-primary-foreground" : "bg-panel border border-panel-border text-muted-foreground"}`}
              title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
            >
              {lockAspect ? <Link size={14} /> : <Unlock size={14} />}
            </button>

            {/* Height */}
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Crop Height
              </label>
              <input
                type="number"
                value={Math.round(currentRect.height)}
                onChange={(e) =>
                  handleHeightChange(parseFloat(e.target.value) || 1)
                }
                className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>
        </div>
      </div>
      <hr className="border-panel-border my-6" />
    </>
  );
}
