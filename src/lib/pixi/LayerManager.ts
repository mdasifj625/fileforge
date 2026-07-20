import * as PIXI from "pixi.js";
import { Layer, ImageLayer } from "@/types/layer";
import { db } from "@/db";
import { useLayerStore, useToolStore } from "@/store";
import { toolRegistry } from "@/lib/toolRegistry";

export function getBrushCursor(size: number) {
  const svg = `<svg width="${size * 2}" height="${size * 2}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="black" stroke-width="1.5"/><circle cx="${size}" cy="${size}" r="${size - 1}" fill="none" stroke="white" stroke-width="1" stroke-dasharray="3,3"/></svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") ${size} ${size}, crosshair`;
}

export class LayerManager {
  private app: PIXI.Application;
  private sprites: Record<
    string,
    PIXI.Sprite & { isBeingManipulated?: boolean }
  > = {};
  private maskSprites: Record<
    string,
    PIXI.Sprite & {
      renderTexture?: PIXI.RenderTexture;
      maskFileId?: string;
      baseMaskTexture?: PIXI.RenderTexture;
    }
  > = {};

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  public getSprite(id: string) {
    return this.sprites[id];
  }

  public getMaskSprite(id: string) {
    return this.maskSprites[id];
  }

  public destroy() {
    for (const id in this.sprites) {
      this.app.stage.removeChild(this.sprites[id]);
      this.sprites[id].destroy({ texture: true });
    }
    for (const id in this.maskSprites) {
      this.app.stage.removeChild(this.maskSprites[id]);
      this.maskSprites[id].destroy({ texture: true });
      if (this.maskSprites[id].renderTexture) {
        this.maskSprites[id].renderTexture?.destroy(true);
      }
    }
    this.sprites = {};
    this.maskSprites = {};
  }

  public async syncLayers(layers: Layer[], _activeLayerId: string | null) {
    this.cleanupDeletedLayers(layers);

    const activeTool = useToolStore.getState().activeTool || "";
    const brushMode = useToolStore.getState().brushMode || "none";
    const brushSize = useToolStore.getState().brushSize || 20;

    for (const layer of layers) {
      if (layer.type !== "image") continue;
      const imgLayer = layer as ImageLayer;

      let sprite = this.sprites[layer.id];

      if (!sprite) {
        const newSprite = await this.createSprite(imgLayer);
        if (!newSprite) continue;
        sprite = newSprite;
      }

      const maskSprite = await this.syncMaskSprite(imgLayer, sprite);

      this.syncExistingSpriteTransforms(
        sprite,
        imgLayer,
        maskSprite,
        activeTool,
        brushMode,
        brushSize,
      );

      this.updateZIndex(sprite, layers, imgLayer.id);
    }
  }

  private cleanupDeletedLayers(layers: Layer[]) {
    const currentLayerIds = new Set(layers.map((l) => l.id));
    for (const id in this.sprites) {
      if (!currentLayerIds.has(id)) {
        const sprite = this.sprites[id];
        this.app.stage.removeChild(sprite);
        sprite.destroy({ texture: true });
        delete this.sprites[id];

        const maskSprite = this.maskSprites[id];
        if (maskSprite) {
          this.app.stage.removeChild(maskSprite);
          maskSprite.destroy({ texture: true });
          if (maskSprite.renderTexture) maskSprite.renderTexture.destroy(true);
          delete this.maskSprites[id];
        }
      }
    }
  }

  private async createSprite(layer: ImageLayer): Promise<PIXI.Sprite | null> {
    try {
      const fileRecord = await db.files.get(layer.fileId);
      if (!fileRecord) return null;

      const bitmap = await createImageBitmap(fileRecord.blob);
      const source = new PIXI.ImageSource({ resource: bitmap });
      const texture = new PIXI.Texture({ source });
      const sprite = new PIXI.Sprite(texture);

      sprite.anchor.set(0.5);
      sprite.eventMode = "static";

      this.sprites[layer.id] = sprite;
      this.app.stage.addChild(sprite);

      if (layer.originalWidth === 0) {
        let initialScale = 1;
        const padding = 0.9;
        if (source.width > 0 && source.height > 0) {
          const scaleX = (this.app.screen.width * padding) / source.width;
          const scaleY = (this.app.screen.height * padding) / source.height;
          initialScale = Math.min(1, scaleX, scaleY);
        }

        useLayerStore.getState().updateLayerTransform(
          layer.id,
          {
            originalWidth: source.width,
            originalHeight: source.height,
            scaleX: initialScale,
            scaleY: initialScale,
          },
          false,
        );

        // Mutate locally so the rest of this sync cycle uses the new values instantly
        layer.originalWidth = source.width;
        layer.originalHeight = source.height;
        layer.scaleX = initialScale;
        layer.scaleY = initialScale;
      }
      return sprite;
    } catch (e) {
      console.error("Failed to create sprite", e);
      return null;
    }
  }

