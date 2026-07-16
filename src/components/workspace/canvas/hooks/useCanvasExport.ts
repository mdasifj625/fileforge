import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { useLayerStore } from "@/store";
import { CanvasRefs } from "../types";
import { useToolStore } from "@/store/useToolStore";
import { useExportStore } from "@/store/useExportStore";

export function useCanvasExport({
  appRef,
  layerManagerRef,
  transformOverlayManagerRef,
}: CanvasRefs) {
  const exportTrigger = useExportStore((s) => s.exportTrigger);
  const activeTool = useToolStore((s) => s.activeTool);

  useEffect(() => {
    if (exportTrigger > 0 && appRef.current && activeTool !== "pdf-merge") {
      const app = appRef.current;
      const state = useLayerStore.getState();
      const activeLayerId = state.activeLayerId;
      const activeLayer = state.layers.find((l) => l.id === activeLayerId);

      const lm = layerManagerRef.current;
      const tom = transformOverlayManagerRef.current;

      if (
        !activeLayer ||
        !activeLayerId ||
        !lm ||
        !lm.getSprite(activeLayerId)
      ) {
        app.canvas.toBlob((blob) => {
          if (blob) useExportStore.getState().setExportImageBlob(blob);
        }, "image/png");
        return;
      }

      const sprite = lm.getSprite(activeLayerId);
      const maskS = lm.getMaskSprite(activeLayerId);

      const origX = sprite.x;
      const origY = sprite.y;
      const origScaleX = sprite.scale.x;
      const origScaleY = sprite.scale.y;
      const origRot = sprite.rotation;

      const targetWidth = sprite.texture.frame.width;
      const targetHeight = sprite.texture.frame.height;

      const flipX = origScaleX < 0 ? -1 : 1;
      const flipY = origScaleY < 0 ? -1 : 1;

      sprite.x = targetWidth / 2;
      sprite.y = targetHeight / 2;
      sprite.scale.set(flipX, flipY);
      sprite.rotation = 0;

      if (maskS) {
        maskS.x = sprite.x;
        maskS.y = sprite.y;
        maskS.scale.set(flipX, flipY);
        maskS.rotation = 0;
      }

      let wasOverlayVisible = false;
      if (tom) {
        const container = tom.getContainer();
        wasOverlayVisible = container.visible;
        container.visible = false;
      }

      // Hide all OTHER sprites temporarily
      const hiddenSprites: PIXI.Sprite[] = [];
      state.layers.forEach((l) => {
        if (l.id !== activeLayerId) {
          const s = lm.getSprite(l.id);
          if (s && s.visible) {
            s.visible = false;
            hiddenSprites.push(s);
          }
        }
      });

      const renderTexture = PIXI.RenderTexture.create({
        width: targetWidth,
        height: targetHeight,
      });

      const origStageX = app.stage.x;
      const origStageY = app.stage.y;
      const origStageScaleX = app.stage.scale.x;
      const origStageScaleY = app.stage.scale.y;

      app.stage.position.set(0, 0);
      app.stage.scale.set(1);

      app.renderer.render({
        container: app.stage,
        target: renderTexture,
        clear: true,
      });

      const extractedCanvas = app.renderer.extract.canvas(
        renderTexture,
      ) as HTMLCanvasElement;

      app.stage.position.set(origStageX, origStageY);
      app.stage.scale.set(origStageScaleX, origStageScaleY);

      extractedCanvas.toBlob((blob) => {
        if (blob) {
          useExportStore.getState().setExportImageBlob(blob);
        }

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

        if (tom) {
          tom.getContainer().visible = wasOverlayVisible;
        }

        hiddenSprites.forEach((s) => (s.visible = true));

        app.renderer.render(app.stage);
      }, "image/png");
    }
  }, [
    exportTrigger,
    activeTool,
    appRef,
    layerManagerRef,
    transformOverlayManagerRef,
  ]);
}
