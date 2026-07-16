"use client";

import { useEffect } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { db } from "@/db";
import { CanvasRefs } from "../types";
import { Layer, ImageLayer } from "@/types/layer";
import {
  cleanupDeletedLayers,
  syncExistingSpriteTransforms,
  applyMaskToSprite,
  bindSpriteEvents,
  initNewSprite,
} from "../utils/spriteUtils";

export function useLayerRenderer(
  refs: CanvasRefs,
  isPixiReady: boolean,
  setSpriteUpdateTick: React.Dispatch<React.SetStateAction<number>>,
) {
  const { appRef, spritesRef, maskSpritesRef, brushControllerRef } = refs;

  const layers = useLayerStore((s) => s.layers);
  const activeTool = useToolStore((s) => s.activeTool);
  const brushMode = useToolStore((s) => s.brushMode);
  const brushSize = useToolStore((s) => s.brushSize);

  useEffect(() => {
    let cancelled = false;
    const renderLayers = async () => {
      const app = appRef.current;
      if (!app || !isPixiReady) return;

      cleanupDeletedLayers(app, layers as Layer[], spritesRef, maskSpritesRef);

      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i] as ImageLayer;

        try {
          if (spritesRef.current[layer.id]) {
            const sprite = spritesRef.current[layer.id];
            sprite.zIndex = (layers.length - i) * 2;

            syncExistingSpriteTransforms(
              sprite,
              layer,
              maskSpritesRef.current[layer.id],
              activeTool || "",
              brushMode,
              brushSize,
            );

            await applyMaskToSprite(
              app,
              sprite,
              layer,
              maskSpritesRef,
              brushControllerRef,
              activeTool || "",
            );

            continue;
          }

          const fileData = await db.files.get(layer.fileId);
          if (!fileData || !fileData.type.startsWith("image/")) continue;

          try {
            const imageBitmap = await window.createImageBitmap(fileData.blob);
            if (cancelled) return;

            const { sprite, realWidth, realHeight, scaleX, scaleY } =
              await initNewSprite(
                app,
                layer,
                imageBitmap,
                i,
                layers.length,
                activeTool || "",
                brushMode,
                brushSize,
              );

            bindSpriteEvents(sprite, layer, app, maskSpritesRef);

            app.stage.addChild(sprite);
            spritesRef.current[layer.id] = sprite;

            await applyMaskToSprite(
              app,
              sprite,
              layer,
              maskSpritesRef,
              brushControllerRef,
              activeTool || "",
            );

            setSpriteUpdateTick((t) => t + 1);

            useLayerStore.getState().updateLayerTransform(
              layer.id,
              {
                originalWidth: realWidth,
                originalHeight: realHeight,
                scaleX,
                scaleY,
                x: sprite.x,
                y: sprite.y,
              },
              false,
            );
          } catch (error) {
            console.error(
              "Failed to load texture for layer",
              layer.name,
              error,
            );
            queueMicrotask(() =>
              alert(
                `INIT Crash in renderLayers! Error: ${(error as Error)?.message || error}`,
              ),
            );
          }
        } catch (updateErr) {
          queueMicrotask(() =>
            alert(
              `UPDATE Crash in renderLayers! Error: ${(updateErr as Error)?.message || updateErr}`,
            ),
          );
        }
      }
    };

    renderLayers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, isPixiReady, activeTool, brushMode, brushSize]);
}
