import * as PIXI from "pixi.js";
import { Layer, ImageLayer } from "@/types/layer";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { CanvasRefs } from "../types";

export function getBrushCursor(size: number) {
  const svg = `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="black" stroke-width="1.5"/><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="white" stroke-width="1" stroke-dasharray="3,3"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${size} ${size}, crosshair`;
}

export function cleanupDeletedLayers(
  app: PIXI.Application,
  layers: Layer[],
  spritesRef: CanvasRefs["spritesRef"],
  maskSpritesRef: CanvasRefs["maskSpritesRef"],
) {
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
        if (maskSprite.renderTexture) maskSprite.renderTexture.destroy(true);
        delete maskSpritesRef.current[id];
      }
    }
  }
}

export function syncExistingSpriteTransforms(
  sprite: PIXI.Sprite & { isBeingManipulated?: boolean },
  layer: ImageLayer,
  maskSprite:
    | (PIXI.Sprite & {
        renderTexture?: PIXI.RenderTexture;
        maskFileId?: string;
        baseMaskTexture?: PIXI.RenderTexture;
      })
    | undefined,
  activeTool: string,
  brushMode: string,
  brushSize: number,
) {
  sprite.visible = layer.visible;
  sprite.cursor =
    activeTool === "ai-remove-background" && brushMode !== "none"
      ? getBrushCursor(brushSize || 20)
      : "pointer";

  if (!sprite.isBeingManipulated) {
    sprite.x = layer.x;
    sprite.y = layer.y;
    sprite.scale.x = layer.scaleX;
    sprite.scale.y = layer.scaleY;
    sprite.rotation = layer.rotation || 0;
    sprite.alpha = layer.opacity ?? 1;
    sprite.blendMode = (layer.blendMode || "normal") as PIXI.BLEND_MODES;

    if (maskSprite) {
      maskSprite.x = sprite.x;
      maskSprite.y = sprite.y;
      maskSprite.scale.set(sprite.scale.x, sprite.scale.y);
      maskSprite.rotation = sprite.rotation;
    }

    if (layer.cropRect && layer.originalWidth > 0) {
      const cx = Math.max(0, layer.cropRect.x);
      const cy = Math.max(0, layer.cropRect.y);
      const cw = Math.min(layer.originalWidth - cx, layer.cropRect.width);
      const ch = Math.min(layer.originalHeight - cy, layer.cropRect.height);

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
}

export async function createMaskRenderTexture(
  app: PIXI.Application,
  maskBitmap: ImageBitmap,
  originalWidth: number,
  originalHeight: number,
  cropRect?: { x: number; y: number; width: number; height: number },
) {
  const rawMaskTexture = PIXI.Texture.from(maskBitmap);

  const baseMaskTexture = PIXI.RenderTexture.create({
    width: originalWidth,
    height: originalHeight,
  });

  const tempS = new PIXI.Sprite(rawMaskTexture);
  app.renderer.render({ container: tempS, target: baseMaskTexture });
  tempS.destroy();

  const renderTexture = PIXI.RenderTexture.create({
    width: originalWidth,
    height: originalHeight,
  });

  const tempSprite = new PIXI.Sprite(baseMaskTexture);
  app.renderer.render({ container: tempSprite, target: renderTexture });
  tempSprite.destroy();

  let finalTexture: PIXI.Texture = renderTexture;
  if (cropRect) {
    const cx = Math.max(0, cropRect.x);
    const cy = Math.max(0, cropRect.y);
    const cw = Math.min(originalWidth - cx, cropRect.width);
    const ch = Math.min(originalHeight - cy, cropRect.height);
    if (cw > 0 && ch > 0) {
      finalTexture = new PIXI.Texture({
        source: renderTexture.source,
        frame: new PIXI.Rectangle(cx, cy, cw, ch),
      });
    }
  } else {
    finalTexture = new PIXI.Texture({
      source: renderTexture.source,
      frame: new PIXI.Rectangle(0, 0, originalWidth, originalHeight),
    });
  }

  return { renderTexture, baseMaskTexture, finalTexture };
}

export function removeOldMask(
  app: PIXI.Application,
  existingMask: PIXI.Sprite & { renderTexture?: PIXI.RenderTexture },
  layerId: string,
  maskSpritesRef: CanvasRefs["maskSpritesRef"],
) {
  app.stage.removeChild(existingMask);
  if (existingMask.renderTexture) {
    setTimeout(() => {
      if (existingMask.renderTexture) existingMask.renderTexture.destroy(true);
    }, 100);
  }
  existingMask.destroy({ texture: true });
  delete maskSpritesRef.current[layerId];
}

export async function applyMaskToSprite(
  app: PIXI.Application,
  sprite: PIXI.Sprite,
  layer: ImageLayer,
  maskSpritesRef: CanvasRefs["maskSpritesRef"],
  brushControllerRef: CanvasRefs["brushControllerRef"],
  activeTool: string,
) {
  const existingMask = maskSpritesRef.current[layer.id];

  if (
    layer.maskFileId &&
    (!existingMask || existingMask.maskFileId !== layer.maskFileId)
  ) {
    const maskData = await db.files.get(layer.maskFileId);
    if (!maskData) return;

    const maskBitmap = await window.createImageBitmap(maskData.blob);

    const { renderTexture, baseMaskTexture, finalTexture } =
      await createMaskRenderTexture(
        app,
        maskBitmap,
        layer.originalWidth,
        layer.originalHeight,
        layer.cropRect,
      );

    const maskSprite = new PIXI.Sprite(finalTexture) as PIXI.Sprite & {
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

    if (existingMask) {
      removeOldMask(app, existingMask, layer.id, maskSpritesRef);
    }

    if (activeTool === "ai-remove-background" && brushControllerRef.current) {
      brushControllerRef.current.setup(
        sprite,
        renderTexture,
        maskSprite.baseMaskTexture,
        layer.id,
      );
    }
  } else if (!layer.maskFileId && existingMask) {
    removeOldMask(app, existingMask, layer.id, maskSpritesRef);
    sprite.mask = null;
  }
}

export function computeInitialScale(
  app: PIXI.Application,
  layer: ImageLayer,
  imageWidth: number,
  imageHeight: number,
) {
  if (layer.originalWidth !== 0) {
    return { scaleX: layer.scaleX, scaleY: layer.scaleY };
  }
  const maxWidth = app.screen.width * 0.8;
  const maxHeight = app.screen.height * 0.8;
  if (imageWidth > maxWidth || imageHeight > maxHeight) {
    const fitScale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
    return { scaleX: fitScale, scaleY: fitScale };
  }
  return { scaleX: layer.scaleX, scaleY: layer.scaleY };
}

export async function initNewSprite(
  app: PIXI.Application,
  layer: ImageLayer,
  imageBitmap: ImageBitmap,
  layerIndex: number,
  totalLayers: number,
  activeTool: string,
  brushMode: string,
  brushSize: number,
) {
  let texture = PIXI.Texture.from(imageBitmap);

  const realWidth =
    layer.originalWidth > 0 ? layer.originalWidth : imageBitmap.width;
  const realHeight =
    layer.originalHeight > 0 ? layer.originalHeight : imageBitmap.height;

  const { scaleX, scaleY } = computeInitialScale(
    app,
    layer,
    imageBitmap.width,
    imageBitmap.height,
  );

  if (layer.cropRect) {
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

  const sprite = new PIXI.Sprite(texture) as PIXI.Sprite & {
    isBeingManipulated?: boolean;
  };

  sprite.anchor.set(0.5);
  sprite.x = layer.x;
  sprite.y = layer.y;
  sprite.scale.set(scaleX, scaleY);
  sprite.alpha = layer.opacity ?? 1;
  sprite.rotation = layer.rotation || 0;
  sprite.blendMode = (layer.blendMode || "normal") as PIXI.BLEND_MODES;
  sprite.zIndex = (totalLayers - layerIndex) * 2;
  sprite.eventMode = "static";
  sprite.cursor =
    activeTool === "ai-remove-background" && brushMode !== "none"
      ? getBrushCursor(brushSize || 20)
      : "pointer";

  return { sprite, realWidth, realHeight, scaleX, scaleY };
}

export function bindSpriteEvents(
  sprite: PIXI.Sprite & { isBeingManipulated?: boolean },
  layer: ImageLayer,
  app: PIXI.Application,
  maskSpritesRef: CanvasRefs["maskSpritesRef"],
) {
  let dragging = false;
  let dragData: PIXI.FederatedPointerEvent | null = null;
  const offset = { x: 0, y: 0 };
  let dragStartCrop = { x: 0, y: 0, w: 0, h: 0 };

  sprite.on("pointerdown", (e) => {
    const store = useWorkspaceStore.getState();
    store.setActiveLayerId(layer.id);

    if (store.activeTool !== "select" && store.activeTool !== "crop") return;

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

      const store = useWorkspaceStore.getState();
      if (store.activeTool === "crop") {
        store.updateLayerTransform(layer.id, {
          cropRect: {
            x: sprite.texture.frame.x,
            y: sprite.texture.frame.y,
            width: sprite.texture.frame.width,
            height: sprite.texture.frame.height,
          },
        });
      } else {
        store.updateLayerTransform(layer.id, {
          x: sprite.x,
          y: sprite.y,
        });
      }

      const maskS = maskSpritesRef.current[layer.id];
      if (maskS) {
        maskS.x = sprite.x;
        maskS.y = sprite.y;
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

      const maskS = maskSpritesRef.current[layer.id];
      if (maskS) {
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
}
