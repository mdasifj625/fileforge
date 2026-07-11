"use client";

import React, { useEffect, useState, useRef } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function ExportModal() {
  const { exportImageBlob, setExportImageBlob } = useWorkspaceStore();

  const [format, setFormat] = useState<
    "image/png" | "image/jpeg" | "image/webp"
  >("image/png");
  const [quality, setQuality] = useState(100);
  const [scale, setScale] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  const updatePreview = React.useCallback(() => {
    const img = originalImageRef.current;
    if (!img) return;

    setIsProcessing(true);

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with white for jpeg
    if (format === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setFileSize(blob.size);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        setIsProcessing(false);
      },
      format,
      quality / 100,
    );
  }, [format, quality, scale]);

  useEffect(() => {
    if (!exportImageBlob) return;
    const url = URL.createObjectURL(exportImageBlob);
    const img = new Image();
    img.src = url;
    img.onload = () => {
      originalImageRef.current = img;
      updatePreview();
    };
    return () => URL.revokeObjectURL(url);
  }, [exportImageBlob, updatePreview]);

  useEffect(() => {
    if (originalImageRef.current) {
      updatePreview();
    }
  }, [updatePreview]);

  if (!exportImageBlob) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const ext =
      format === "image/jpeg"
        ? "jpg"
        : format === "image/webp"
          ? "webp"
          : "png";
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `file-forge-export-${Date.now()}.${ext}`;
    a.click();
    setExportImageBlob(null); // Close modal
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-panel border border-panel-border rounded-xl shadow-2xl w-full max-w-4xl flex overflow-hidden max-h-[90vh]">
        {/* Preview Panel */}
        <div className="flex-1 bg-background flex flex-col relative">
          <div className="p-4 border-b border-panel-border flex justify-between items-center">
            <h3 className="font-bold text-foreground">Preview</h3>
            {fileSize && (
              <span className="text-xs font-mono text-muted-foreground bg-panel px-2 py-1 rounded-md border border-panel-border">
                {(fileSize / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Export Preview"
                className="max-w-full max-h-full object-contain shadow-md rounded-md"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            )}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-80 border-l border-panel-border p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">
              Export Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Optimize your image before saving.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["image/png", "image/jpeg", "image/webp"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    format === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-panel-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.split("/")[1].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {format !== "image/png" && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Quality
                </label>
                <span className="text-xs font-mono">{quality}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Size Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Small", s: 0.5 },
                { label: "Medium", s: 0.75 },
                { label: "Original", s: 1 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setScale(preset.s)}
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    scale === preset.s
                      ? "bg-accent text-accent-foreground border-accent-foreground"
                      : "bg-background border-panel-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-panel-border">
            <button
              onClick={handleDownload}
              disabled={isProcessing || !previewUrl}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              Download Image
            </button>
            <button
              onClick={() => setExportImageBlob(null)}
              className="w-full py-2 bg-transparent hover:bg-muted text-muted-foreground font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
