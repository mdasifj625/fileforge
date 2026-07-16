import * as PIXI from "pixi.js";
import { ImageLayer } from "@/types/layer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CanvasRefs } from "../types";

export function getHandlesConfig(isCropMode: boolean) {
  return isCropMode
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
}

function drawCropHandle(
  handle: PIXI.Graphics,
  pos: { id: string; x: number; y: number },
  handleFillColor: number,
  handleStrokeColor: number,
  handleStrokeAlpha: number,
) {
  if (pos.x === 0 || pos.y === 0) {
    if (pos.x === 0) {
      handle.roundRect(-16, -2.5, 32, 5, 2.5);
    } else {
      handle.roundRect(-2.5, -16, 5, 32, 2.5);
    }
  } else {
    const th = 5;
    const len = 24;
    const hX = pos.x === -1 ? -th / 2 : -len + th / 2;
    const hY = -th / 2;
    handle.roundRect(hX, hY, len, th, 2.5);
    const vX = -th / 2;
    const vY = pos.y === -1 ? -th / 2 : -len + th / 2;
    handle.roundRect(vX, vY, th, len, 2.5);
  }
  handle.fill({ color: handleFillColor });
  handle.stroke({
    width: 1.5,
    color: handleStrokeColor,
    alpha: handleStrokeAlpha,
  });
}

function drawSelectHandle(
  handle: PIXI.Graphics,
  pos: { id: string; x: number; y: number },
  handleFillColor: number,
  overlayColor: number,
) {
  const isEdge = pos.x === 0 || pos.y === 0;
  const size = isEdge ? 7 : 9;
  const offset = isEdge ? -3.5 : -4.5;

  handle.rect(offset, offset, size, size);
  handle.fill({ color: handleFillColor });
  handle.stroke({ width: 1.5, color: overlayColor, alpha: 1 });
}

export function drawHandle(
  handle: PIXI.Graphics,
  pos: { id: string; x: number; y: number },
  isCropMode: boolean,
  handleFillColor: number,
  handleStrokeColor: number,
  handleStrokeAlpha: number,
  overlayColor: number,
) {
  if (isCropMode) {
    drawCropHandle(
      handle,
      pos,
      handleFillColor,
      handleStrokeColor,
      handleStrokeAlpha,
    );
  } else {
    drawSelectHandle(handle, pos, handleFillColor, overlayColor);
  }

  handle.hitArea = new PIXI.Rectangle(-24, -24, 48, 48);
  handle.eventMode = "static";

  if (pos.id === "tl" || pos.id === "br") handle.cursor = "nwse-resize";
  else if (pos.id === "tr" || pos.id === "bl") handle.cursor = "nesw-resize";
  else if (pos.id === "t" || pos.id === "b") handle.cursor = "ns-resize";
  else handle.cursor = "ew-resize";
}

function getCropMaxBounds(
  pos: { id: string; x: number; y: number },
  startCropRect: { x: number; y: number; width: number; height: number },
  originalW: number,
  originalH: number,
  ratio: number | null,
) {
  let maxAllowedW = originalW;
  let maxAllowedH = originalH;

  if (pos.x === -1) maxAllowedW = startCropRect.x + startCropRect.width;
  else if (pos.x === 1) maxAllowedW = originalW - startCropRect.x;
  else if (pos.x === 0) {
    const centerX = startCropRect.x + startCropRect.width / 2;
    maxAllowedW = Math.min(centerX, originalW - centerX) * 2;
  }

  if (pos.y === -1) maxAllowedH = startCropRect.y + startCropRect.height;
  else if (pos.y === 1) maxAllowedH = originalH - startCropRect.y;
  else if (pos.y === 0) {
    const centerY = startCropRect.y + startCropRect.height / 2;
    maxAllowedH = Math.min(centerY, originalH - centerY) * 2;
  }

  if (ratio) {
    if (maxAllowedW / maxAllowedH > ratio) maxAllowedW = maxAllowedH * ratio;
    else maxAllowedH = maxAllowedW / ratio;
  }

  return { maxAllowedW, maxAllowedH };
}

