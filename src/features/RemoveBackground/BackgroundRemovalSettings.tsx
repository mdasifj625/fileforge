import React from "react";
import { useLayerStore, useToolStore, useAIStore } from "@/store";
import { useBackgroundRemoval } from "./useBackgroundRemoval";
import confetti from "canvas-confetti";
import { Layer, ImageLayer } from "@/types/layer";

/** Formats milliseconds into a human-readable m:ss or Xs string. */
function formatTime(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  if (totalSecs < 60) return `${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

/** Formats a target in whole seconds into m:ss or Xs. */
function formatTargetTime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return `${mins}m ${s.toString().padStart(2, "0")}s`;
}

function getStatusMessage(
  phase: "model" | "inference" | null,
  progress: number | null,
  backend: string | null,
) {
  const p = progress || 0;
  if (phase === "model") {
    if (p < 30) return "🚚 Fetching model weights from cache network...";
    if (p < 60) return "🧠 Downloading neural network attention layers...";
    if (p < 90)
      return "⚡ Allocating VRAM buffers and checking GPU hardware limits...";
    return "⚙️ Compiling ONNX hardware acceleration graph pipelines...";
  } else if (phase === "inference") {
    if (backend === "webgpu") {
      if (p < 25) return "🚀 Initializing WebGPU hardware adapter context...";
      if (p < 50)
        return "🔍 Running fast subject detection on raw pixel tensor arrays...";
      if (p < 75)
        return "✨ Isolating background boundary edges using BEN2 models...";
      return "🎭 Applying anti-aliased transparency alpha map channels...";
    } else {
      if (p < 20) return "🐌 Falling back to WebAssembly CPU execution...";
      if (p < 40)
        return "🧵 Initializing multi-threaded WASM processing layers...";
      if (p < 60)
        return "🧩 Processing pixel array chunks sequentially (slower)...";
      if (p < 80) return "🌟 Segmenting subject boundaries & matte masks...";
      return "🎨 Finalizing image matte transparency details...";
    }
  }
  return "⚡ Initializing AI removal system...";
}

export function BackgroundRemovalSettings({
  layer,
}: Readonly<{
  layer?: Layer;
}>) {
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);
  const brushMode = useToolStore((s) => s.brushMode);
  const brushSize = useToolStore((s) => s.brushSize);
  const setBrushMode = useToolStore((s) => s.setBrushMode);
  const setBrushSize = useToolStore((s) => s.setBrushSize);

  const aiProgressPhase = useAIStore((s) => s.aiProgressPhase);
  const aiProgressBackend = useAIStore((s) => s.aiProgressBackend);
  const bgRemovalSuccessTrigger = useAIStore((s) => s.bgRemovalSuccessTrigger);
  const bgRemovalDuration = useAIStore((s) => s.bgRemovalDuration);

  const {
    applyAIBackgroundRemoval,
    isFiltering,
    aiProgress,
  } = useBackgroundRemoval(layer, updateLayerTransform);

  const [elapsed, setElapsed] = React.useState(0);
  const [targetSeconds, setTargetSeconds] = React.useState(15);
  const [bufferAdded, setBufferAdded] = React.useState(false);
  const phase2StartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (!isFiltering) {
      setTimeout(() => {
        setElapsed(0);
        setBufferAdded(false);
      }, 0);
      phase2StartRef.current = null;
      return;
    }
    const start = Date.now();

    const cores =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const initialTarget =
      aiProgressBackend === "webgpu"
        ? Math.max(20, Math.round(25 * (16 / cores)))
        : Math.max(25, Math.round(30 * (16 / cores)));
    setTimeout(() => {
      setTargetSeconds(initialTarget);
    }, 0);

    const interval = setInterval(() => {
      const currentElapsedMs = Date.now() - start;
      setElapsed(currentElapsedMs);

      // Check if we are approaching the target seconds (within 1.5 seconds) and haven't extended yet
      const elapsedSecs = currentElapsedMs / 1000;
      setTargetSeconds((prev) => {
        if (elapsedSecs >= prev - 1.5) {
          setBufferAdded(true);
          return prev + 10;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isFiltering, aiProgressBackend]);

  React.useEffect(() => {
    if (aiProgressPhase === "inference") {
      if (!phase2StartRef.current) {
        phase2StartRef.current = Date.now();
      }
    } else {
      phase2StartRef.current = null;
    }
  }, [aiProgressPhase]);

  const activeLayer = layer as ImageLayer;

  React.useEffect(() => {
    if (bgRemovalSuccessTrigger > 0) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"],
      });
    }
  }, [bgRemovalSuccessTrigger]);

  if (!activeLayer) return null;

  const elapsedFormatted = formatTime(elapsed);
  const targetFormatted = formatTargetTime(targetSeconds);

  let subStatusText = "⚡ Initializing...";
  if (aiProgressPhase === "model") {
    subStatusText = "🚚 Fetching neural weights...";
  } else if (aiProgressPhase === "inference") {
    subStatusText = bufferAdded
      ? "⚙️ Adjusting timeline (+10s buffer)..."
      : "🧠 Segmenting image layers...";
  }

  return (
    <div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slide-glowing {
          0% { left: -30%; }
          50% { left: 100%; }
          100% { left: -30%; }
        }
        .animate-slide-glowing {
          position: absolute;
          width: 30%;
          height: 100%;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
          animation: slide-glowing 2s infinite ease-in-out;
        }
      `,
        }}
      />

      <div className="pt-6">
        {isFiltering ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 items-center text-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {aiProgressPhase === "model"
                    ? "Phase 1: Loading AI"
                    : "Phase 2: Segmenting Subject"}
                </span>
                <span className="font-mono text-xs text-foreground tabular-nums font-bold">
                  Elapsed: {elapsedFormatted} / ~{targetFormatted}
                </span>
              </div>

              {/* Glowing infinite loading track */}
              <div className="w-full bg-panel border border-panel-border rounded-full h-3 overflow-hidden relative">
                <div className="animate-slide-glowing rounded-full" />
              </div>

              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                <span>{subStatusText}</span>
                <span className="capitalize font-semibold text-primary font-mono">
                  {aiProgressBackend || "CPU"} Mode
                </span>
              </div>
            </div>

            <p className="text-xs text-foreground bg-panel border border-panel-border p-3 rounded-lg text-center font-medium animate-pulse">
              {bufferAdded
                ? "🔬 Refining high-fidelity subject edge detail..."
                : getStatusMessage(
                    aiProgressPhase,
                    aiProgress,
                    aiProgressBackend,
                  )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={applyAIBackgroundRemoval}
              disabled={isFiltering || !!activeLayer.isAiBackgroundRemoved}
              className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
            >
              {activeLayer.isAiBackgroundRemoved
                ? "Background Removed"
                : "Remove Background"}
            </button>
            {activeLayer.isAiBackgroundRemoved && bgRemovalDuration && (
              <p className="text-xs text-emerald-500 font-semibold text-center animate-fade-in">
                ✨ Completed in {formatTime(bgRemovalDuration)}
              </p>
            )}
            {activeLayer.isAiBackgroundRemoved && (
              /* eslint-disable-next-line @next/next/no-html-link-for-pages */
              <a
                href="/image/crop"
                className="bg-panel border border-panel-border hover:border-primary/50 hover:bg-primary/5 text-foreground text-xs py-2.5 rounded-lg transition-all text-center font-bold flex items-center justify-center gap-2 mt-1"
              >
                ✂️ Crop Image
              </a>
            )}
            {!activeLayer.isAiBackgroundRemoved && (
              <p className="text-xs text-muted-foreground text-center">
                Uses local AI models to segment and remove the image background.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-panel-border">
        <div className="flex bg-panel rounded-lg p-1 border border-panel-border mb-4">
          <button
            onClick={() => {
              const nextMode = brushMode === "erase" ? "none" : "erase";
              setBrushMode(nextMode);
              if (
                nextMode === "erase" &&
                !activeLayer.maskFileId &&
                activeLayer.originalWidth
              ) {
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
          <button
            onClick={() => {
              const nextMode = brushMode === "restore" ? "none" : "restore";
              setBrushMode(nextMode);
              if (
                nextMode === "restore" &&
                !activeLayer.maskFileId &&
                activeLayer.originalWidth
              ) {
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
    </div>
  );
}
