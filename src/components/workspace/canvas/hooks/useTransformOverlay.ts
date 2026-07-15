"use client";

import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CanvasRefs } from "../types";

export function useTransformOverlay(
  refs: CanvasRefs,
  isPixiReady: boolean,
  spriteUpdateTick: number,
) {
  const {
    appRef,
    spritesRef,
    maskSpritesRef,
    transformOverlayRef,
    brushControllerRef,
  } = refs;

  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const theme = useWorkspaceStore((state) => state.theme);
  // We assume isPixiReady is essentially checked by appRef.current being available
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

    const isDark = document.documentElement.classList.contains("dark");
    const handleFillColor = isDark ? 0xffffff : 0x111111;
    const handleStrokeColor = isDark ? 0x000000 : 0xffffff;
    const handleStrokeAlpha = isDark ? 0.3 : 0.8;

    handles.forEach((pos) => {
      const handle = new PIXI.Graphics();
      if (isCropMode) {
        if (pos.x === 0 || pos.y === 0) {
          // Edges (Pill)
          if (pos.x === 0) {
            const yOffset = -2.5;
            handle.roundRect(-16, yOffset, 32, 5, 2.5);
          } else {
            const xOffset = -2.5;
            handle.roundRect(xOffset, -16, 5, 32, 2.5);
          }
        } else {
          // Corners (L-Shape)
          const th = 5;
          const len = 24;
          // Horizontal leg
          const hX = pos.x === -1 ? -th / 2 : -len + th / 2;
          const hY = pos.y === -1 ? -th / 2 : -th / 2;
          handle.roundRect(hX, hY, len, th, 2.5);
          // Vertical leg
          const vX = pos.x === -1 ? -th / 2 : -th / 2;
          const vY = pos.y === -1 ? -th / 2 : -len + th / 2;
          handle.roundRect(vX, vY, th, len, 2.5);
        }
        handle.fill({ color: handleFillColor });
        handle.stroke({
          width: 1.5,
          color: handleStrokeColor,
          alpha: handleStrokeAlpha,
        });
      } else {
        if (pos.x === 0 || pos.y === 0) {
          handle.rect(-3.5, -3.5, 7, 7); // slightly smaller for edges
        } else {
          handle.rect(-4.5, -4.5, 9, 9);
        }
        handle.fill({ color: handleFillColor });
        handle.stroke({ width: 1.5, color: overlayColor, alpha: 1 });
      }

      // Expand hit area significantly for mobile touch targets
      handle.hitArea = new PIXI.Rectangle(-24, -24, 48, 48);

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

            // To prevent the image from sliding, we must calculate the exact absolute shift
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

      const isDark = document.documentElement.classList.contains("dark");
      const boxColor = isCropMode
        ? isDark
          ? 0xffffff
          : 0x111111
        : overlayColor;
      const boxAlpha = isCropMode ? 0.9 : 1;

      if (isCropMode) {
        // Draw shadow/outline first for high contrast
        boundsBox.rect(-width / 2, -height / 2, width, height);
        boundsBox.stroke({
          width: 3.5,
          color: isDark ? 0x000000 : 0xffffff,
          alpha: isDark ? 0.3 : 0.8,
        });
      }

      boundsBox.rect(-width / 2, -height / 2, width, height);
      boundsBox.stroke({
        width: isCropMode ? 1.5 : 2,
        color: boxColor,
        alpha: boxAlpha,
      });

      if (isCropMode) {
        // Draw contrast shadow for Rule of Thirds Grid
        boundsBox.moveTo(-width / 2 + width / 3, -height / 2);
        boundsBox.lineTo(-width / 2 + width / 3, height / 2);
        boundsBox.moveTo(-width / 2 + (2 * width) / 3, -height / 2);
        boundsBox.lineTo(-width / 2 + (2 * width) / 3, height / 2);

        boundsBox.moveTo(-width / 2, -height / 2 + height / 3);
        boundsBox.lineTo(width / 2, -height / 2 + height / 3);
        boundsBox.moveTo(-width / 2, -height / 2 + (2 * height) / 3);
        boundsBox.lineTo(width / 2, -height / 2 + (2 * height) / 3);

        boundsBox.stroke({
          width: 3,
          color: isDark ? 0x000000 : 0xffffff,
          alpha: isDark ? 0.2 : 0.5,
        });

        // Draw Rule of Thirds Grid
        boundsBox.moveTo(-width / 2 + width / 3, -height / 2);
        boundsBox.lineTo(-width / 2 + width / 3, height / 2);
        boundsBox.moveTo(-width / 2 + (2 * width) / 3, -height / 2);
        boundsBox.lineTo(-width / 2 + (2 * width) / 3, height / 2);

        // Horizontal lines
        boundsBox.moveTo(-width / 2, -height / 2 + height / 3);
        boundsBox.lineTo(width / 2, -height / 2 + height / 3);
        boundsBox.moveTo(-width / 2, -height / 2 + (2 * height) / 3);
        boundsBox.lineTo(width / 2, -height / 2 + (2 * height) / 3);

        boundsBox.stroke({ width: 1, color: boxColor, alpha: 0.6 });
      }

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
  }, [activeLayerId, activeTool, spriteUpdateTick, theme]);
}
