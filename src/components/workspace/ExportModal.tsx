/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import UPNG from "upng-js";
import { useLayerStore, useToolStore, useExportStore } from "@/store";
import {
  Lock,
  Unlock,
  Download,
  X,
  ImageIcon,
  Settings2,
  RotateCcw,
} from "lucide-react";

type Format = "image/png" | "image/jpeg" | "image/webp";
type FitMode = "stretch" | "contain" | "cover";

const calculateDrawRect = (
  cw: number,
  ch: number,
  iw: number,
  ih: number,
  fit: FitMode,
) => {
  if (fit === "stretch") return { x: 0, y: 0, w: cw, h: ch };
  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;
  let drawWidth = cw,
    drawHeight = ch,
    offsetX = 0,
    offsetY = 0;
  if (fit === "contain") {
    if (imgRatio > canvasRatio) {
      drawHeight = cw / imgRatio;
      offsetY = (ch - drawHeight) / 2;
    } else {
      drawWidth = ch * imgRatio;
      offsetX = (cw - drawWidth) / 2;
    }
  } else if (fit === "cover") {
    if (imgRatio > canvasRatio) {
      drawWidth = ch * imgRatio;
      offsetX = (cw - drawWidth) / 2;
    } else {
      drawHeight = cw / imgRatio;
      offsetY = (ch - drawHeight) / 2;
    }
  }
  return { x: offsetX, y: offsetY, w: drawWidth, h: drawHeight };
};

