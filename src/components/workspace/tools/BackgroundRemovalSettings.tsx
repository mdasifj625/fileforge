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
        <span>Background</span>
        {isFiltering && (
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <button
          onClick={onApply}
          disabled={isFiltering}
          className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
        >
          {isFiltering
            ? aiProgress !== null && aiProgress < 100
              ? `Loading Model... ${Math.round(aiProgress)}%`
              : "Removing Background..."
            : "Remove Background (AI)"}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Uses local AI models to segment and remove the image background.
        </p>
      </div>

      <div className="mb-6 pt-6 border-t border-panel-border">
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          Manual Brush
        </h3>

        <div className="flex bg-panel rounded-lg p-1 border border-panel-border mb-4">
          <button
            onClick={() => setBrushMode("none")}
            className={`flex-1 text-[10px] uppercase tracking-widest font-bold py-2 rounded-md transition-all ${
              brushMode === "none"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Move
          </button>
          <button
            onClick={() => {
              setBrushMode("restore");
              if (!activeLayer.maskFileId && activeLayer.originalWidth) {
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
              setBrushMode("erase");
              if (!activeLayer.maskFileId && activeLayer.originalWidth) {
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
                ? "bg-destructive text-destructive-foreground"
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

      {activeLayer.maskFileId && (
        <div className="mb-6 pt-6 border-t border-panel-border">
          <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
            Edge Controls
          </h3>

          <div className="flex flex-col gap-4">
            {/* Edge Feather */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Feather
                </label>
                <span className="text-xs font-mono text-foreground">
                  {activeLayer.edgeFeather || 0}px
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={activeLayer.edgeFeather || 0}
                onChange={(e) =>
                  updateLayerTransform(activeLayer.id, {
                    edgeFeather: parseInt(e.target.value),
                  })
                }
                className="w-full accent-primary"
              />
            </div>

            {/* Edge Shift */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Shift Edge
                </label>
                <span className="text-xs font-mono text-foreground">
                  {activeLayer.edgeShift || 0}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="20"
                step="1"
                value={activeLayer.edgeShift || 0}
                onChange={(e) =>
                  updateLayerTransform(activeLayer.id, {
                    edgeShift: parseInt(e.target.value),
                  })
                }
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-panel-border">
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          Composition
        </h3>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeLayer.backgroundColor || "#000000"}
              onChange={(e) =>
                updateLayerTransform(activeLayer.id, {
                  backgroundColor: e.target.value,
                })
              }
              className="w-10 h-10 rounded-lg cursor-pointer border border-panel-border bg-panel"
            />
            <button
              onClick={() =>
                updateLayerTransform(activeLayer.id, {
                  backgroundColor: null,
                })
              }
              className="flex-1 bg-panel hover:bg-muted text-foreground text-xs py-2 px-4 rounded-lg transition-all border border-panel-border font-bold"
            >
              Transparent
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
