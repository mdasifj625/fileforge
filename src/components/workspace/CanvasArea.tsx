"use client";

import React, { useRef } from "react";
import * as PIXI from "pixi.js";
import { useLayerStore, useToolStore } from "@/store";
import { toolRegistry } from "@/lib/toolRegistry";
import { PDFWorkspaceArea } from "./PDFWorkspaceArea";
import { VideoWorkspaceArea } from "./VideoWorkspaceArea";
import { AudioWorkspaceArea } from "./AudioWorkspaceArea";
import { UtilityWorkspaceArea } from "./UtilityWorkspaceArea";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";

import { usePixiApp } from "./canvas/hooks/usePixiApp";
import { useCanvasRender } from "./canvas/hooks/useCanvasRender";
import { useCanvasExport } from "./canvas/hooks/useCanvasExport";
import { useCanvasDrop } from "./canvas/hooks/useCanvasDrop";
import { CanvasRefs } from "./canvas/types";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>(null);
  const brushControllerRef = useRef<MaskBrushController | null>(null);
  const spritesRef = useRef<
    Record<string, PIXI.Sprite & { isBeingManipulated?: boolean }>
  >({});
  const transformOverlayRef = useRef<PIXI.Container>(null);
  const gridRef = useRef<PIXI.Graphics>(null);
  const maskSpritesRef = useRef<
    Record<
      string,
      PIXI.Sprite & { renderTexture?: PIXI.RenderTexture; maskFileId?: string }
    >
  >({});
  const layers = useLayerStore((state) => state.layers);
  const activeTool = useToolStore((state) => state.activeTool);
  const activeToolDef = activeTool ? toolRegistry[activeTool] : undefined;
  const ActiveWorkspaceOverlay = activeToolDef?.WorkspaceOverlayComponent;

  const canvasRefs: CanvasRefs = {
    appRef,
    containerRef,
    spritesRef,
    maskSpritesRef,
    transformOverlayRef,
    gridRef,
    brushControllerRef,
  };

  const { isPixiReady } = usePixiApp(canvasRefs);
  useCanvasExport(canvasRefs);
  const { getRootProps, getInputProps, isDragActive, open } = useCanvasDrop();

  useCanvasRender(canvasRefs, isPixiReady);

  const initialPinchDistance = useRef<number | null>(null);
  const initialLayerScale = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
      initialPinchDistance.current = dist;

      const { activeLayerId, layers } = useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        initialLayerScale.current = { x: layer.scaleX, y: layer.scaleY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      e.touches.length === 2 &&
      initialPinchDistance.current &&
      initialLayerScale.current
    ) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const scale = dist / initialPinchDistance.current;
      const { activeLayerId, updateLayerTransform } = useLayerStore.getState();
      if (activeLayerId) {
        updateLayerTransform(
          activeLayerId,
          {
            scaleX: initialLayerScale.current.x * scale,
            scaleY: initialLayerScale.current.y * scale,
          },
          false,
        );
      }
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = null;
    initialLayerScale.current = null;
  };

  // Block native pinch-to-zoom on mobile and native wheel scroll/zoom on desktop
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventNativeZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault(); // Block native page scroll and browser zoom

      const { activeLayerId, layers, updateLayerTransform } =
        useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (!layer) return;

      const delta = e.deltaY < 0 ? 1.05 : 0.95;
      updateLayerTransform(
        layer.id,
        {
          scaleX: layer.scaleX * delta,
          scaleY: layer.scaleY * delta,
        },
        false,
      );
    };

    container.addEventListener("touchmove", preventNativeZoom, {
      passive: false,
    });
    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("touchmove", preventNativeZoom);
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  return (
    <div
      {...getRootProps()}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <input {...getInputProps()} />

      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Crect width='10' height='10'/%3E%3Crect x='10' y='10' width='10' height='10'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "20px 20px",
          backgroundPosition: "center",
        }}
      />

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl pointer-events-none">
          <p className="text-xl font-semibold text-primary shadow-sm">
            Drop files to add as layers
          </p>
        </div>
      )}

      {layers.length === 0 && !isDragActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <button
            onClick={open}
            className="group flex flex-col items-center gap-3 bg-panel/80 hover:bg-muted px-8 py-6 rounded-2xl pointer-events-auto shadow-2xl backdrop-blur-md border border-panel-border transition-all hover:border-muted-foreground/30"
          >
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shadow-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium mb-1 tracking-wide">
                Drag & drop files here
              </p>
              <p className="text-muted-foreground text-sm">
                or click to browse your computer
              </p>
            </div>
          </button>
        </div>
      )}

      {ActiveWorkspaceOverlay && <ActiveWorkspaceOverlay />}
      {!ActiveWorkspaceOverlay && activeTool?.startsWith("pdf-") && (
        <PDFWorkspaceArea />
      )}
      {!ActiveWorkspaceOverlay &&
        (activeTool?.startsWith("ai-summarize-pdf") ||
          activeTool?.startsWith("ai-translate-document")) && (
          <PDFWorkspaceArea />
        )}
      {!ActiveWorkspaceOverlay && activeTool?.startsWith("video-") && (
        <VideoWorkspaceArea />
      )}
      {!ActiveWorkspaceOverlay && activeTool?.startsWith("audio-") && (
        <AudioWorkspaceArea />
      )}
      {!ActiveWorkspaceOverlay && activeTool?.startsWith("utility-") && (
        <UtilityWorkspaceArea />
      )}
    </div>
  );
}