export function ExportModal() {
  const activeLayerName = useLayerStore(
    (s) => s.layers.find((l) => l.id === s.activeLayerId)?.name,
  );
  const { exportImageBlob, setExportImageBlob } = useExportStore();
  const activeTool = useToolStore((s) => s.activeTool);

  const [format, setFormat] = useState<Format>("image/png");

  // Automatically select the default export format when opened
  useEffect(() => {
    if (exportImageBlob) {
      if (activeLayerName && activeTool !== "ai-remove-background") {
        const name = activeLayerName.toLowerCase();
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFormat("image/jpeg");
          return;
        } else if (name.endsWith(".webp")) {
          setFormat("image/webp");
          return;
        }
      }

      setFormat("image/png");
    }
  }, [exportImageBlob, activeLayerName, activeTool]);

  const [quality, setQuality] = useState(100);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    }
    return (bytes / 1024).toFixed(1) + " KB";
  };
  const [isProcessing, setIsProcessing] = useState(false);
  type FitMode = "stretch" | "contain" | "cover";

  const [fitMode, setFitMode] = useState<FitMode>("stretch");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const origWidthRef = useRef(0);
  const origHeightRef = useRef(0);

  const updatePreview = React.useCallback(
    (w: number, h: number, f: Format, q: number, fit: FitMode) => {
      const img = originalImageRef.current;
      if (!img || w <= 0 || h <= 0) return;

      setIsProcessing(true);

      canvasRef.current ??= document.createElement("canvas");
      const canvas = canvasRef.current;
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill with white for jpeg
      if (f === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const rect = calculateDrawRect(w, h, img.width, img.height, fit);
      ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);

      if (f === "image/png" && q < 100) {
        // Use UPNG.js for lossy PNG compression (quantization)
        // Maintain a "safe area" of minimum 32 colors to prevent catastrophic quality loss
        const imgData = ctx.getImageData(0, 0, w, h);
        const minColors = 32;
        const cnum = Math.floor(minColors + ((256 - minColors) * q) / 100);

        // UPNG.encode takes an array of ArrayBuffers (frames)
        const arrayBuffer = UPNG.encode([imgData.data.buffer], w, h, cnum);
        const blob = new Blob([arrayBuffer], { type: "image/png" });
        setFileSize(blob.size);
        setPreviewBlob(blob);
        setIsProcessing(false);
      } else {
        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            setFileSize(blob.size);
            setPreviewBlob(blob);
            setIsProcessing(false);
          },
          f,
          q / 100,
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!exportImageBlob) return;
    const url = URL.createObjectURL(exportImageBlob);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      originalImageRef.current = img;
      origWidthRef.current = img.width;
      origHeightRef.current = img.height;
      setWidth(img.width);
      setHeight(img.height);
      setScale(1);
    };
    return () => URL.revokeObjectURL(url);
  }, [exportImageBlob]);

  // Debounced preview generation
  useEffect(() => {
    if (width > 0 && height > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsProcessing(true); // show loader instantly
      const handler = setTimeout(() => {
        updatePreview(width, height, format, quality, fitMode);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [width, height, format, quality, fitMode, updatePreview]);

  // Lock body scroll and handle history state when modal is open
  useEffect(() => {
    if (exportImageBlob) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      window.history.pushState({ modal: "export" }, "");

      const handlePopState = () => {
        setExportImageBlob(null);
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        document.body.style.overflow = originalStyle;
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [exportImageBlob, setExportImageBlob]);

  if (!mounted || !exportImageBlob) return null;

  const handleClose = () => {
    if (window.history.state?.modal === "export") {
      window.history.back();
    } else {
      setExportImageBlob(null);
    }
  };

  const handleDownload = async () => {
    if (!previewBlob) return;
    setIsProcessing(true);
    try {
      const extMap: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/webp": "webp",
      };
      const ext = extMap[format] || "png";

      const a = document.createElement("a");
      const finalUrl = URL.createObjectURL(previewBlob);
      a.href = finalUrl;
      a.download = `file-forge-export-${Date.now()}.${ext}`;
      a.click();

      setTimeout(() => URL.revokeObjectURL(finalUrl), 1000);

      if (window.history.state?.modal === "export") {
        window.history.back();
      } else {
        setExportImageBlob(null); // Close modal
      }
    } catch (e) {
      console.error(e);
      alert("Failed to export high-resolution image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (val === 0) {
      if (lockAspect) {
        setHeight(0);
        setScale(0);
      }
      return;
    }
    if (lockAspect && origWidthRef.current) {
      const newScale = val / origWidthRef.current;
      setScale(newScale);
      setHeight(Math.round(origHeightRef.current * newScale));
    } else if (origWidthRef.current) {
      setScale(val / origWidthRef.current);
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (val === 0) {
      if (lockAspect) {
        setWidth(0);
        setScale(0);
      }
      return;
    }
    if (lockAspect && origHeightRef.current) {
      const newScale = val / origHeightRef.current;
      setScale(newScale);
      setWidth(Math.round(origWidthRef.current * newScale));
    }
  };

  const handleScaleChange = (s: number) => {
    setScale(s);
    if (s === 0) {
      setWidth(0);
      setHeight(0);
      return;
    }
    setWidth(Math.round(origWidthRef.current * s));
    setHeight(Math.round(origHeightRef.current * s));
  };

  const handlePreset = (s: number) => {
    handleScaleChange(s);
  };

  const handleReset = () => {
    setWidth(origWidthRef.current);
    setHeight(origHeightRef.current);
    setScale(1);
    setLockAspect(true);
    setFitMode("stretch");
    setQuality(100);
    setFormat("image/png");
  };

  const formatCards: { id: Format; title: string; subtitle: string }[] = [
    {
      id: "image/png",
      title: "PNG",
      subtitle: quality < 100 ? "Quantized" : "Lossless",
    },
    { id: "image/jpeg", title: "JPG", subtitle: "Smaller file" },
    { id: "image/webp", title: "WebP", subtitle: "Modern web" },
  ];

  return createPortal(
    <div className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:p-4">
      <div className="bg-panel md:border border-panel-border md:rounded-xl shadow-2xl w-full h-full max-w-5xl flex flex-col md:flex-row overflow-hidden md:h-auto md:max-h-[90vh]">
        {/* Preview Panel */}
        <div className="flex-1 bg-background flex flex-col relative min-h-0">
          <div className="hidden md:flex px-6 border-b border-panel-border justify-between items-center h-15 shrink-0">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">
                Live Preview
              </h3>
            </div>
            {fileSize && (
              <span className="text-xs font-mono text-primary-foreground bg-primary px-3 py-1.5 rounded-full shadow-sm">
                {formatSize(fileSize)}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden p-6 md:p-10 bg-muted/10 flex flex-col items-center justify-center relative z-0">
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm transition-all duration-200">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {previewBlob ? (
              <div className="relative max-w-full max-h-full rounded-md overflow-hidden shadow-sm border border-panel-border bg-background flex items-center justify-center">
                <img
                  src={URL.createObjectURL(previewBlob)}
                  alt="Export Preview"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "20px 20px",
                    backgroundPosition: "center",
                  }}
                />
                {fileSize && (
                  <div className="absolute bottom-2 right-2 md:hidden bg-background/80 backdrop-blur-sm text-[10px] font-mono px-2 py-1 rounded shadow-sm border border-panel-border z-10">
                    {formatSize(fileSize)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 opacity-50" />
                <p className="text-sm">Preparing preview...</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls Panel */}
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
                      className={`text-[10px] mt-0.5 ${format === card.id ? "text-primary-foreground/80" : "opacity-70"}`}
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
                  title={
                    lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"
                  }
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
      </div>
    </div>,
    document.body,
  );
}
