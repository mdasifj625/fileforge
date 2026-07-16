"use client";

import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import { CanvasRefs } from "../types";

function getBrushCursor(size: number) {
  const svg = `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="black" stroke-width="1.5"/><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="white" stroke-width="1" stroke-dasharray="3,3"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${size} ${size}, crosshair`;
}

export function useLayerRenderer(
  refs: CanvasRefs,
  isPixiReady: boolean,
  setSpriteUpdateTick: React.Dispatch<React.SetStateAction<number>>,
) {
  const { appRef, spritesRef, maskSpritesRef, brushControllerRef } = refs;

  const layers = useWorkspaceStore((state) => state.layers);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const brushMode = useWorkspaceStore((state) => state.brushMode);
  const brushSize = useWorkspaceStore((state) => state.brushSize);
  // We assume isPixiReady is essentially checked by appRef.current being available
  // Render Pipeline: Listen to layers and render them
  useEffect(() => {
    let cancelled = false;
    const renderLayers = async () => {
      const app = appRef.current;
      if (!app || !isPixiReady) return;

      // Clean up deleted layers
      const currentLayerIds = new Set(layers.map((l) => l.id));
      for (const id in spritesRef.current) {
        if (!currentLayerIds.has(id)) {
          const sprite = spritesRef.current[id];
          app.stage.removeChild(sprite);
          sprite.destroy({ texture: true });
          delete spritesRef.current[id];

          const maskSprite = maskSpritesRef.current[id];
          if (maskSprite) {
            app.stage.removeChild(maskSprite);
            maskSprite.destroy({ texture: true });
            if (maskSprite.renderTexture)
              maskSprite.renderTexture.destroy(true);
            delete maskSpritesRef.current[id];
          }
        }
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];

        try {
          if (spritesRef.current[layer.id]) {
            const sprite = spritesRef.current[layer.id];
            sprite.visible = layer.visible;
            sprite.zIndex = (layers.length - i) * 2;
            sprite.cursor =
              activeTool === "ai-remove-background" && brushMode !== "none"
                ? getBrushCursor(brushSize || 20)
                : "pointer";

            // Apply transforms from store if not currently being actively dragged/scaled
            // (To prevent jitter, we only force sync if we aren't the ones changing it)
            if (!sprite.isBeingManipulated) {
              if (layer.x !== 0 || layer.y !== 0) {
                sprite.x = layer.x;
                sprite.y = layer.y;
              }
              if (layer.scaleX !== 1) sprite.scale.x = layer.scaleX;
              if (layer.scaleY !== 1) sprite.scale.y = layer.scaleY;
              sprite.rotation = layer.rotation || 0;
              sprite.alpha = layer.opacity ?? 1;
              sprite.blendMode = (layer.blendMode ||
                "normal") as PIXI.BLEND_MODES;

              if (maskSpritesRef.current[layer.id]) {
                const maskS = maskSpritesRef.current[layer.id];
                maskS.x = sprite.x;
                maskS.y = sprite.y;
                maskS.scale.set(sprite.scale.x, sprite.scale.y);
                maskS.rotation = sprite.rotation;
              }

              // Apply non-destructive crop via texture frame
              if (layer.cropRect && layer.originalWidth > 0) {
                const cx = Math.max(0, layer.cropRect.x);
                const cy = Math.max(0, layer.cropRect.y);
                const cw = Math.min(
                  layer.originalWidth - cx,
                  layer.cropRect.width,
                );
                const ch = Math.min(
                  layer.originalHeight - cy,
                  layer.cropRect.height,
                );

                if (cw > 0 && ch > 0) {
                  sprite.texture = new PIXI.Texture({
                    source: sprite.texture.source,
                    frame: new PIXI.Rectangle(cx, cy, cw, ch),
                  });
                }
              } else if (
                layer.originalWidth > 0 &&
                sprite.texture.frame.width !== layer.originalWidth
              ) {
                sprite.texture = new PIXI.Texture({
                  source: sprite.texture.source,
                  frame: new PIXI.Rectangle(
                    0,
                    0,
                    layer.originalWidth,
                    layer.originalHeight,
                  ),
                });
              }
            }

            // Handle mask updates for already loaded sprites
            const existingMask = maskSpritesRef.current[layer.id];
            if (
              layer.maskFileId &&
              (!existingMask || existingMask.maskFileId !== layer.maskFileId)
            ) {
              const maskData = await db.files.get(layer.maskFileId);
              if (maskData) {
                const maskBitmap = await window.createImageBitmap(
                  maskData.blob,
                );
                const rawMaskTexture = PIXI.Texture.from(maskBitmap);

                const baseMaskTexture = PIXI.RenderTexture.create({
                  width: layer.originalWidth,
                  height: layer.originalHeight,
                });

                const tempS = new PIXI.Sprite(rawMaskTexture);
                app.renderer.render({
                  container: tempS,
                  target: baseMaskTexture,
                });
                tempS.destroy();

                const renderTexture = PIXI.RenderTexture.create({
                  width: layer.originalWidth,
                  height: layer.originalHeight,
                });

                const tempSprite = new PIXI.Sprite(baseMaskTexture);
                app.renderer.render({
                  container: tempSprite,
                  target: renderTexture,
                });
                tempSprite.destroy();

                let finalTexture: PIXI.Texture = renderTexture;
                if (layer.cropRect) {
                  const cx = Math.max(0, layer.cropRect.x);
                  const cy = Math.max(0, layer.cropRect.y);
                  const cw = Math.min(
                    layer.originalWidth - cx,
                    layer.cropRect.width,
                  );
                  const ch = Math.min(
                    layer.originalHeight - cy,
                    layer.cropRect.height,
                  );
                  if (cw > 0 && ch > 0) {
                    finalTexture = new PIXI.Texture({
                      source: renderTexture.source,
                      frame: new PIXI.Rectangle(cx, cy, cw, ch),
                    });
                  }
                } else {
                  finalTexture = new PIXI.Texture({
                    source: renderTexture.source,
                    frame: new PIXI.Rectangle(
                      0,
                      0,
                      layer.originalWidth,
                      layer.originalHeight,
                    ),
                  });
                }

                const maskSprite = new PIXI.Sprite(
                  finalTexture,
                ) as PIXI.Sprite & {
                  renderTexture?: PIXI.RenderTexture;
                  maskFileId?: string;
                  baseMaskTexture?: PIXI.RenderTexture;
                };
                maskSprite.renderTexture = renderTexture;
                maskSprite.maskFileId = layer.maskFileId;
                maskSprite.baseMaskTexture = baseMaskTexture;
                maskSprite.anchor.set(0.5);
                maskSprite.renderable = false;
                maskSprite.x = sprite.x;
                maskSprite.y = sprite.y;
                maskSprite.scale.set(sprite.scale.x, sprite.scale.y);
                maskSprite.rotation = sprite.rotation;

                app.stage.addChild(maskSprite);
                maskSpritesRef.current[layer.id] = maskSprite;
                sprite.mask = maskSprite;

                // Safely destroy the old mask ONLY after the new one is fully bound to avoid rendering pipeline crashes
                if (existingMask) {
                  app.stage.removeChild(existingMask);
                  if (existingMask.renderTexture) {
                    // Execute destruction after 100ms so PixiJS can complete its frame render and clear its BindGroups
                    setTimeout(() => {
                      if (existingMask.renderTexture)
                        existingMask.renderTexture.destroy(true);
                    }, 100);
                  }
                  existingMask.destroy();
                }

                if (activeTool === "ai-remove-background") {
                  brushControllerRef.current?.setup(
                    sprite,
                    renderTexture,
                    maskSprite.baseMaskTexture,
                    layer.id,
                  );
                }
              }
            } else if (!layer.maskFileId && maskSpritesRef.current[layer.id]) {
              const maskSprite = maskSpritesRef.current[layer.id];
              app.stage.removeChild(maskSprite);
              maskSprite.destroy({ texture: true });
              if (maskSprite.renderTexture)
                maskSprite.renderTexture.destroy(true);
              delete maskSpritesRef.current[layer.id];
              sprite.mask = null;
            }

            continue;
          }

          const fileData = await db.files.get(layer.fileId);
          if (!fileData) continue;

          // Only attempt to render images in PixiJS
          if (!fileData.type.startsWith("image/")) continue;

          try {
            const imageBitmap = await window.createImageBitmap(fileData.blob);

            // Bail out if a newer effect run has already started — avoids duplicate sprites
            if (cancelled) return;

            let texture = PIXI.Texture.from(imageBitmap);

            // Resolve real pixel dimensions directly from the bitmap.
            // Never bail out and re-trigger via the store — that pattern causes a
            // stale-closure deadlock where both async runs see originalWidth===0
            // and both continue without ever creating the sprite.
            const realWidth =
              layer.originalWidth > 0 ? layer.originalWidth : imageBitmap.width;
            const realHeight =
              layer.originalHeight > 0
                ? layer.originalHeight
                : imageBitmap.height;

            // Compute an initial fit-to-canvas scale only for brand-new layers
            const isNewLayer = layer.originalWidth === 0;
            let resolvedScaleX = layer.scaleX;
            let resolvedScaleY = layer.scaleY;
            if (isNewLayer) {
              const maxWidth = app.screen.width * 0.8;
              const maxHeight = app.screen.height * 0.8;
              if (
                imageBitmap.width > maxWidth ||
                imageBitmap.height > maxHeight
              ) {
                const fitScale = Math.min(
                  maxWidth / imageBitmap.width,
                  maxHeight / imageBitmap.height,
                );
                resolvedScaleX = fitScale;
                resolvedScaleY = fitScale;
              }
            }

            const sprite = new PIXI.Sprite(texture) as PIXI.Sprite & {
              isBeingManipulated?: boolean;
            };

            if (layer.cropRect) {
              // Apply non-destructive crop via texture frame
              const cx = Math.max(0, layer.cropRect.x);
              const cy = Math.max(0, layer.cropRect.y);
              const cw = Math.min(realWidth - cx, layer.cropRect.width);
              const ch = Math.min(realHeight - cy, layer.cropRect.height);

              if (cw > 0 && ch > 0) {
                texture = new PIXI.Texture({
                  source: texture.source,
                  frame: new PIXI.Rectangle(cx, cy, cw, ch),
                });
              }
            } else {
              texture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(0, 0, realWidth, realHeight),
              });
            }

            sprite.anchor.set(0.5);
            sprite.x = layer.x;
            sprite.y = layer.y;
            sprite.scale.set(resolvedScaleX, resolvedScaleY);
            sprite.alpha = layer.opacity ?? 1;
            sprite.rotation = layer.rotation || 0;
            sprite.blendMode = (layer.blendMode ||
              "normal") as PIXI.BLEND_MODES;
            sprite.zIndex = (layers.length - i) * 2;
            sprite.eventMode = "static";
            sprite.cursor =
              activeTool === "ai-remove-background" && brushMode !== "none"
                ? getBrushCursor(brushSize || 20)
                : "pointer";

            let dragging = false;
            let dragData: PIXI.FederatedPointerEvent | null = null;
            const offset = { x: 0, y: 0 };
            let dragStartCrop = { x: 0, y: 0, w: 0, h: 0 };

            sprite.on("pointerdown", (e) => {
              const store = useWorkspaceStore.getState();
              store.setActiveLayerId(layer.id);

              if (store.activeTool !== "select" && store.activeTool !== "crop")
                return;

              dragging = true;
              sprite.isBeingManipulated = true;
              dragData = e;
              const localPos = dragData.getLocalPosition(app.stage);

              if (store.activeTool === "crop") {
                offset.x = localPos.x;
                offset.y = localPos.y;
                dragStartCrop = {
                  x: sprite.texture.frame.x,
                  y: sprite.texture.frame.y,
                  w: sprite.texture.frame.width,
                  h: sprite.texture.frame.height,
                };
              } else {
                offset.x = sprite.x - localPos.x;
                offset.y = sprite.y - localPos.y;
              }
            });

            const onDragEnd = () => {
              if (dragging) {
                dragging = false;
                dragData = null;
                sprite.isBeingManipulated = false;

                if (useWorkspaceStore.getState().activeTool === "crop") {
                  useWorkspaceStore.getState().updateLayerTransform(layer.id, {
                    cropRect: {
                      x: sprite.texture.frame.x,
                      y: sprite.texture.frame.y,
                      width: sprite.texture.frame.width,
                      height: sprite.texture.frame.height,
                    },
                  });
                } else {
                  useWorkspaceStore.getState().updateLayerTransform(layer.id, {
                    x: sprite.x,
                    y: sprite.y,
                  });
                }
                // Immediately sync background and mask
                if (maskSpritesRef.current[layer.id]) {
                  maskSpritesRef.current[layer.id].x = sprite.x;
                  maskSpritesRef.current[layer.id].y = sprite.y;
                }
              }
            };

            sprite.on("pointerup", onDragEnd);
            sprite.on("pointerupoutside", onDragEnd);

            sprite.on("globalpointermove", (e) => {
              if (dragging && dragData) {
                const store = useWorkspaceStore.getState();
                const globalPos = e.global;
                const localPos = app.stage.toLocal(globalPos);

                if (store.activeTool === "crop") {
                  const dx = localPos.x - offset.x;
                  const dy = localPos.y - offset.y;

                  const cos = Math.cos(-sprite.rotation);
                  const sin = Math.sin(-sprite.rotation);
                  const rotDx = dx * cos - dy * sin;
                  const rotDy = dx * sin + dy * cos;

                  const unscaledDx = rotDx / Math.abs(sprite.scale.x);
                  const unscaledDy = rotDy / Math.abs(sprite.scale.y);

                  const layerState = store.layers.find(
                    (l) => l.id === layer.id,
                  );
                  if (!layerState) return;

                  let newX = dragStartCrop.x - unscaledDx;
                  let newY = dragStartCrop.y - unscaledDy;

                  newX = Math.max(
                    0,
                    Math.min(newX, layerState.originalWidth - dragStartCrop.w),
                  );
                  newY = Math.max(
                    0,
                    Math.min(newY, layerState.originalHeight - dragStartCrop.h),
                  );

                  sprite.texture = new PIXI.Texture({
                    source: sprite.texture.source,
                    frame: new PIXI.Rectangle(
                      newX,
                      newY,
                      dragStartCrop.w,
                      dragStartCrop.h,
                    ),
                  });
                } else {
                  sprite.x = localPos.x + offset.x;
                  sprite.y = localPos.y + offset.y;
                }

                if (maskSpritesRef.current[layer.id]) {
                  const maskS = maskSpritesRef.current[layer.id];
                  maskS.x = sprite.x;
                  maskS.y = sprite.y;
                  maskS.scale.set(sprite.scale.x, sprite.scale.y);
                  if (store.activeTool === "crop") {
                    maskS.texture = new PIXI.Texture({
                      source: maskS.texture.source,
                      frame: sprite.texture.frame.clone(),
                    });
                  }
                }
              }
            });

            app.stage.addChild(sprite);
            spritesRef.current[layer.id] = sprite;

            const existingMask = maskSpritesRef.current[layer.id];
            if (
              layer.maskFileId &&
              (!existingMask || existingMask.maskFileId !== layer.maskFileId)
            ) {
              const maskData = await db.files.get(layer.maskFileId);
              if (maskData) {
                const maskBitmap = await window.createImageBitmap(
                  maskData.blob,
                );
                const rawMaskTexture = PIXI.Texture.from(maskBitmap);

                const baseMaskTexture = PIXI.RenderTexture.create({
                  width: layer.originalWidth,
                  height: layer.originalHeight,
                });

                const tempS = new PIXI.Sprite(rawMaskTexture);
                app.renderer.render({
                  container: tempS,
                  target: baseMaskTexture,
                });
                tempS.destroy();

                const renderTexture = PIXI.RenderTexture.create({
                  width: layer.originalWidth,
                  height: layer.originalHeight,
                });

                const tempSprite = new PIXI.Sprite(baseMaskTexture);
                app.renderer.render({
                  container: tempSprite,
                  target: renderTexture,
                });
                tempSprite.destroy();

                let finalTexture: PIXI.Texture = renderTexture;
                if (layer.cropRect) {
                  const cx = Math.max(0, layer.cropRect.x);
                  const cy = Math.max(0, layer.cropRect.y);
                  const cw = Math.min(
                    layer.originalWidth - cx,
                    layer.cropRect.width,
                  );
                  const ch = Math.min(
                    layer.originalHeight - cy,
                    layer.cropRect.height,
                  );
                  if (cw > 0 && ch > 0) {
                    finalTexture = new PIXI.Texture({
                      source: renderTexture.source,
                      frame: new PIXI.Rectangle(cx, cy, cw, ch),
                    });
                  }
                } else {
                  finalTexture = new PIXI.Texture({
                    source: renderTexture.source,
                    frame: new PIXI.Rectangle(
                      0,
                      0,
                      layer.originalWidth,
                      layer.originalHeight,
                    ),
                  });
                }

                const maskSprite = new PIXI.Sprite(
                  finalTexture,
                ) as PIXI.Sprite & {
                  renderTexture?: PIXI.RenderTexture;
                  maskFileId?: string;
                  baseMaskTexture?: PIXI.RenderTexture;
                };
                maskSprite.renderTexture = renderTexture;
                maskSprite.maskFileId = layer.maskFileId;
                maskSprite.baseMaskTexture = baseMaskTexture;
                maskSprite.anchor.set(0.5);
                maskSprite.renderable = false;
                maskSprite.x = sprite.x;
                maskSprite.y = sprite.y;
                maskSprite.scale.set(sprite.scale.x, sprite.scale.y);
                maskSprite.rotation = sprite.rotation;

                app.stage.addChild(maskSprite);
                maskSpritesRef.current[layer.id] = maskSprite;
                sprite.mask = maskSprite;

                // Safely destroy the old mask ONLY after the new one is fully bound to avoid rendering pipeline crashes
                if (existingMask) {
                  app.stage.removeChild(existingMask);
                  if (existingMask.renderTexture) {
                    // Execute destruction after 100ms so PixiJS can complete its frame render and clear its BindGroups
                    setTimeout(() => {
                      if (existingMask.renderTexture)
                        existingMask.renderTexture.destroy(true);
                    }, 100);
                  }
                  existingMask.destroy();
                }

                if (activeTool === "ai-remove-background") {
                  brushControllerRef.current?.setup(
                    sprite,
                    renderTexture,
                    maskSprite.baseMaskTexture,
                    layer.id,
                  );
                }
              }
            }
            setSpriteUpdateTick((t) => t + 1); // Trigger overlay update

            // Persist the resolved dimensions and scale back to the store.
            // Do this AFTER the sprite is safely on stage so there is no
            // second render pass needed (avoids the stale-closure deadlock).
            useWorkspaceStore.getState().updateLayerTransform(
              layer.id,
              {
                originalWidth: realWidth,
                originalHeight: realHeight,
                scaleX: resolvedScaleX,
                scaleY: resolvedScaleY,
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
            queueMicrotask(() => {
              alert(
                `INIT Crash in renderLayers! Error: ${(error as Error)?.message || error}\nStack: ${(error as Error)?.stack}`,
              );
            });
          }
        } catch (updateErr) {
          queueMicrotask(() => {
            alert(
              `UPDATE Crash in renderLayers! Error: ${(updateErr as Error)?.message || updateErr}\nStack: ${(updateErr as Error)?.stack}`,
            );
          });
        }
      }
    };

    renderLayers();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, isPixiReady, activeTool, brushMode, brushSize]); // Re-render when layers change or Pixi becomes ready
}
