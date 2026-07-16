"use client";

import { useEffect } from "react";
import * as PIXI from "pixi.js";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { CanvasRefs } from "../types";
import {
  getHandlesConfig,
  drawOverlayBounds,
  updateGhostPosition,
  setupTransformHandles,
} from "../utils/overlayUtils";

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

  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const activeTool = useToolStore((s) => s.activeTool);
  const theme = useToolStore((s) => s.theme);

  useEffect(() => {
    const app = appRef.current;

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
        activeTool !== "crop" &&
        activeTool !== "resize") ||
      !activeLayerId ||
      !spritesRef.current[activeLayerId]
    )
      return;

    const activeSprite = spritesRef.current[activeLayerId] as PIXI.Sprite & {
      isBeingManipulated?: boolean;
    };

    const boundsBox = new PIXI.Graphics();
    overlay.addChild(boundsBox);

    const isCropMode = activeTool === "crop";
    let cropGhostSprite: PIXI.Sprite | null = null;

    if (isCropMode) {
      const layer = useLayerStore
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
        cropGhostSprite.alpha = 0.3;
        overlay.addChildAt(cropGhostSprite, 0);
      }
    }

    const handles = getHandlesConfig(isCropMode);
    const overlayColor = isCropMode ? 0x10b981 : 0x3b82f6;
    const isDark = document.documentElement.classList.contains("dark");

    const handleGraphics = setupTransformHandles(
      app,
      overlay,
      activeSprite,
      activeLayerId,
      isCropMode,
      maskSpritesRef,
      handles,
    );

    const updateOverlay = () => {
      if (!activeSprite.visible || activeSprite.destroyed) {
        overlay.visible = false;
        return;
      }
      overlay.visible = true;

      const { width, height } = drawOverlayBounds(
        boundsBox,
        activeSprite,
        isCropMode,
        isDark,
        overlayColor,
      );

      handleGraphics.forEach((handle, i) => {
        const pos = handles[i];
        const lx = (width / 2) * pos.x;
        const ly = (height / 2) * pos.y;
        const cos = Math.cos(activeSprite.rotation);
        const sin = Math.sin(activeSprite.rotation);

        handle.x = activeSprite.x + (lx * cos - ly * sin);
        handle.y = activeSprite.y + (lx * sin + ly * cos);
      });

      if (cropGhostSprite && isCropMode) {
        const layer = useLayerStore
          .getState()
          .layers.find((l) => l.id === activeLayerId);
        if (layer) {
          updateGhostPosition(
            cropGhostSprite,
            activeSprite,
            layer.originalWidth,
            layer.originalHeight,
          );
        }
      }
    };

    app.ticker.add(updateOverlay);

    return () => {
      try {
        if (app && app.ticker) app.ticker.remove(updateOverlay);
      } catch {
        // ignore
      }
      try {
        if (overlay) overlay.removeChildren();
      } catch {
        // ignore
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayerId, activeTool, spriteUpdateTick, theme]);
}
