import * as PIXI from "pixi.js";
import { useLayerStore, useToolStore } from "@/store";

export class MaskBrushController {
  private app: PIXI.Application;
  private renderTexture: PIXI.RenderTexture | null = null;
  private sprite: PIXI.Sprite | null = null;
  private isDrawing = false;
  private brush: PIXI.Graphics;

  private layerId: string | null = null;
  private baseMaskRenderTexture: PIXI.RenderTexture | null = null;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.brush = new PIXI.Graphics();
  }

  public setup(
    sprite: PIXI.Sprite,
    renderTexture: PIXI.RenderTexture,
    baseMaskRenderTexture: PIXI.RenderTexture | undefined,
    layerId: string,
  ) {
    this.cleanup(); // Prevent duplicate listeners

    this.sprite = sprite;
    this.renderTexture = renderTexture;
    this.baseMaskRenderTexture = baseMaskRenderTexture || null;
    this.layerId = layerId;

    // Attach events to the main stage for drawing
    this.app.stage.eventMode = "static";
    this.app.stage.on("pointerdown", this.onPointerDown);
    this.app.stage.on("globalpointermove", this.onPointerMove);
    this.app.stage.on("pointerup", this.onPointerUp);
    this.app.stage.on("pointerupoutside", this.onPointerUp);
  }

  public cleanup() {
    this.app.stage.off("pointerdown", this.onPointerDown);
    this.app.stage.off("globalpointermove", this.onPointerMove);
    this.app.stage.off("pointerup", this.onPointerUp);
    this.app.stage.off("pointerupoutside", this.onPointerUp);
    this.renderTexture = null;
    this.baseMaskRenderTexture = null;
    this.sprite = null;
    this.isDrawing = false;
  }

  private onPointerDown = (e: PIXI.FederatedPointerEvent) => {
    if (
      useToolStore.getState().activeTool !== "ai-remove-background" ||
      useToolStore.getState().brushMode === "none"
    )
      return;

    this.isDrawing = true;
    this.draw(e);
  };

  private onPointerMove = (e: PIXI.FederatedPointerEvent) => {
    if (!this.isDrawing) return;
    this.draw(e);
  };

  private onPointerUp = async () => {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // We need to save the brushed base mask to IndexedDB so it persists across reloads!
    // We also need to trigger the filter pipeline.
    // The easiest way is to extract the blob and update layer.maskFileId (but that triggers a full reload which flashes).
    // Instead, we extract it, save it, and silently update maskFileId without flashing because it's the exact same pixels.
    // Extract from the BASE mask, not the filtered renderTexture
    const targetExtract = this.baseMaskRenderTexture || this.renderTexture;
    if (targetExtract && this.layerId) {
      try {
        const canvas = this.app.renderer.extract.canvas(
          targetExtract,
        ) as HTMLCanvasElement;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("toBlob failed"));
          }, "image/png");
        });

        const maskFileId = crypto.randomUUID();
        const dbModule = await import("@/db");
        await dbModule.db.files.put({
          id: maskFileId,
          blob,
          name: `manual-mask-${Date.now()}`,
          type: "image/png",
          size: blob.size,
          createdAt: Date.now(),
        });

        // Update the store. This will trigger useCanvasRender to re-sync `baseMaskRenderTexture` and re-apply filters!
        useLayerStore
          .getState()
          .updateLayerTransform(this.layerId, { maskFileId });
      } catch (e) {
        console.error("Failed to save mask brush stroke", e);
      }
    }
  };

  private draw(e: PIXI.FederatedPointerEvent) {
    if (!this.renderTexture || this.renderTexture.destroyed || !this.sprite)
      return;

    // Calculate local position relative to the unscaled texture
    const localPos = this.sprite.toLocal(e.global);

    // Map from center-anchor coordinates to top-left coordinates of the texture frame
    const frame = this.sprite.texture.frame;
    const xInRenderTexture = localPos.x + frame.width / 2 + frame.x;
    const yInRenderTexture = localPos.y + frame.height / 2 + frame.y;

    const brushSize = useToolStore.getState().brushSize || 20;
    const mode = useToolStore.getState().brushMode || "restore"; // "restore" or "erase"

    this.brush.clear();

    if (mode === "restore") {
      this.brush.blendMode = "normal" as PIXI.BLEND_MODES;
    } else {
      this.brush.blendMode = "erase" as PIXI.BLEND_MODES;
    }

    this.brush.circle(
      xInRenderTexture,
      yInRenderTexture,
      brushSize / Math.abs(this.sprite.scale.x),
    );
    this.brush.fill({ color: 0xffffff, alpha: 1 });

    // Wrapper
    const tempContainer = new PIXI.Container();
    tempContainer.addChild(this.brush);

    // Draw to visual texture
    this.app.renderer.render({
      container: tempContainer,
      target: this.renderTexture,
      clear: false,
    });

    // Draw to base texture for persistence
    if (this.baseMaskRenderTexture) {
      this.app.renderer.render({
        container: tempContainer,
        target: this.baseMaskRenderTexture,
        clear: false,
      });
      // Important: trigger a currentFeather reset to ensure the main pipeline re-applies filters properly!
      // But we just updated the store in onPointerUp which triggers a full maskFileId update anyway,
      // so we don't strictly need to do it here, but drawing it in real time keeps it accurate.
    }

    this.renderTexture.update();
  }
}