function enforceInitialRatio(
  w: number,
  h: number,
  unscaledDx: number,
  unscaledDy: number,
  ratio: number,
  pos: { id: string; x: number; y: number },
) {
  if (pos.x !== 0 && pos.y !== 0) {
    if (Math.abs(unscaledDx) > Math.abs(unscaledDy * ratio)) {
      return { w, h: w / ratio };
    }
    return { w: h * ratio, h };
  }
  if (pos.x === 0 && pos.y !== 0) return { w: h * ratio, h };
  if (pos.y === 0 && pos.x !== 0) return { w, h: w / ratio };
  return { w, h };
}

function applyCropRatioAndClamp(
  newCropW: number,
  newCropH: number,
  unscaledDx: number,
  unscaledDy: number,
  ratio: number | null,
  maxAllowedW: number,
  maxAllowedH: number,
  pos: { id: string; x: number; y: number },
) {
  let w = newCropW;
  let h = newCropH;

  if (ratio) {
    const adjusted = enforceInitialRatio(
      w,
      h,
      unscaledDx,
      unscaledDy,
      ratio,
      pos,
    );
    w = adjusted.w;
    h = adjusted.h;
  }

  w = Math.max(10, Math.min(w, maxAllowedW));
  h = Math.max(10, Math.min(h, maxAllowedH));

  if (ratio) {
    if (w / h > ratio + 0.001) w = h * ratio;
    else if (w / h < ratio - 0.001) h = w / ratio;
  }

  return { w, h };
}

function getCropRatio(
  activeLayerId: string,
  originalW: number,
  originalH: number,
) {
  const layerState = useWorkspaceStore
    .getState()
    .layers.find((l) => l.id === activeLayerId) as ImageLayer | undefined;
  const rawRatio = layerState?.cropAspectRatio;
  if (rawRatio === "original") return originalW / originalH;
  if (typeof rawRatio === "number") return rawRatio;
  return null;
}

function updateCropTextureAndPosition(
  activeSprite: PIXI.Sprite,
  startCropRect: { x: number; y: number; width: number; height: number },
  newCropX: number,
  newCropY: number,
  newCropW: number,
  newCropH: number,
  startScaleX: number,
  startScaleY: number,
  startSpriteX: number,
  startSpriteY: number,
) {
  activeSprite.texture = new PIXI.Texture({
    source: activeSprite.texture.source,
    frame: new PIXI.Rectangle(newCropX, newCropY, newCropW, newCropH),
  });

  const oldCenterUnscaledX = startCropRect.x + startCropRect.width / 2;
  const oldCenterUnscaledY = startCropRect.y + startCropRect.height / 2;
  const newCenterUnscaledX = newCropX + newCropW / 2;
  const newCenterUnscaledY = newCropY + newCropH / 2;

  const absoluteShiftX =
    (newCenterUnscaledX - oldCenterUnscaledX) * Math.abs(startScaleX);
  const absoluteShiftY =
    (newCenterUnscaledY - oldCenterUnscaledY) * Math.abs(startScaleY);

  const cos = Math.cos(activeSprite.rotation);
  const sin = Math.sin(activeSprite.rotation);

  const rotatedShiftX = absoluteShiftX * cos - absoluteShiftY * sin;
  const rotatedShiftY = absoluteShiftX * sin + absoluteShiftY * cos;

  activeSprite.x = startSpriteX + rotatedShiftX;
  activeSprite.y = startSpriteY + rotatedShiftY;

  return { x: newCropX, y: newCropY, width: newCropW, height: newCropH };
}

