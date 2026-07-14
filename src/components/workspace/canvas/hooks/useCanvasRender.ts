"use client";

import { useEffect, useState } from "react";
import * as PIXI from "pixi.js";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import { CanvasRefs } from "../types";

function getBrushCursor(size: number) {
  const svg = `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="black" stroke-width="1.5"/><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="white" stroke-width="1" stroke-dasharray="3,3"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${size} ${size}, crosshair`;
}

export function useCanvasRender(refs: CanvasRefs, isPixiReady: boolean) {
  const {
    appRef,
    spritesRef,
    bgSpritesRef,
    maskSpritesRef,
    transformOverlayRef,
    brushControllerRef,
  } = refs;

  const [spriteUpdateTick, setSpriteUpdateTick] = useState(0);

  const layers = useWorkspaceStore((state) => state.layers);
  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const brushMode = useWorkspaceStore((state) => state.brushMode);
  const brushSize = useWorkspaceStore((state) => state.brushSize);
  // We assume isPixiReady is essentially checked by appRef.current being available

  // Render Pipeline: Listen to layers and render them
  useEffect(() => {
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

          const bgSprite = bgSpritesRef.current[id];
          if (bgSprite) {
            app.stage.removeChild(bgSprite);
            bgSprite.destroy();
            delete bgSpritesRef.current[id];
          }

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

            let bgSprite = bgSpritesRef.current[layer.id];
            if (!bgSprite) {
              bgSprite = new PIXI.Graphics();
              app.stage.addChild(bgSprite);
              bgSpritesRef.current[layer.id] = bgSprite;
            }
            bgSprite.visible = layer.visible;
            bgSprite.zIndex = (layers.length - i) * 2 - 1;

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

                // Apply Edge Controls by re-rendering the mask texture if needed
                const feather = layer.edgeFeather || 0;
                const shift = layer.edgeShift || 0;

                if (
                  maskS.baseMaskTexture &&
                  maskS.renderTexture &&
                  (maskS.currentFeather !== feather ||
                    maskS.currentShift !== shift)
                ) {
                  const tempSprite = new PIXI.Sprite(maskS.baseMaskTexture);
                  const filters = [];

                  if (shift !== 0) {
                    filters.push(new PIXI.BlurFilter(Math.abs(shift)));
                    const shiftFilter = new PIXI.ColorMatrixFilter();
                    const threshold = 0.5 - shift / 40.0;
                    shiftFilter.matrix = [
                      1,
                      0,
                      0,
                      0,
                      0,
                      0,
                      1,
                      0,
                      0,
                      0,
                      0,
                      0,
                      1,
                      0,
                      0,
                      0,
                      0,
                      0,
                      20,
                      -20 * threshold,
                    ];
                    filters.push(shiftFilter);
                  }

                  if (feather > 0) {
                    filters.push(new PIXI.BlurFilter(feather));
                  }

                  tempSprite.filters = filters.length > 0 ? filters : null;

                  app.renderer.render({
                    container: tempSprite,
                    target: maskS.renderTexture,
                    clear: true,
                  });

                  tempSprite.destroy();

                  maskS.currentFeather = feather;
                  maskS.currentShift = shift;
                }
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

            // Update background rect
            bgSprite.clear();
            if (layer.backgroundColor) {
              const colorNumber = parseInt(
                layer.backgroundColor.replace("#", "0x"),
                16,
              );
              bgSprite.beginFill(colorNumber);
              bgSprite.drawRect(
                -sprite.texture.width / 2,
                -sprite.texture.height / 2,
                sprite.texture.width,
                sprite.texture.height,
              );
              bgSprite.endFill();
              bgSprite.x = sprite.x;
              bgSprite.y = sprite.y;
              bgSprite.scale.set(sprite.scale.x, sprite.scale.y);
              bgSprite.rotation = sprite.rotation;
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
                  currentFeather?: number;
                  currentShift?: number;
                };
                maskSprite.renderTexture = renderTexture;
                maskSprite.maskFileId = layer.maskFileId;
                maskSprite.baseMaskTexture = baseMaskTexture;
                maskSprite.currentFeather = undefined;
                maskSprite.currentShift = undefined;
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
            let texture = PIXI.Texture.from(imageBitmap);

            if (layer.originalWidth === 0 || layer.originalHeight === 0) {
              useWorkspaceStore.getState().updateLayerTransform(layer.id, {
                originalWidth: imageBitmap.width,
                originalHeight: imageBitmap.height,
              });
              // We exit this render cycle since the state update will immediately trigger another one
              // with the correct originalWidth/Height, avoiding layout jumping
              continue;
            }

            const sprite = new PIXI.Sprite(texture) as PIXI.Sprite & {
              isBeingManipulated?: boolean;
            };

            if (layer.cropRect) {
              // Apply non-destructive crop via texture frame
              // Clamp values to prevent WebGL errors if cropRect exceeds bounds
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
                texture = new PIXI.Texture({
                  source: texture.source,
                  frame: new PIXI.Rectangle(cx, cy, cw, ch),
                });
              }
            } else {
              texture = new PIXI.Texture({
                source: texture.source,
                frame: new PIXI.Rectangle(
                  0,
                  0,
                  layer.originalWidth,
                  layer.originalHeight,
                ),
              });
            }

            sprite.anchor.set(0.5);

            const initialX = layer.x;
            const initialY = layer.y;

            sprite.x = initialX;
            sprite.y = initialY;

            const scaleX = (app.screen.width * 0.8) / sprite.width;
            const scaleY = (app.screen.height * 0.8) / sprite.height;
            const defaultScale = Math.min(scaleX, scaleY, 1);

            sprite.scale.set(layer.scaleX !== 1 ? layer.scaleX : defaultScale);

            sprite.zIndex = (layers.length - i) * 2;
            sprite.eventMode = "static";
            sprite.cursor =
              activeTool === "ai-remove-background" && brushMode !== "none"
                ? getBrushCursor(brushSize || 20)
                : "pointer";

            let bgSprite = bgSpritesRef.current[layer.id];
            if (!bgSprite) {
              bgSprite = new PIXI.Graphics();
              app.stage.addChild(bgSprite);
              bgSpritesRef.current[layer.id] = bgSprite;
            }
            bgSprite.visible = layer.visible;
            bgSprite.zIndex = (layers.length - i) * 2 - 1;

            // Initial bg rect setup
            bgSprite.clear();
            if (layer.backgroundColor) {
              const colorNumber = parseInt(
                layer.backgroundColor.replace("#", "0x"),
                16,
              );
              bgSprite.beginFill(colorNumber);
              bgSprite.drawRect(
                -sprite.texture.width / 2,
                -sprite.texture.height / 2,
                sprite.texture.width,
                sprite.texture.height,
              );
              bgSprite.endFill();
              bgSprite.x = sprite.x;
              bgSprite.y = sprite.y;
              bgSprite.scale.set(sprite.scale.x, sprite.scale.y);
              bgSprite.rotation = sprite.rotation;
            }

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
                if (bgSpritesRef.current[layer.id]) {
                  bgSpritesRef.current[layer.id].x = sprite.x;
                  bgSpritesRef.current[layer.id].y = sprite.y;
                }
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

                // Instantly update background graphics while manipulating
                if (bgSpritesRef.current[layer.id]) {
                  const bg = bgSpritesRef.current[layer.id];
                  bg.x = sprite.x;
                  bg.y = sprite.y;
                  bg.scale.set(sprite.scale.x, sprite.scale.y);
                  if (store.activeTool === "crop") {
                    bg.clear();
                    if (layer.backgroundColor) {
                      const colorNumber = parseInt(
                        layer.backgroundColor.replace("#", "0x"),
                        16,
                      );
                      bg.beginFill(colorNumber);
                      bg.drawRect(
                        -sprite.texture.width / 2,
                        -sprite.texture.height / 2,
                        sprite.texture.width,
                        sprite.texture.height,
                      );
                      bg.endFill();
                    }
                  }
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
                  currentFeather?: number;
                  currentShift?: number;
                };
                maskSprite.renderTexture = renderTexture;
                maskSprite.maskFileId = layer.maskFileId;
                maskSprite.baseMaskTexture = baseMaskTexture;
                maskSprite.currentFeather = undefined;
                maskSprite.currentShift = undefined;
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

            if (layer.x === 0 && layer.y === 0) {
              useWorkspaceStore.getState().updateLayerTransform(layer.id, {
                x: sprite.x,
                y: sprite.y,
                scaleX: sprite.scale.x,
                scaleY: sprite.scale.y,
              });
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, isPixiReady, activeTool, brushMode, brushSize]); // Re-render when layers change or Pixi becomes ready

  // Draw and Manage the Transform Overlay for the Active Layer
  useEffect(() => {
    const app = appRef.current;

    // Also attach mask brush controller if tool changed and we have a mask
    if (activeTool === "ai-remove-background" && activeLayerId) {
      const sprite = spritesRef.current[activeLayerId];
      const maskS = maskSpritesRef.current[activeLayerId];
      if (
        sprite &&
        maskS &&
        maskS.renderTexture &&
        brushControllerRef.current
      ) {
        brushControllerRef.current.setup(
          sprite,
          maskS.renderTexture,
          maskS.baseMaskTexture,
          activeLayerId,
        );
      }
    } else {
      brushControllerRef.current?.cleanup();
    }

    const overlay = transformOverlayRef.current;
    if (!app || !overlay) return;

    overlay.removeChildren();

    if (
      (!activeTool?.startsWith("image-") &&
        !activeTool?.startsWith("ai-") &&
        activeTool !== "select" &&
        activeTool !== "crop") ||
      !activeLayerId ||
      !spritesRef.current[activeLayerId]
    )
      return;

    const activeSprite = spritesRef.current[activeLayerId] as PIXI.Sprite & {
      isBeingManipulated?: boolean;
    };

    // Draw bounding box
    const boundsBox = new PIXI.Graphics();
    overlay.addChild(boundsBox);

    const isCropMode = activeTool === "crop";
    let cropGhostSprite: PIXI.Sprite | null = null;

    if (isCropMode) {
      const layer = useWorkspaceStore
        .getState()
        .layers.find((l) => l.id === activeLayerId);
      if (layer && layer.originalWidth > 0) {
        const ghostTexture = new PIXI.Texture({
          source: activeSprite.texture.source,
          frame: new PIXI.Rectangle(
            0,
            0,
            layer.originalWidth,
            layer.originalHeight,
          ),
        });
        cropGhostSprite = new PIXI.Sprite(ghostTexture);
        cropGhostSprite.anchor.set(0.5);
        cropGhostSprite.alpha = 0.3; // Dimmed uncropped region
        overlay.addChildAt(cropGhostSprite, 0);
      }
    }

    const handles = isCropMode
      ? [
          { id: "tl", x: -1, y: -1 },
          { id: "t", x: 0, y: -1 },
          { id: "tr", x: 1, y: -1 },
          { id: "r", x: 1, y: 0 },
          { id: "br", x: 1, y: 1 },
          { id: "b", x: 0, y: 1 },
          { id: "bl", x: -1, y: 1 },
          { id: "l", x: -1, y: 0 },
        ]
      : [
          { id: "tl", x: -1, y: -1 },
          { id: "tr", x: 1, y: -1 },
          { id: "bl", x: -1, y: 1 },
          { id: "br", x: 1, y: 1 },
        ];

    const handleGraphics: PIXI.Graphics[] = [];
    const overlayColor = isCropMode ? 0x10b981 : 0x3b82f6; // Green for crop, Blue for select

    handles.forEach((pos) => {
      const handle = new PIXI.Graphics();
      handle.beginFill(0xffffff); // White interior
      handle.lineStyle(1.5, overlayColor, 1);
      // Draw a crisp square like Figma (edges can be slightly thinner rectangles if desired, but squares are fine)
      if (pos.x === 0 || pos.y === 0) {
        handle.drawRect(-3.5, -3.5, 7, 7); // slightly smaller for edges
      } else {
        handle.drawRect(-4.5, -4.5, 9, 9);
      }
      handle.endFill();
      handle.eventMode = "static";

      if (pos.id === "tl" || pos.id === "br") handle.cursor = "nwse-resize";
      else if (pos.id === "tr" || pos.id === "bl")
        handle.cursor = "nesw-resize";
      else if (pos.id === "t" || pos.id === "b") handle.cursor = "ns-resize";
      else handle.cursor = "ew-resize";

      let isManipulating = false;
      let startScaleX = 1;
      let startScaleY = 1;
      let startPointerPos: PIXI.Point | null = null;

      // Crop specific state
      let startCropRect = { x: 0, y: 0, width: 0, height: 0 };
      let currentCropRect = { x: 0, y: 0, width: 0, height: 0 };
      let startSpriteX = 0;
      let startSpriteY = 0;
      let originalW = 0;
      let originalH = 0;

      handle.on("pointerdown", (e) => {
        isManipulating = true;
        activeSprite.isBeingManipulated = true;
        startPointerPos = e.getLocalPosition(app.stage).clone();
        startScaleX = activeSprite.scale.x;
        startScaleY = activeSprite.scale.y;
        startSpriteX = activeSprite.x;
        startSpriteY = activeSprite.y;

        const layer = useWorkspaceStore
          .getState()
          .layers.find((l) => l.id === activeLayerId);
        if (layer) {
          originalW = layer.originalWidth;
          originalH = layer.originalHeight;
          startCropRect = layer.cropRect
            ? { ...layer.cropRect }
            : { x: 0, y: 0, width: originalW, height: originalH };
          currentCropRect = { ...startCropRect };
        }

        e.stopPropagation(); // Prevent dragging the sprite itself
      });

      const onManipulateEnd = () => {
        if (isManipulating) {
          isManipulating = false;
          activeSprite.isBeingManipulated = false;

          if (isCropMode) {
            useWorkspaceStore.getState().updateLayerTransform(activeLayerId, {
              cropRect: {
                x: currentCropRect.x,
                y: currentCropRect.y,
                width: currentCropRect.width,
                height: currentCropRect.height,
              },
              x: activeSprite.x,
              y: activeSprite.y,
            });
          } else {
            useWorkspaceStore.getState().updateLayerTransform(activeLayerId, {
              scaleX: activeSprite.scale.x,
              scaleY: activeSprite.scale.y,
              x: activeSprite.x,
              y: activeSprite.y,
            });
          }
          if (bgSpritesRef.current[activeLayerId]) {
            const bg = bgSpritesRef.current[activeLayerId];
            bg.x = activeSprite.x;
            bg.y = activeSprite.y;
            bg.scale.set(activeSprite.scale.x, activeSprite.scale.y);
          }
          if (maskSpritesRef.current[activeLayerId]) {
            const maskS = maskSpritesRef.current[activeLayerId];
            maskS.x = activeSprite.x;
            maskS.y = activeSprite.y;
            maskS.scale.set(activeSprite.scale.x, activeSprite.scale.y);
          }
        }
      };

      handle.on("pointerup", onManipulateEnd);
      handle.on("pointerupoutside", onManipulateEnd);

      handle.on("globalpointermove", (e) => {
        if (isManipulating && startPointerPos) {
          const currentPos = e.global;
          const localPos = app.stage.toLocal(currentPos);
          const dx = localPos.x - startPointerPos.x;
          const dy = localPos.y - startPointerPos.y;

          if (isCropMode) {
            // Unscaled pixel deltas from absolute start pointer
            const unscaledDx = dx / startScaleX;
            const unscaledDy = dy / startScaleY;

            let newCropW = startCropRect.width;
            let newCropH = startCropRect.height;

            const layerState = useWorkspaceStore
              .getState()
              .layers.find((l) => l.id === activeLayerId);
            const rawRatio = layerState?.cropAspectRatio;
            let ratio: number | null = null;
            if (rawRatio === "original") ratio = originalW / originalH;
            else if (typeof rawRatio === "number") ratio = rawRatio;

            // 1. Calculate max bounds for width and height based on handle position
            let maxAllowedW = originalW;
            let maxAllowedH = originalH;

            if (pos.x === -1) {
              maxAllowedW = startCropRect.x + startCropRect.width;
            } else if (pos.x === 1) {
              maxAllowedW = originalW - startCropRect.x;
            } else if (pos.x === 0) {
              const centerX = startCropRect.x + startCropRect.width / 2;
              maxAllowedW = Math.min(centerX, originalW - centerX) * 2;
            }

            if (pos.y === -1) {
              maxAllowedH = startCropRect.y + startCropRect.height;
            } else if (pos.y === 1) {
              maxAllowedH = originalH - startCropRect.y;
            } else if (pos.y === 0) {
              const centerY = startCropRect.y + startCropRect.height / 2;
              maxAllowedH = Math.min(centerY, originalH - centerY) * 2;
            }

            if (ratio) {
              if (maxAllowedW / maxAllowedH > ratio)
                maxAllowedW = maxAllowedH * ratio;
              else maxAllowedH = maxAllowedW / ratio;
            }

            // 2. Compute proposed W and H from mouse delta
            if (pos.x === -1) newCropW -= unscaledDx;
            else if (pos.x === 1) newCropW += unscaledDx;

            if (pos.y === -1) newCropH -= unscaledDy;
            else if (pos.y === 1) newCropH += unscaledDy;

            // 3. Apply ratio logic to W and H
            if (ratio) {
              if (pos.x !== 0 && pos.y !== 0) {
                if (Math.abs(unscaledDx) > Math.abs(unscaledDy * ratio))
                  newCropH = newCropW / ratio;
                else newCropW = newCropH * ratio;
              } else if (pos.x === 0 && pos.y !== 0) {
                newCropW = newCropH * ratio;
              } else if (pos.y === 0 && pos.x !== 0) {
                newCropH = newCropW / ratio;
              }
            }

            // 4. Clamp W and H to their bounds (and min 10)
            newCropW = Math.max(10, Math.min(newCropW, maxAllowedW));
            newCropH = Math.max(10, Math.min(newCropH, maxAllowedH));

            // Re-enforce ratio strictly after clamping
            if (ratio) {
              if (newCropW / newCropH > ratio + 0.001)
                newCropW = newCropH * ratio;
              else if (newCropW / newCropH < ratio - 0.001)
                newCropH = newCropW / ratio;
            }

            // 5. Compute X and Y based strictly on the final W and H
            let newCropX = startCropRect.x;
            let newCropY = startCropRect.y;

            if (pos.x === -1)
              newCropX = startCropRect.x + startCropRect.width - newCropW;
            else if (pos.x === 0)
              newCropX =
                startCropRect.x + startCropRect.width / 2 - newCropW / 2;

            if (pos.y === -1)
              newCropY = startCropRect.y + startCropRect.height - newCropH;
            else if (pos.y === 0)
              newCropY =
                startCropRect.y + startCropRect.height / 2 - newCropH / 2;

            // Update texture frame immediately
            activeSprite.texture = new PIXI.Texture({
              source: activeSprite.texture.source,
              frame: new PIXI.Rectangle(newCropX, newCropY, newCropW, newCropH),
            });

            // To prevent the image from visually sliding, we must calculate the exact absolute shift
            // between the start crop center and the new crop center
            const oldCenterUnscaledX =
              startCropRect.x + startCropRect.width / 2;
            const oldCenterUnscaledY =
              startCropRect.y + startCropRect.height / 2;
            const newCenterUnscaledX = newCropX + newCropW / 2;
            const newCenterUnscaledY = newCropY + newCropH / 2;

            const absoluteShiftX =
              (newCenterUnscaledX - oldCenterUnscaledX) * Math.abs(startScaleX);
            const absoluteShiftY =
              (newCenterUnscaledY - oldCenterUnscaledY) * Math.abs(startScaleY);

            const cos = Math.cos(activeSprite.rotation);
            const sin = Math.sin(activeSprite.rotation);

            // Apply rotation to the shift vector
            const rotatedShiftX = absoluteShiftX * cos - absoluteShiftY * sin;
            const rotatedShiftY = absoluteShiftX * sin + absoluteShiftY * cos;

            activeSprite.x = startSpriteX + rotatedShiftX;
            activeSprite.y = startSpriteY + rotatedShiftY;

            // Save the state for pointerup
            currentCropRect = {
              x: newCropX,
              y: newCropY,
              width: newCropW,
              height: newCropH,
            };
          } else {
            const signX = pos.x;
            const scaleDelta = (dx * signX * 2) / activeSprite.texture.width;

            let newScaleX = startScaleX + scaleDelta;
            let newScaleY =
              startScaleY + scaleDelta * (startScaleY / startScaleX);

            if (newScaleX < 0.05) newScaleX = 0.05;
            if (newScaleY < 0.05) newScaleY = 0.05;

            activeSprite.scale.set(newScaleX, newScaleY);
          }

          if (bgSpritesRef.current[activeLayerId]) {
            const bg = bgSpritesRef.current[activeLayerId];
            bg.x = activeSprite.x;
            bg.y = activeSprite.y;
            bg.scale.set(activeSprite.scale.x, activeSprite.scale.y);
            if (isCropMode) {
              const layer = useWorkspaceStore
                .getState()
                .layers.find((l) => l.id === activeLayerId);
              bg.clear();
              if (layer?.backgroundColor) {
                const colorNumber = parseInt(
                  layer.backgroundColor.replace("#", "0x"),
                  16,
                );
                bg.beginFill(colorNumber);
                bg.drawRect(
                  -activeSprite.texture.width / 2,
                  -activeSprite.texture.height / 2,
                  activeSprite.texture.width,
                  activeSprite.texture.height,
                );
                bg.endFill();
              }
            }
          }

          if (maskSpritesRef.current[activeLayerId]) {
            const maskS = maskSpritesRef.current[activeLayerId];
            maskS.x = activeSprite.x;
            maskS.y = activeSprite.y;
            maskS.scale.set(activeSprite.scale.x, activeSprite.scale.y);
            if (isCropMode) {
              maskS.texture = new PIXI.Texture({
                source: maskS.texture.source,
                frame: activeSprite.texture.frame.clone(),
              });
            }
          }
        }
      });

      handleGraphics.push(handle);
      overlay.addChild(handle);
    });

    // Ticker to continuously update the overlay position to perfectly track the sprite
    const updateOverlay = () => {
      if (!activeSprite.visible || activeSprite.destroyed) {
        overlay.visible = false;
        return;
      }
      overlay.visible = true;

      const width = activeSprite.texture.width * Math.abs(activeSprite.scale.x);
      const height =
        activeSprite.texture.height * Math.abs(activeSprite.scale.y);

      boundsBox.clear();
      boundsBox.lineStyle(2, overlayColor, 1);
      // Draw relative to the sprite's center
      boundsBox.drawRect(-width / 2, -height / 2, width, height);

      boundsBox.position.set(activeSprite.x, activeSprite.y);
      boundsBox.rotation = activeSprite.rotation;

      // Position handles
      handleGraphics.forEach((handle, i) => {
        const pos = handles[i];
        // Calculate local corner
        const lx = (width / 2) * pos.x;
        const ly = (height / 2) * pos.y;

        // Apply sprite rotation
        const cos = Math.cos(activeSprite.rotation);
        const sin = Math.sin(activeSprite.rotation);

        handle.x = activeSprite.x + (lx * cos - ly * sin);
        handle.y = activeSprite.y + (lx * sin + ly * cos);
      });

      // Update ghost sprite if present
      if (cropGhostSprite && isCropMode) {
        const layer = useWorkspaceStore
          .getState()
          .layers.find((l) => l.id === activeLayerId);
        if (layer) {
          const cw = layer.originalWidth;
          const ch = layer.originalHeight;
          const cropX = activeSprite.texture.frame.x;
          const cropY = activeSprite.texture.frame.y;
          const cropW = activeSprite.texture.frame.width;
          const cropH = activeSprite.texture.frame.height;

          // Calculate center offset between the original image and the cropped image (in unscaled pixels)
          const dx = cropX + cropW / 2 - cw / 2;
          const dy = cropY + cropH / 2 - ch / 2;

          const cos = Math.cos(activeSprite.rotation);
          const sin = Math.sin(activeSprite.rotation);

          // Calculate global shift
          const shiftX = (dx * cos - dy * sin) * Math.abs(activeSprite.scale.x);
          const shiftY = (dx * sin + dy * cos) * Math.abs(activeSprite.scale.y);

          cropGhostSprite.x = activeSprite.x - shiftX;
          cropGhostSprite.y = activeSprite.y - shiftY;
          cropGhostSprite.scale.set(activeSprite.scale.x, activeSprite.scale.y);
          cropGhostSprite.rotation = activeSprite.rotation;
        }
      }
    };

    app.ticker.add(updateOverlay);

    return () => {
      app.ticker.remove(updateOverlay);
      overlay.removeChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayerId, activeTool, spriteUpdateTick]);
}
