"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import UPNG from "upng-js";
import { useLayerStore, useToolStore, useExportStore } from "@/store";
import { Format, FitMode, calculateDrawRect } from "./export/utils";
import { ExportPreview } from "./export/ExportPreview";
import { ExportSettings } from "./export/ExportSettings";

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

  const [isProcessing, setIsProcessing] = useState(false);
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

  return createPortal(
    <div className="fixed inset-0 z-100 bg-background/80 backdrop-blur-sm flex items-center justify-center pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:p-4">
      <div className="bg-panel md:border border-panel-border md:rounded-xl shadow-2xl w-full h-full max-w-5xl flex flex-col md:flex-row overflow-hidden md:h-auto md:max-h-[90vh]">
        <ExportPreview
          isProcessing={isProcessing}
          previewBlob={previewBlob}
          fileSize={fileSize}
        />
        <ExportSettings
          format={format}
          setFormat={setFormat}
          width={width}
          height={height}
          handleWidthChange={handleWidthChange}
          handleHeightChange={handleHeightChange}
          lockAspect={lockAspect}
          setLockAspect={setLockAspect}
          scale={scale}
          handleScaleChange={handleScaleChange}
          handlePreset={handlePreset}
          fitMode={fitMode}
          setFitMode={setFitMode}
          quality={quality}
          setQuality={setQuality}
          handleReset={handleReset}
          handleClose={handleClose}
          handleDownload={handleDownload}
          isProcessing={isProcessing}
          previewBlob={previewBlob}
        />
      </div>
    </div>,
    document.body,
  );
}