export function handlePointerMove(
  e: PIXI.FederatedPointerEvent,
  app: PIXI.Application,
  activeSprite: PIXI.Sprite,
  isCropMode: boolean,
  startPointerPos: PIXI.Point,
  startScaleX: number,
  startScaleY: number,
  startSpriteX: number,
  startSpriteY: number,
  startCropRect: { x: number; y: number; width: number; height: number },
  originalW: number,
  originalH: number,
  pos: { id: string; x: number; y: number },
  activeLayerId: string,
) {
  const localPos = app.stage.toLocal(e.global);
  const dx = localPos.x - startPointerPos.x;
  const dy = localPos.y - startPointerPos.y;

  if (!isCropMode) {
    const scaleDelta = (dx * pos.x * 2) / activeSprite.texture.width;
    const newScaleX = Math.max(0.05, startScaleX + scaleDelta);
    const newScaleY = Math.max(
      0.05,
      startScaleY + scaleDelta * (startScaleY / startScaleX),
    );
    activeSprite.scale.set(newScaleX, newScaleY);
    return null;
  }

  const unscaledDx = dx / startScaleX;
  const unscaledDy = dy / startScaleY;

  let newCropW = startCropRect.width;
  let newCropH = startCropRect.height;

  const ratio = getCropRatio(activeLayerId, originalW, originalH);

  const { maxAllowedW, maxAllowedH } = getCropMaxBounds(
    pos,
    startCropRect,
    originalW,
    originalH,
    ratio,
  );

  if (pos.x === -1) newCropW -= unscaledDx;
  else if (pos.x === 1) newCropW += unscaledDx;

  if (pos.y === -1) newCropH -= unscaledDy;
  else if (pos.y === 1) newCropH += unscaledDy;

  const { w, h } = applyCropRatioAndClamp(
    newCropW,
    newCropH,
    unscaledDx,
    unscaledDy,
    ratio,
    maxAllowedW,
    maxAllowedH,
    pos,
  );
  newCropW = w;
  newCropH = h;

  let newCropX = startCropRect.x;
  let newCropY = startCropRect.y;

  if (pos.x === -1) newCropX = startCropRect.x + startCropRect.width - newCropW;
  else if (pos.x === 0)
    newCropX = startCropRect.x + startCropRect.width / 2 - newCropW / 2;

  if (pos.y === -1)
    newCropY = startCropRect.y + startCropRect.height - newCropH;
  else if (pos.y === 0)
    newCropY = startCropRect.y + startCropRect.height / 2 - newCropH / 2;

  return updateCropTextureAndPosition(
    activeSprite,
    startCropRect,
    newCropX,
    newCropY,
    newCropW,
    newCropH,
    startScaleX,
    startScaleY,
    startSpriteX,
    startSpriteY,
  );
}

export function setupTransformHandles(
  app: PIXI.Application,
  overlay: PIXI.Container,
  activeSprite: PIXI.Sprite & { isBeingManipulated?: boolean },
  activeLayerId: string,
  isCropMode: boolean,
  maskSpritesRef: CanvasRefs["maskSpritesRef"],
  handles: Array<{ id: string; x: number; y: number }>,
) {
  const handleGraphics: PIXI.Graphics[] = [];
  const overlayColor = isCropMode ? 0x10b981 : 0x3b82f6;

  const isDark = document.documentElement.classList.contains("dark");
  const handleFillColor = isDark ? 0xffffff : 0x111111;
  const handleStrokeColor = isDark ? 0x000000 : 0xffffff;
  const handleStrokeAlpha = isDark ? 0.3 : 0.8;

  handles.forEach((pos) => {
    const handle = new PIXI.Graphics();

    drawHandle(
      handle,
      pos,
      isCropMode,
      handleFillColor,
      handleStrokeColor,
      handleStrokeAlpha,
      overlayColor,
    );

    let isManipulating = false;
    let startScaleX = 1;
    let startScaleY = 1;
    let startPointerPos: PIXI.Point | null = null;

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
        startCropRect = (layer as import("@/types/layer").ImageLayer).cropRect
          ? { ...(layer as import("@/types/layer").ImageLayer).cropRect! }
          : { x: 0, y: 0, width: originalW, height: originalH };
        currentCropRect = { ...startCropRect };
      }

      e.stopPropagation();
    });

    const onManipulateEnd = () => {
      if (!isManipulating) return;

      isManipulating = false;
      activeSprite.isBeingManipulated = false;

      if (isCropMode) {
        useWorkspaceStore.getState().updateLayerTransform(activeLayerId, {
          cropRect: currentCropRect,
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
    };

    handle.on("pointerup", onManipulateEnd);
    handle.on("pointerupoutside", onManipulateEnd);

    handle.on("globalpointermove", (e) => {
      if (!isManipulating || !startPointerPos) return;

      const newCrop = handlePointerMove(
        e,
        app,
        activeSprite,
        isCropMode,
        startPointerPos,
        startScaleX,
        startScaleY,
        startSpriteX,
        startSpriteY,
        startCropRect,
        originalW,
        originalH,
        pos,
        activeLayerId,
      );

      if (newCrop) currentCropRect = newCrop;

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
    });

    handleGraphics.push(handle);
    overlay.addChild(handle);
  });

  return handleGraphics;
}

