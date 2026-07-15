import React from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function BackgroundRemovalSettings({
  isFiltering,
  aiProgress,
  onApply,
}: {
  isFiltering: boolean;
  aiProgress: number | null;
  onApply: () => void;
}) {
  const {
    activeLayerId,
    layers,
    updateLayerTransform,
    brushMode,
    brushSize,
    setBrushMode,
    setBrushSize,
  } = useWorkspaceStore();

  const activeLayer = layers.find((l) => l.id === activeLayerId);
  if (!activeLayer) return null;

  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
        <span>Background Removal</span>
        {isFiltering && (
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>

      <div className="mb-6">
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          Manual Brush
        </h3>

        <div className="flex bg-panel rounded-lg p-1 border border-panel-border mb-4">
          <button
            onClick={() => {
              const nextMode = brushMode === "restore" ? "none" : "restore";
              setBrushMode(nextMode);
              if (
                nextMode === "restore" &&
                !activeLayer.maskFileId &&
                activeLayer.originalWidth
              ) {
                // Instantly generate a solid white mask if they want to start manually erasing
                const canvas = document.createElement("canvas");
                canvas.width = activeLayer.originalWidth;
                canvas.height = activeLayer.originalHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.fillStyle = "white";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const maskFileId = crypto.randomUUID();
                      import("@/db").then(({ db }) => {
                        db.files
                          .put({
                            id: maskFileId,
                            blob,
                            name: `manual-mask-${Date.now()}`,
                            type: "image/png",
                            size: blob.size,
                            createdAt: Date.now(),
                          })
                          .then(() => {
                            updateLayerTransform(activeLayer.id, {
                              maskFileId,
                            });
                          });
                      });
                    }
                  });
                }
              }
            }}
            className={`flex-1 text-[10px] uppercase tracking-widest font-bold py-2 rounded-md transition-all ${
              brushMode === "restore"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Restore
          </button>
          <button
            onClick={() => {
              const nextMode = brushMode === "erase" ? "none" : "erase";
              setBrushMode(nextMode);
              if (
                nextMode === "erase" &&
                !activeLayer.maskFileId &&
                activeLayer.originalWidth
              ) {
                // Instantly generate a solid white mask if they want to start manually erasing
                const canvas = document.createElement("canvas");
                canvas.width = activeLayer.originalWidth;
                canvas.height = activeLayer.originalHeight;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.fillStyle = "white";
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const maskFileId = crypto.randomUUID();
                      import("@/db").then(({ db }) => {
                        db.files
                          .put({
                            id: maskFileId,
                            blob,
                            name: `manual-mask-${Date.now()}`,
                            type: "image/png",
                            size: blob.size,
                            createdAt: Date.now(),
                          })
                          .then(() => {
                            updateLayerTransform(activeLayer.id, {
                              maskFileId,
                            });
                          });
                      });
                    }
                  });
                }
              }
            }}
            className={`flex-1 text-[10px] uppercase tracking-widest font-bold py-2 rounded-md transition-all ${
              brushMode === "erase"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Erase
          </button>
        </div>

        {brushMode !== "none" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Brush Size
              </label>
              <span className="text-xs font-mono text-foreground">
                {brushSize || 20}px
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="1"
              value={brushSize || 20}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-panel-border">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={onApply}
            disabled={isFiltering}
            className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
          >
            {isFiltering
              ? aiProgress !== null && aiProgress < 100
                ? `Loading Model... ${Math.round(aiProgress)}%`
                : "Removing Background..."
              : "Remove Background"}
          </button>
          <p className="text-xs text-muted-foreground text-center">
            Uses local AI models to segment and remove the image background.
          </p>
        </div>
      </div>
    </div>
  );
}
