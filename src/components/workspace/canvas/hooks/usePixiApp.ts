import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { CanvasRefs } from "../types";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";

export function usePixiApp({
  containerRef,
  appRef,
  gridRef,
  transformOverlayRef,
  brushControllerRef,
}: CanvasRefs) {
  const [isPixiReady, setIsPixiReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // Add a simple grid background
      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0x888888, 0.15);
      const gridSize = 50;
      for (let x = 0; x < app.screen.width; x += gridSize) {
        grid.moveTo(x, 0).lineTo(x, app.screen.height);
      }
      for (let y = 0; y < app.screen.height; y += gridSize) {
        grid.moveTo(0, y).lineTo(app.screen.width, y);
      }
      app.stage.addChild(grid);
      gridRef.current = grid;

      // Initialize Transform Overlay Container (Always on top)
      const transformOverlay = new PIXI.Container();
      transformOverlay.zIndex = 9999;
      app.stage.addChild(transformOverlay);
      transformOverlayRef.current = transformOverlay;

      app.stage.sortableChildren = true;
      appRef.current = app;

      brushControllerRef.current = new MaskBrushController(app);

      setIsPixiReady(true);
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isPixiReady };
}