  private clearMask(layerId: string, sprite: PIXI.Sprite) {
    if (this.maskSprites[layerId]) {
      this.app.stage.removeChild(this.maskSprites[layerId]);
      this.maskSprites[layerId].destroy({ texture: true });
      if (this.maskSprites[layerId].renderTexture) {
        this.maskSprites[layerId].renderTexture?.destroy(true);
      }
      delete this.maskSprites[layerId];
    }
    sprite.mask = null;
  }

  private async loadMaskSprite(
    layer: ImageLayer,
    sprite: PIXI.Sprite,
    existingMask: PIXI.Sprite | undefined,
  ) {
    try {
      const maskRecord = await db.files.get(layer.maskFileId!);
      if (!maskRecord) return;
      const bitmap = await createImageBitmap(maskRecord.blob);
      const source = new PIXI.ImageSource({ resource: bitmap });
      const texture = new PIXI.Texture({ source });
      const renderTexture = PIXI.RenderTexture.create({
        width: texture.width,
        height: texture.height,
      });
      this.app.renderer.render({
        container: new PIXI.Sprite(texture),
        target: renderTexture,
      });

      const newMaskSprite = new PIXI.Sprite(renderTexture) as PIXI.Sprite & {
        renderTexture?: PIXI.RenderTexture;
        maskFileId?: string;
        baseMaskTexture?: PIXI.RenderTexture;
      };
      newMaskSprite.anchor.set(0.5);
      newMaskSprite.eventMode = "none";
      newMaskSprite.maskFileId = layer.maskFileId;
      newMaskSprite.baseMaskTexture = renderTexture;

      if (existingMask) {
        this.app.stage.removeChild(existingMask);
        existingMask.destroy({ texture: true });
        if (
          (existingMask as PIXI.Sprite & { renderTexture?: PIXI.RenderTexture })
            .renderTexture
        )
          (
            existingMask as PIXI.Sprite & { renderTexture?: PIXI.RenderTexture }
          ).renderTexture!.destroy(true);
      }

      this.maskSprites[layer.id] = newMaskSprite;
      this.app.stage.addChild(newMaskSprite);

      const oldMask = sprite.mask as PIXI.Sprite | null;
      sprite.mask = newMaskSprite;
      if (oldMask && oldMask !== newMaskSprite) {
        setTimeout(() => {
          if (!oldMask.destroyed) oldMask.destroy({ texture: true });
        }, 100);
      }
    } catch (e) {
      console.error("Mask creation failed", e);
    }
  }

  private async syncMaskSprite(layer: ImageLayer, sprite: PIXI.Sprite) {
    if (!layer.maskFileId && !layer.isAiBackgroundRemoved) {
      this.clearMask(layer.id, sprite);
      return undefined;
    }

    if (layer.maskFileId) {
      const existingMask = this.maskSprites[layer.id];
      if (
        !existingMask ||
        (existingMask as PIXI.Sprite & { maskFileId?: string }).maskFileId !==
          layer.maskFileId
      ) {
        await this.loadMaskSprite(layer, sprite, existingMask);
      }
    }
    return this.maskSprites[layer.id];
  }

  private syncExistingSpriteTransforms(
    sprite: PIXI.Sprite & { isBeingManipulated?: boolean },
    layer: ImageLayer,
    maskSprite: PIXI.Sprite | undefined,
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
      this.updateSpriteTextureAndPosition(sprite, layer, activeTool);
    }
  }

  private applyCropOverlayShift(sprite: PIXI.Sprite, layer: ImageLayer) {
    const cx = layer.cropRect!.x;
    const cy = layer.cropRect!.y;
    const cw = layer.cropRect!.width;
    const ch = layer.cropRect!.height;

    const offsetX = layer.originalWidth / 2 - (cx + cw / 2);
    const offsetY = layer.originalHeight / 2 - (cy + ch / 2);

    const angle = layer.rotation || 0;
    const globalOffsetX =
      offsetX * layer.scaleX * Math.cos(angle) -
      offsetY * layer.scaleY * Math.sin(angle);
    const globalOffsetY =
      offsetX * layer.scaleX * Math.sin(angle) +
      offsetY * layer.scaleY * Math.cos(angle);

    sprite.x = layer.x + globalOffsetX;
    sprite.y = layer.y + globalOffsetY;

    // Ensure full texture frame
    if (sprite.texture.frame.width !== layer.originalWidth) {
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

  private updateSpriteTextureAndPosition(
    sprite: PIXI.Sprite,
    layer: ImageLayer,
    activeTool: string,
  ) {
    if (layer.cropRect && layer.originalWidth > 0) {
      const toolDef = activeTool ? toolRegistry[activeTool] : null;
      const isCropMode =
        activeTool === "crop" || !!toolDef?.enableCropOverlay?.(layer);

      if (!isCropMode) {
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
      } else {
        this.applyCropOverlayShift(sprite, layer);
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

  private updateZIndex(sprite: PIXI.Sprite, layers: Layer[], id: string) {
    const index = layers.findIndex((l) => l.id === id);
    sprite.zIndex = layers.length - index;
    if (this.maskSprites[id]) {
      this.maskSprites[id].zIndex = layers.length - index;
    }
  }
}
