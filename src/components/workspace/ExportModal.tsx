"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import NextImage from "next/image";
import {
  ChevronDown,
  Lock,
  Unlock,
  Download,
  X,
  ImageIcon,
  Settings2,
  RotateCcw,
} from "lucide-react";

type Format = "image/png" | "image/jpeg" | "image/webp";

export function ExportModal() {
  const { exportImageBlob, setExportImageBlob } = useWorkspaceStore();

  const [format, setFormat] = useState<Format>("image/png");
  const [quality, setQuality] = useState(100);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [fitMode, setFitMode] = useState<"stretch" | "contain" | "cover">(
    "stretch",
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  const origWidthRef = useRef(0);
  const origHeightRef = useRef(0);

  const updatePreview = React.useCallback(
    (
      w: number,
      h: number,
      f: Format,
      q: number,
      fit: "stretch" | "contain" | "cover",
    ) => {
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

      if (fit === "stretch") {
        ctx.drawImage(img, 0, 0, w, h);
      } else {
        const imgRatio = img.width / img.height;
        const canvasRatio = w / h;

        let drawWidth = w;
        let drawHeight = h;
        let offsetX = 0;
        let offsetY = 0;

        if (fit === "contain") {
          if (imgRatio > canvasRatio) {
            drawWidth = w;
            drawHeight = w / imgRatio;
            offsetY = (h - drawHeight) / 2;
          } else {
            drawHeight = h;
            drawWidth = h * imgRatio;
            offsetX = (w - drawWidth) / 2;
          }
        } else if (fit === "cover") {
          if (imgRatio > canvasRatio) {
            drawHeight = h;
            drawWidth = h * imgRatio;
            offsetX = (w - drawWidth) / 2;
          } else {
            drawWidth = w;
            drawHeight = w / imgRatio;
            offsetY = (h - drawHeight) / 2;
          }
        }
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      }

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (exportImageBlob) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [exportImageBlob]);

  if (!exportImageBlob) return null;

  const handleDownload = async () => {
    if (!previewBlob) return;
    setIsProcessing(true);
    try {
      const ext =
        format === "image/jpeg"
          ? "jpg"
          : format === "image/webp"
            ? "webp"
            : "png";

      const a = document.createElement("a");
      const finalUrl = URL.createObjectURL(previewBlob);
      a.href = finalUrl;
      a.download = `file-forge-export-${Date.now()}.${ext}`;
      a.click();

      setTimeout(() => URL.revokeObjectURL(finalUrl), 1000);
      setExportImageBlob(null); // Close modal
    } catch (e) {
      console.error(e);
      alert("Failed to export high-resolution image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
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
    if (lockAspect && origHeightRef.current) {
      const newScale = val / origHeightRef.current;
      setScale(newScale);
      setWidth(Math.round(origWidthRef.current * newScale));
    }
  };

  const handleScaleChange = (s: number) => {
    setScale(s);
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
  };

  const formatLabels: Record<Format, string> = {
    "image/png": "PNG (Lossless)",
    "image/jpeg": "JPEG (Smaller file)",
    "image/webp": "WebP (Modern)",
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-panel border border-panel-border rounded-xl shadow-2xl w-full max-w-5xl flex flex-col md:flex-row overflow-hidden h-[95vh] md:h-auto md:max-h-[90vh]">
        {/* Preview Panel */}
        <div className="flex-1 bg-background flex flex-col relative min-h-0">
          <div className="p-3 md:p-4 border-b border-panel-border flex justify-between items-center h-[50px] md:h-[60px] shrink-0">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <h3 className="font-bold text-sm md:text-base text-foreground">
                Live Preview
              </h3>
            </div>
            {fileSize && (
              <span className="text-[10px] md:text-xs font-mono text-primary-foreground bg-primary px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-sm">
                {(fileSize / 1024).toFixed(1)} KB
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
        <div className="h-[55vh] md:h-auto flex-none md:flex-1 w-full md:w-96 bg-panel border-t md:border-t-0 md:border-l border-panel-border flex flex-col min-h-0">
          <div className="p-4 md:p-5 border-b border-panel-border flex justify-between items-center h-[50px] md:h-[60px] shrink-0">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              <h2 className="text-base md:text-lg font-bold text-foreground">
                Export Settings
              </h2>
            </div>
            <button
              onClick={() => setExportImageBlob(null)}
              className="p-1.5 hover:bg-muted text-muted-foreground rounded-md transition-colors"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          <div className="p-4 md:p-6 flex flex-col gap-5 overflow-y-auto flex-1 overscroll-contain">
            {/* Format Dropdown */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Format
              </label>
              <button
                onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                className="w-full flex items-center justify-between py-2.5 px-4 bg-background border border-panel-border rounded-lg text-sm font-medium hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <span>{formatLabels[format]}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {isFormatDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-panel border border-panel-border rounded-lg shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                  {(Object.entries(formatLabels) as [Format, string][]).map(
                    ([f, label]) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFormat(f);
                          setIsFormatDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          format === f
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* Quality Slider */}
            <div
              className={`flex flex-col gap-3 transition-opacity duration-300 ${format === "image/png" ? "opacity-40 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Quality{" "}
                  {format === "image/png" && (
                    <span className="lowercase normal-case font-normal">
                      (N/A for PNG)
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val)) val = 100;
                      setQuality(Math.min(100, Math.max(1, val)));
                    }}
                    disabled={format === "image/png"}
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
                disabled={format === "image/png"}
                className="w-full accent-primary h-2 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer disabled:cursor-not-allowed"
              />
            </div>

            <div className="h-px bg-panel-border w-full"></div>

            {/* Dimensions */}
            <div className="flex flex-col gap-4">
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

              <div className="flex items-center justify-between bg-muted/30 p-1.5 rounded-lg border border-panel-border">
                <span className="text-[11px] font-medium text-muted-foreground pl-1">
                  Aspect Ratio
                </span>
                <button
                  onClick={() => setLockAspect(!lockAspect)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[11px] font-bold ${
                    lockAspect
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-background text-muted-foreground hover:text-foreground border border-panel-border shadow-sm"
                  }`}
                >
                  {lockAspect ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  {lockAspect ? "LOCKED" : "UNLOCKED"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase pl-1">
                    Width (px)
                  </span>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) =>
                      handleWidthChange(parseInt(e.target.value) || 0)
                    }
                    className="w-full bg-background border border-panel-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="mt-5 text-muted-foreground">×</div>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase pl-1">
                    Height (px)
                  </span>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) =>
                      handleHeightChange(parseInt(e.target.value) || 0)
                    }
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

              {/* Scale Slider */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Scale
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="400"
                      value={Math.round(scale * 100)}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 100;
                        handleScaleChange(
                          Math.min(400, Math.max(1, val)) / 100,
                        );
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
                  max="400"
                  step="1"
                  value={Math.round(scale * 100)}
                  onChange={(e) =>
                    handleScaleChange(parseInt(e.target.value) / 100)
                  }
                  className="w-full accent-primary h-2 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-5 gap-1.5 mt-2">
                {[0.25, 0.5, 1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => handlePreset(s)}
                    className={`py-1.5 text-[11px] font-mono rounded border transition-all ${
                      scale === s
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-panel-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-panel-border bg-background/50">
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
    </div>
  );
}
