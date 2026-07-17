import * as PIXI from "pixi.js";
import { ImageLayer } from "@/types/layer";
import { useLayerStore } from "@/store";

function getHandlesConfig(isCropMode: boolean) {
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

function getHandleCursor(posId: string) {
  if (posId === "tl" || posId === "br") return "nwse-resize";
  if (posId === "tr" || posId === "bl") return "nesw-resize";
  if (posId === "t" || posId === "b") return "ns-resize";
  return "ew-resize";
}

function drawCropHandle(handle: PIXI.Graphics, pos: { x: number; y: number }) {
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
}

function drawHandle(
  handle: PIXI.Graphics,
  pos: { id: string; x: number; y: number },
  isCropMode: boolean,
  handleFillColor: number,
  handleStrokeColor: number,
  handleStrokeAlpha: number,
  _overlayColor: number,
) {
  if (isCropMode) {
    drawCropHandle(handle, pos);
    handle.fill({ color: handleFillColor });
    handle.stroke({
      width: 1.5,
      color: handleStrokeColor,
      alpha: handleStrokeAlpha,
    });
  } else {
    const isEdge = pos.x === 0 || pos.y === 0;
    const size = isEdge ? 7 : 9;
    const offset = isEdge ? -3.5 : -4.5;
    handle.rect(offset, offset, size, size);
    handle.fill({ color: handleFillColor });
    handle.stroke({ width: 1.5, color: _overlayColor, alpha: 1 });
  }

  handle.hitArea = new PIXI.Rectangle(-24, -24, 48, 48);
  handle.eventMode = "static";
  handle.cursor = getHandleCursor(pos.id);
}

function updateCropGrid(
  boundsBox: PIXI.Graphics,
  width: number,
  height: number,
  isDark: boolean,
  _overlayColor: number,
) {
  boundsBox.clear();

  boundsBox.rect(-width / 2, -height / 2, width, height);
  boundsBox.stroke({
    width: 3.5,
    color: isDark ? 0x000000 : 0xffffff,
    alpha: isDark ? 0.3 : 0.8,
  });

  boundsBox.rect(-width / 2, -height / 2, width, height);
  boundsBox.stroke({
    width: 1.5,
    color: isDark ? 0xffffff : 0x111111,
    alpha: 0.9,
  });

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

  boundsBox.stroke({
    width: 1,
    color: isDark ? 0xffffff : 0x111111,
    alpha: 0.6,
  });
}

export class TransformOverlayManager {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private border: PIXI.Graphics;
  private cropGrid: PIXI.Graphics;
  private rotationHandle: PIXI.Graphics;
  private handles: Record<string, PIXI.Graphics> = {};

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    this.container.zIndex = 1000;

    this.border = new PIXI.Graphics();
    this.cropGrid = new PIXI.Graphics();
    this.rotationHandle = new PIXI.Graphics();

    this.container.addChild(this.border);
    this.container.addChild(this.cropGrid);
    this.container.addChild(this.rotationHandle);

    this.app.stage.addChild(this.container);
  }

  public getContainer() {
    return this.container;
  }

  public destroy() {
    this.app.stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }

  private calculateDimensions(layer: ImageLayer, isCropMode: boolean) {
    let activeWidth = layer.originalWidth * Math.abs(layer.scaleX);
    let activeHeight = layer.originalHeight * Math.abs(layer.scaleY);
    let offsetX = 0;
    let offsetY = 0;

    if (isCropMode && layer.cropRect && layer.originalWidth > 0) {
      activeWidth = layer.cropRect.width * Math.abs(layer.scaleX);
      activeHeight = layer.cropRect.height * Math.abs(layer.scaleY);
      offsetX =
        (layer.cropRect.x - (layer.originalWidth - layer.cropRect.width) / 2) *
        Math.abs(layer.scaleX);
      offsetY =
        (layer.cropRect.y -
          (layer.originalHeight - layer.cropRect.height) / 2) *
        Math.abs(layer.scaleY);
    }

    return { activeWidth, activeHeight, offsetX, offsetY };
  }

  public update(
    activeLayerId: string | null,
    theme: string,
    zoom: number,
    activeTool: string,
  ) {
    if (!activeLayerId || (activeTool !== "select" && activeTool !== "crop")) {
      this.container.visible = false;
      return;
    }

    const state = useLayerStore.getState();
    const layer = state.layers.find((l) => l.id === activeLayerId) as
      ImageLayer | undefined;
    if (!layer || layer.type !== "image") {
      this.container.visible = false;
      return;
    }

    this.container.visible = true;

    const _overlayColor = theme === "dark" ? 0xffffff : 0x0ea5e9;
    const overlayAlpha = theme === "dark" ? 0.3 : 0.8;
    const handleFillColor = theme === "dark" ? 0x000000 : 0xffffff;
    const handleStrokeColor = theme === "dark" ? 0x333333 : 0xffffff;
    const handleStrokeAlpha = theme === "dark" ? 0.8 : 0.9;
    const isCropMode = activeTool === "crop";
    const isDark = theme === "dark";

    const { activeWidth, activeHeight, offsetX, offsetY } =
      this.calculateDimensions(layer, isCropMode);

    const stagePos = { x: layer.x + offsetX, y: layer.y + offsetY };
    const scaledWidth = activeWidth * (zoom / 100);
    const scaledHeight = activeHeight * (zoom / 100);

    this.border.clear();
    if (!isCropMode) {
      this.border.rect(
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight,
      );
      this.border.stroke({
        width: 1.5,
        color: _overlayColor,
        alpha: overlayAlpha,
      });
    }
    this.border.x = stagePos.x;
    this.border.y = stagePos.y;
    this.border.rotation = layer.rotation || 0;

    if (isCropMode) {
      updateCropGrid(
        this.cropGrid,
        scaledWidth,
        scaledHeight,
        isDark,
        _overlayColor,
      );
      this.cropGrid.x = stagePos.x;
      this.cropGrid.y = stagePos.y;
      this.cropGrid.rotation = layer.rotation || 0;
      this.cropGrid.visible = true;
      this.rotationHandle.visible = false;
    } else {
      this.cropGrid.visible = false;

      const rotY = -scaledHeight / 2 - 24;
      this.rotationHandle.clear();
      this.rotationHandle.moveTo(0, -scaledHeight / 2);
      this.rotationHandle.lineTo(0, rotY);
      this.rotationHandle.stroke({
        width: 1,
        color: _overlayColor,
        alpha: 0.5,
      });
      this.rotationHandle.circle(0, rotY, 5);
      this.rotationHandle.fill({ color: handleFillColor });
      this.rotationHandle.stroke({ width: 1.5, color: _overlayColor });
      this.rotationHandle.x = stagePos.x;
      this.rotationHandle.y = stagePos.y;
      this.rotationHandle.rotation = layer.rotation || 0;
      this.rotationHandle.visible = true;
      this.rotationHandle.eventMode = "static";
      this.rotationHandle.cursor = "crosshair";
    }

    this.updateHandles(
      isCropMode,
      handleFillColor,
      handleStrokeColor,
      handleStrokeAlpha,
      _overlayColor,
      scaledWidth,
      scaledHeight,
      stagePos,
      layer,
    );
  }

  private updateHandles(
    isCropMode: boolean,
    handleFillColor: number,
    handleStrokeColor: number,
    handleStrokeAlpha: number,
    _overlayColor: number,
    scaledWidth: number,
    scaledHeight: number,
    stagePos: { x: number; y: number },
    layer: ImageLayer,
  ) {
    const expectedHandles = getHandlesConfig(isCropMode);

    // Remove unused handles
    for (const id in this.handles) {
      if (!expectedHandles.find((h) => h.id === id)) {
        this.container.removeChild(this.handles[id]);
        this.handles[id].destroy();
        delete this.handles[id];
      }
    }

    // Create or update handles
    for (const pos of expectedHandles) {
      if (!this.handles[pos.id]) {
        const handle = new PIXI.Graphics();
        drawHandle(
          handle,
          pos,
          isCropMode,
          handleFillColor,
          handleStrokeColor,
          handleStrokeAlpha,
          _overlayColor,
        );
        this.handles[pos.id] = handle;
        this.container.addChild(handle);
      } else {
        this.handles[pos.id].clear();
        drawHandle(
          this.handles[pos.id],
          pos,
          isCropMode,
          handleFillColor,
          handleStrokeColor,
          handleStrokeAlpha,
          _overlayColor,
        );
      }

      const handle = this.handles[pos.id];
      const unrotatedX = pos.x * (scaledWidth / 2);
      const unrotatedY = pos.y * (scaledHeight / 2);
      const angle = layer.rotation || 0;

      handle.x =
        stagePos.x +
        unrotatedX * Math.cos(angle) -
        unrotatedY * Math.sin(angle);
      handle.y =
        stagePos.y +
        unrotatedX * Math.sin(angle) +
        unrotatedY * Math.cos(angle);
      handle.rotation = angle;
    }
  }
}
