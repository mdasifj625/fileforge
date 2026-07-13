import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { CanvasRefs } from "../types";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function useCanvasExport({
  appRef,
  spritesRef,
  bgSpritesRef,
  maskSpritesRef,
  gridRef,
  transformOverlayRef,
}: CanvasRefs) {
  const exportTrigger = useWorkspaceStore((state) => state.exportTrigger);
  const activeTool = useWorkspaceStore((state) => state.activeTool);

  useEffect(() => {
    if (exportTrigger > 0 && appRef.current && activeTool !== "pdf-merge") {
      const app = appRef.current;
      const state = useWorkspaceStore.getState();
      const activeLayerId = state.activeLayerId;
      const activeLayer = state.layers.find((l) => l.id === activeLayerId);

      if (
        !activeLayer ||
        !activeLayerId ||
        !spritesRef.current[activeLayerId]
      ) {
        // Fallback to full screen if no active layer
        app.canvas.toBlob((blob) => {
          if (blob) useWorkspaceStore.getState().setExportImageBlob(blob);
        }, "image/png");
        return;
      }

      const sprite = spritesRef.current[activeLayerId];
      const bgS = bgSpritesRef.current[activeLayerId];
      const maskS = maskSpritesRef.current[activeLayerId];

      // Save original transforms
      const origX = sprite.x;
      const origY = sprite.y;
      const origScaleX = sprite.scale.x;
      const origScaleY = sprite.scale.y;
      const origRot = sprite.rotation;

      // Reset transforms to 1:1 and centered for extraction
      const targetWidth = sprite.texture.frame.width;
      const targetHeight = sprite.texture.frame.height;

      sprite.x = targetWidth / 2;
      sprite.y = targetHeight / 2;
      sprite.scale.set(1);
      sprite.rotation = 0;

      if (maskS) {
        maskS.x = sprite.x;
        maskS.y = sprite.y;
        maskS.scale.set(1);
        maskS.rotation = 0;
      }

      if (bgS) {
        bgS.x = sprite.x;
        bgS.y = sprite.y;
        bgS.scale.set(1);
        bgS.rotation = 0;
      }

      // Hide grid and overlay
      const wasGridVisible = gridRef.current?.visible;
      const wasOverlayVisible = transformOverlayRef.current?.visible;
      if (gridRef.current) gridRef.current.visible = false;
      if (transformOverlayRef.current)
        transformOverlayRef.current.visible = false;

      // Hide all OTHER sprites temporarily
      const hiddenSprites: PIXI.Sprite[] = [];
      for (const id in spritesRef.current) {
        if (id !== activeLayerId && spritesRef.current[id].visible) {
          spritesRef.current[id].visible = false;
          hiddenSprites.push(spritesRef.current[id]);
        }
      }

      // Create a temporary render texture matched to the image's true size
      const renderTexture = PIXI.RenderTexture.create({
        width: targetWidth,
        height: targetHeight,
      });

      // Render the entire stage to capture background + sprite + mask accurately
      app.renderer.render({
        container: app.stage,
        target: renderTexture,
        clear: true,
      });

      // Extract canvas from renderTexture
      const extractedCanvas = app.renderer.extract.canvas(
        renderTexture,
      ) as HTMLCanvasElement;

      extractedCanvas.toBlob((blob) => {
        if (blob) {
          useWorkspaceStore.getState().setExportImageBlob(blob);
        }

        // Cleanup and Restore
        renderTexture.destroy(true);

        sprite.x = origX;
        sprite.y = origY;
        sprite.scale.set(origScaleX, origScaleY);
        sprite.rotation = origRot;

        if (maskS) {
          maskS.x = origX;
          maskS.y = origY;
          maskS.scale.set(origScaleX, origScaleY);
          maskS.rotation = origRot;
        }

        if (bgS) {
          bgS.x = origX;
          bgS.y = origY;
          bgS.scale.set(origScaleX, origScaleY);
          bgS.rotation = origRot;
        }

        if (gridRef.current) gridRef.current.visible = wasGridVisible ?? true;
        if (transformOverlayRef.current)
          transformOverlayRef.current.visible = wasOverlayVisible ?? true;

        hiddenSprites.forEach((s) => (s.visible = true));

        app.renderer.render(app.stage);
      }, "image/png");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger, activeTool]);
}
