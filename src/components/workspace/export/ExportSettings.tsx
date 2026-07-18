import React from "react";
import { Lock, Unlock, Download, X, Settings2, RotateCcw } from "lucide-react";
import { Format, FitMode } from "@/components/workspace/export/utils";

interface ExportSettingsProps {
  format: Format;
  setFormat: (f: Format) => void;
  width: number;
  height: number;
  handleWidthChange: (w: number) => void;
  handleHeightChange: (h: number) => void;
  lockAspect: boolean;
  setLockAspect: (l: boolean) => void;
  scale: number;
  handleScaleChange: (s: number) => void;
  handlePreset: (s: number) => void;
  fitMode: FitMode;
  setFitMode: (f: FitMode) => void;
  quality: number;
  setQuality: (q: number) => void;
  handleReset: () => void;
  handleClose: () => void;
  handleDownload: () => void;
  isProcessing: boolean;
  previewBlob: Blob | null;
}

export function ExportSettings({
  format,
  setFormat,
  width,
  height,
  handleWidthChange,
  handleHeightChange,
  lockAspect,
  setLockAspect,
  scale,
  handleScaleChange,
  handlePreset,
  fitMode,
  setFitMode,
  quality,
  setQuality,
  handleReset,
  handleClose,
  handleDownload,
  isProcessing,
  previewBlob,
}: ExportSettingsProps) {
  const formatCards: { id: Format; title: string; subtitle: string }[] = [
    {
      id: "image/png",
      title: "PNG",
      subtitle: quality < 100 ? "Quantized" : "Lossless",
    },
    { id: "image/jpeg", title: "JPG", subtitle: "Smaller file" },
    { id: "image/webp", title: "WebP", subtitle: "Modern web" },
  ];

  return (
    <div className="h-[65vh] md:h-auto flex-none w-full md:w-112.5 lg:w-125 bg-panel border-t md:border-t-0 md:border-l border-panel-border flex flex-col min-h-0">
      <div className="px-4 md:px-6 border-b border-panel-border flex justify-between items-center h-13.75 md:h-15 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground shrink-0" />
          <h2 className="text-sm md:text-lg font-bold text-foreground truncate">
            Export Settings
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={isProcessing || !previewBlob}
            className="md:hidden bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-1.5 rounded-md text-xs font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-muted text-muted-foreground rounded-md transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      <div className="px-5 md:px-6 py-4 md:py-6 flex flex-col gap-4 overflow-y-auto flex-1 overscroll-contain">
        {/* Format Selection Cards */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
            Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {formatCards.map((card) => (
              <button
                key={card.id}
                onClick={() => setFormat(card.id)}
                className={`flex flex-col items-center justify-center px-auto py-2 rounded-xl border transition-all ${
                  format === card.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background border-panel-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                }`}
              >
                <span className="text-xs font-bold">{card.title}</span>
                <span
                  className={`text-[10px] mt-0.5 ${
                    format === card.id
                      ? "text-primary-foreground/80"
                      : "opacity-70"
                  }`}
                >
                  {card.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-panel-border w-full"></div>

        {/* Dimensions */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Dimensions
            </label>
            <button
              onClick={handleReset}
              className="text-[10px] uppercase font-bold text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase pl-1">
                Width (px)
              </span>
              <input
                type="number"
                value={width || ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    handleWidthChange(0);
                  } else {
                    handleWidthChange(parseInt(e.target.value) || 0);
                  }
                }}
                className="w-full bg-background border border-panel-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <button
              onClick={() => setLockAspect(!lockAspect)}
              title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
              className={`mt-5 p-2 rounded-md transition-all flex items-center justify-center shrink-0 ${
                lockAspect
                  ? "bg-primary/10 text-primary hover:bg-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {lockAspect ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>

            <div className="flex-1 flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase pl-1">
                Height (px)
              </span>
              <input
                type="number"
                value={height || ""}
                onChange={(e) => {
                  if (e.target.value === "") {
                    handleHeightChange(0);
                  } else {
                    handleHeightChange(parseInt(e.target.value) || 0);
                  }
                }}
                className="w-full bg-background border border-panel-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Fit Mode (only visible when unlocked) */}
          {!lockAspect && (
            <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Scaling Mode
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "stretch", label: "Stretch" },
                  { id: "contain", label: "Contain" },
                  { id: "cover", label: "Cover" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() =>
                      setFitMode(mode.id as "stretch" | "contain" | "cover")
                    }
                    className={`py-1.5 text-[11px] font-mono rounded border transition-all ${
                      fitMode === mode.id
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background border-panel-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality Slider */}
          <div className="flex flex-col gap-4 mt-4 transition-opacity duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Quality
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quality || ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setQuality(0);
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val))
                        setQuality(Math.min(100, Math.max(1, val)));
                    }
                  }}
                  className="w-14 bg-background border border-panel-border rounded-md px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full accent-primary h-3 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:cursor-not-allowed"
            />
          </div>

          {/* Scale Slider */}
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Scale
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={Math.round(scale * 100) || ""}
                  onChange={(e) => {
                    if (e.target.value === "") {
                      handleScaleChange(0);
                    } else {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val))
                        handleScaleChange(
                          Math.min(200, Math.max(1, val)) / 100,
                        );
                    }
                  }}
                  className="w-14 bg-background border border-panel-border rounded-md px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  %
                </span>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={Math.round(scale * 100)}
              onChange={(e) =>
                handleScaleChange(parseInt(e.target.value) / 100)
              }
              className="w-full accent-primary h-3 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
            />
          </div>

          {/* Presets */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { v: 0.25, l: "25%" },
              { v: 0.5, l: "50%" },
              { v: 0.75, l: "75%" },
              { v: 1, l: "1x" },
              { v: 2, l: "2x" },
            ].map((s) => (
              <button
                key={s.v}
                onClick={() => handlePreset(s.v)}
                className={`py-2 text-[10px] leading-tight font-mono rounded border transition-all ${
                  scale === s.v
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-panel-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden md:block px-6 py-5 border-t border-panel-border bg-background/50">
        <button
          onClick={handleDownload}
          disabled={isProcessing || !previewBlob}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 group"
        >
          <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          Download Image
        </button>
      </div>
    </div>
  );
}
