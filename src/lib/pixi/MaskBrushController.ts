import * as PIXI from "pixi.js";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export class MaskBrushController {
  private app: PIXI.Application;
  private renderTexture: PIXI.RenderTexture | null = null;
  private sprite: PIXI.Sprite | null = null;
  private isDrawing = false;
  private brush: PIXI.Graphics;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.brush = new PIXI.Graphics();
  }

  public setup(sprite: PIXI.Sprite, renderTexture: PIXI.RenderTexture) {
    this.sprite = sprite;
    this.renderTexture = renderTexture;

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
    this.sprite = null;
    this.isDrawing = false;
  }

  private onPointerDown = (e: PIXI.FederatedPointerEvent) => {
    const store = useWorkspaceStore.getState();
    if (
      store.activeTool !== "ai-remove-background" ||
      store.brushMode === "none"
    )
      return;

    this.isDrawing = true;
    this.draw(e);
  };

  private onPointerMove = (e: PIXI.FederatedPointerEvent) => {
    if (!this.isDrawing) return;
    this.draw(e);
  };

  private onPointerUp = () => {
    this.isDrawing = false;
  };

  private draw(e: PIXI.FederatedPointerEvent) {
    if (!this.renderTexture || !this.sprite) return;
    const store = useWorkspaceStore.getState();

    // Calculate local position relative to the unscaled texture
    const localPos = this.sprite.toLocal(e.global);

    // The mask texture might be cropped, so we need to offset by the crop frame
    const frameX = this.sprite.texture.frame.x;
    const frameY = this.sprite.texture.frame.y;

    const brushSize = store.brushSize || 20;
    const mode = store.brushMode || "restore"; // "restore" or "erase"

    this.brush.clear();

    if (mode === "restore") {
      this.brush.beginFill(0xffffff, 1);
      this.brush.blendMode = "normal" as PIXI.BLEND_MODES;
    } else {
      this.brush.beginFill(0xffffff, 1);
      this.brush.blendMode = "erase" as PIXI.BLEND_MODES;
    }

    this.brush.drawCircle(
      localPos.x + frameX,
      localPos.y + frameY,
      brushSize / Math.abs(this.sprite.scale.x),
    );
    this.brush.endFill();

    // Render brush to the render texture
    this.app.renderer.render({
      container: this.brush,
      target: this.renderTexture,
      clear: false,
    });

    // Ensure mask updates visually in PixiJS v8
    this.renderTexture.update();
  }
}
