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

      // Center the stage dynamically and scale to fit the first image
      resizeHandler = () => {
        if (app && app.screen) {
          app.stage.position.set(app.screen.width / 2, app.screen.height / 2);

          const { layers } = useWorkspaceStore.getState();
          if (
            layers.length > 0 &&
            layers[0].originalWidth > 0 &&
            layers[0].originalHeight > 0
          ) {
            const docWidth = layers[0].originalWidth;
            const docHeight = layers[0].originalHeight;
            const scaleX = (app.screen.width * 0.8) / docWidth;
            const scaleY = (app.screen.height * 0.8) / docHeight;
            const fitScale = Math.min(scaleX, scaleY, 1);
            app.stage.scale.set(fitScale);
          } else {
            app.stage.scale.set(1);
          }
        }
      };

      app.renderer.on("resize", resizeHandler);
      // Subscribe to store changes so the stage scales when the first image is added
      useWorkspaceStore.subscribe((state, prevState) => {
        if (state.layers.length !== prevState.layers.length) {
          resizeHandler!();
        }
      });
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
