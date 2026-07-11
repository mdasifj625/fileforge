"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as PIXI from "pixi.js";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>(null);
  const spritesRef = useRef<
    Record<string, PIXI.Sprite & { isBeingManipulated?: boolean }>
  >({});
  const transformOverlayRef = useRef<PIXI.Container>(null);
  const gridRef = useRef<PIXI.Graphics>(null);
  const [spriteUpdateTick, setSpriteUpdateTick] = useState(0);

  const addLayer = useWorkspaceStore((state) => state.addLayer);
  const layers = useWorkspaceStore((state) => state.layers);
  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const exportTrigger = useWorkspaceStore((state) => state.exportTrigger);

  // Export Logic
  useEffect(() => {
    if (exportTrigger > 0 && appRef.current) {
      const app = appRef.current;
      const grid = gridRef.current;
      const overlay = transformOverlayRef.current;

      const wasGridVisible = grid?.visible;
      const wasOverlayVisible = overlay?.visible;

      if (grid) grid.visible = false;
      if (overlay) overlay.visible = false;

      // Force synchronous render to ensure the canvas doesn't have the grid/overlay
      app.renderer.render(app.stage);

      app.canvas.toBlob((blob) => {
        if (blob) {
          useWorkspaceStore.getState().setExportImageBlob(blob);
        }
        if (grid) grid.visible = wasGridVisible ?? true;
        if (overlay) overlay.visible = wasOverlayVisible ?? true;
        app.renderer.render(app.stage); // Render again to restore UI
      }, "image/png");
    }
  }, [exportTrigger]);

  // PIXI Initialization
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
      grid.lineStyle(1, 0x888888, 0.15); // Neutral transparent grid works on light/dark
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
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Render Pipeline: Listen to layers and render them
  useEffect(() => {
    const renderLayers = async () => {
      const app = appRef.current;
      if (!app) return;

      // Clean up deleted layers
      const currentLayerIds = new Set(layers.map((l) => l.id));
      for (const id in spritesRef.current) {
        if (!currentLayerIds.has(id)) {
          const sprite = spritesRef.current[id];
          app.stage.removeChild(sprite);
          sprite.destroy({ texture: true });
          delete spritesRef.current[id];
        }
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];

        if (spritesRef.current[layer.id]) {
          const sprite = spritesRef.current[layer.id];
          sprite.visible = layer.visible;
          sprite.zIndex = layers.length - i;

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
            const cw = Math.min(layer.originalWidth - cx, layer.cropRect.width);
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

          const initialX = layer.x !== 0 ? layer.x : app.screen.width / 2;
          const initialY = layer.y !== 0 ? layer.y : app.screen.height / 2;

          sprite.x = initialX;
          sprite.y = initialY;

          const scaleX = (app.screen.width * 0.8) / sprite.width;
          const scaleY = (app.screen.height * 0.8) / sprite.height;
          const defaultScale = Math.min(scaleX, scaleY, 1);

          sprite.scale.set(layer.scaleX !== 1 ? layer.scaleX : defaultScale);

          sprite.zIndex = layers.length - i;
          sprite.eventMode = "static";
          sprite.cursor = "pointer";

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

                const layerState = store.layers.find((l) => l.id === layer.id);
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
            }
          });

          app.stage.addChild(sprite);
          spritesRef.current[layer.id] = sprite;
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
          console.error("Failed to load texture for layer", layer.name, error);

          // Gracefully handle decode errors
          useWorkspaceStore.getState().removeLayer(layer.id);
          db.files.delete(layer.fileId).catch(console.error);

          // Use a microtask to alert so it doesn't block rendering
          queueMicrotask(() => {
            alert(
              `Failed to decode image "${layer.name}". The file might be corrupted, unsupported, or a glitch occurred in storage.`,
            );
          });
        }
      }
    };

    renderLayers();
  }, [layers]); // Deliberately removed activeLayerId so it doesn't re-render sprites just on selection change

  // Draw and Manage the Transform Overlay for the Active Layer
  useEffect(() => {
    const app = appRef.current;
    const overlay = transformOverlayRef.current;
    if (!app || !overlay) return;

    overlay.removeChildren();

    if (
      (activeTool !== "select" && activeTool !== "crop") ||
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
  }, [activeLayerId, activeTool, spriteUpdateTick]);

  // Handle File Drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = uuidv4();
        const layerId = uuidv4();

        // Normalize the File to a pure Blob backed by an ArrayBuffer.
        // This prevents obscure IndexedDB serialization bugs on some browsers
        // where File objects lose their backing data.
        const buffer = await file.arrayBuffer();
        const normalizedBlob = new Blob([buffer], { type: file.type });

        await db.files.add({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: normalizedBlob,
          createdAt: Date.now(),
        });

        addLayer({
          id: layerId,
          fileId: fileId,
          originalFileId: fileId,
          name: file.name,
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          originalWidth: 0,
          originalHeight: 0,
        });
      }

      useWorkspaceStore.getState().setActiveTool("select");
    },
    [addLayer],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "image/*": [],
      "application/pdf": [],
      "video/*": [],
      "audio/*": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <input {...getInputProps()} />

      <div ref={containerRef} className="absolute inset-0" />

      {/* Floating Add Button when layers exist */}
      {layers.length > 0 && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <button
            onClick={open}
            className="bg-panel/80 hover:bg-muted text-foreground text-xs px-3 py-1.5 rounded-md border border-panel-border shadow-sm backdrop-blur-md transition-colors flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Layer
          </button>
        </div>
      )}

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
    </div>
  );
}
