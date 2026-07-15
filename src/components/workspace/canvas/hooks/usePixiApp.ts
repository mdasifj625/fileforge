import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { CanvasRefs } from "../types";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function usePixiApp({
  containerRef,
  appRef,
  transformOverlayRef,
  brushControllerRef,
}: CanvasRefs) {
  const [isPixiReady, setIsPixiReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    let resizeHandler: (() => void) | null = null;

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

      // Center the stage dynamically. We ONLY update position on resize.
      // We do NOT scale the stage, because individual layers already handle their own scale in useLayerRenderer.
      resizeHandler = () => {
        if (app?.screen) {
          app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        }
      };

      app.renderer.on("resize", resizeHandler);
      resizeHandler(); // initial center

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
      if (resizeHandler && appRef.current) {
        appRef.current.renderer.off("resize", resizeHandler);
      }
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isPixiReady };
}