export function drawOverlayBounds(
  boundsBox: PIXI.Graphics,
  activeSprite: PIXI.Sprite,
  isCropMode: boolean,
  isDark: boolean,
  overlayColor: number,
) {
  const width = activeSprite.texture.width * Math.abs(activeSprite.scale.x);
  const height = activeSprite.texture.height * Math.abs(activeSprite.scale.y);

  boundsBox.clear();

  let boxColor = overlayColor;
  if (isCropMode) {
    boxColor = isDark ? 0xffffff : 0x111111;
  }
  const boxAlpha = isCropMode ? 0.9 : 1;

  if (isCropMode) {
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

    boundsBox.moveTo(-width / 2 + width / 3, -height / 2);
    boundsBox.lineTo(-width / 2 + width / 3, height / 2);
    boundsBox.moveTo(-width / 2 + (2 * width) / 3, -height / 2);
    boundsBox.lineTo(-width / 2 + (2 * width) / 3, height / 2);

    boundsBox.moveTo(-width / 2, -height / 2 + height / 3);
    boundsBox.lineTo(width / 2, -height / 2 + height / 3);
    boundsBox.moveTo(-width / 2, -height / 2 + (2 * height) / 3);
    boundsBox.lineTo(width / 2, -height / 2 + (2 * height) / 3);

    boundsBox.stroke({ width: 1, color: boxColor, alpha: 0.6 });
  }

  boundsBox.position.set(activeSprite.x, activeSprite.y);
  boundsBox.rotation = activeSprite.rotation;

  return { width, height };
}

export function updateGhostPosition(
  cropGhostSprite: PIXI.Sprite,
  activeSprite: PIXI.Sprite,
  originalWidth: number,
  originalHeight: number,
) {
  const cw = originalWidth;
  const ch = originalHeight;
  const cropX = activeSprite.texture.frame.x;
  const cropY = activeSprite.texture.frame.y;
  const cropW = activeSprite.texture.frame.width;
  const cropH = activeSprite.texture.frame.height;

  const dx = cropX + cropW / 2 - cw / 2;
  const dy = cropY + cropH / 2 - ch / 2;

  const cos = Math.cos(activeSprite.rotation);
  const sin = Math.sin(activeSprite.rotation);

  const shiftX = (dx * cos - dy * sin) * Math.abs(activeSprite.scale.x);
  const shiftY = (dx * sin + dy * cos) * Math.abs(activeSprite.scale.y);

  cropGhostSprite.x = activeSprite.x - shiftX;
  cropGhostSprite.y = activeSprite.y - shiftY;
  cropGhostSprite.scale.set(activeSprite.scale.x, activeSprite.scale.y);
  cropGhostSprite.rotation = activeSprite.rotation;
}
