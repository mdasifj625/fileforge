import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { CanvasRefs } from "../types";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";
import { LayerManager } from "@/lib/pixi/LayerManager";
import { TransformOverlayManager } from "@/lib/pixi/TransformOverlayManager";
import { useLayerStore } from "@/store";

export function usePixiApp({
  containerRef,
  appRef,
  layerManagerRef,
  transformOverlayManagerRef,
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

          // Re-center any sprite that is logically at origin (0,0) — these are
          // layers that were placed at the canvas center and must track the new
          // stage origin when the canvas container resizes (e.g. mobile height change).
          const { layers } = useLayerStore.getState();
          layers.forEach((layer) => {
            if (layer.x === 0 && layer.y === 0) {
              useLayerStore
                .getState()
                .updateLayerTransform(layer.id, { x: 0, y: 0 }, false);
            }
          });
        }
      };

      app.renderer.on("resize", resizeHandler);
      resizeHandler(); // initial center

      const layerManager = new LayerManager(app);
      layerManagerRef.current = layerManager;

      const transformOverlayManager = new TransformOverlayManager(app);
      transformOverlayManagerRef.current = transformOverlayManager;

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
