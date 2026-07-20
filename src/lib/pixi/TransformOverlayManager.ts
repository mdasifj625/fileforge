import * as PIXI from "pixi.js";
import { ImageLayer } from "@/types/layer";
import { useLayerStore } from "@/store";
import { toolRegistry } from "@/lib/toolRegistry";

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
  layer: ImageLayer,
  zoom: number,
) {
  boundsBox.clear();

  if (layer.cropRect && layer.originalWidth > 0) {
    const scaleX = Math.abs(layer.scaleX);
    const scaleY = Math.abs(layer.scaleY);

    const cropLocalX = -width / 2;
    const cropLocalY = -height / 2;

    const oX = -(layer.cropRect.x + layer.cropRect.width / 2) * scaleX * zoom;
    const oY = -(layer.cropRect.y + layer.cropRect.height / 2) * scaleY * zoom;
    const oW = layer.originalWidth * scaleX * zoom;
    const oH = layer.originalHeight * scaleY * zoom;

    boundsBox.rect(oX, oY, oW, cropLocalY - oY); // Top
    boundsBox.rect(
      oX,
      cropLocalY + height,
      oW,
      oY + oH - (cropLocalY + height),
    ); // Bottom
    boundsBox.rect(oX, cropLocalY, cropLocalX - oX, height); // Left
    boundsBox.rect(
      cropLocalX + width,
      cropLocalY,
      oX + oW - (cropLocalX + width),
      height,
    ); // Right

    boundsBox.fill({ color: 0x000000, alpha: 0.6 });
  }

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
  private readonly app: PIXI.Application;
  private readonly container: PIXI.Container;
  private readonly border: PIXI.Graphics;
  private readonly cropGrid: PIXI.Graphics;
  private readonly rotationHandle: PIXI.Graphics;
  private handles: Record<string, PIXI.Graphics> = {};
  private activeHandle: string | null = null;
  private dragStartPoint = { x: 0, y: 0 };
  private initialLayerTransform = {
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    cropRect: undefined as
      { x: number; y: number; width: number; height: number } | undefined,
  };
  private activeLayerId: string | null = null;
  private activeTool: string = "";
  private allowRotation: boolean = false;
  private zoomValue: number = 1;

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

    this.app.stage.eventMode = "static";
    this.app.stage.on("globalpointermove", this.onPointerMove);
    this.app.stage.on("pointerup", this.onPointerUp);
    this.app.stage.on("pointerupoutside", this.onPointerUp);
  }

  private readonly onPointerMove = (e: PIXI.FederatedPointerEvent) => {
    if (!this.activeHandle || !this.activeLayerId) return;

    const state = useLayerStore.getState();
    const layer = state.layers.find((l) => l.id === this.activeLayerId);
    if (layer?.type !== "image") return;

    if (this.activeHandle === "rotate") {
      this.handleRotatePointerMove(e, state);
      return;
    }

    if (this.activeTool === "crop") {
      this.handleCropPointerMove(e, state, layer, this.activeHandle);
      return;
    }

    this.handleScalePointerMove(e, state, layer, this.activeHandle);
  };

  private handleRotatePointerMove(
    e: PIXI.FederatedPointerEvent,
    state: ReturnType<typeof useLayerStore.getState>,
  ) {
    const centerX = this.initialLayerTransform.x;
    const centerY = this.initialLayerTransform.y;
    // Calculate angle from center to pointer
    // Subtract Math.PI/2 because the handle is at the top (which is -90deg in atan2)
    const newAngle =
      Math.atan2(e.global.y - centerY, e.global.x - centerX) + Math.PI / 2;
    state.updateLayerTransform(
      this.activeLayerId!,
      { rotation: newAngle },
      false,
    );
  }

  private handleCropPointerMove(
    e: PIXI.FederatedPointerEvent,
    state: ReturnType<typeof useLayerStore.getState>,
    layer: ImageLayer,
    activeHandle: string,
  ) {
    const dx = e.global.x - this.dragStartPoint.x;
    const dy = e.global.y - this.dragStartPoint.y;
    const angle = this.initialLayerTransform.rotation;
    const zoom = this.zoomValue;
    const localDx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
    const localDy = dx * Math.sin(-angle) + dy * Math.cos(-angle);

    const scaleX = this.initialLayerTransform.scaleX;
    const scaleY = this.initialLayerTransform.scaleY;

    const imageDx = localDx / (Math.abs(scaleX) * zoom);
    const imageDy = localDy / (Math.abs(scaleY) * zoom);

    let cropX = 0,
      cropY = 0,
      cropW = layer.originalWidth,
      cropH = layer.originalHeight;
    if (this.initialLayerTransform.cropRect) {
      cropX = this.initialLayerTransform.cropRect.x;
      cropY = this.initialLayerTransform.cropRect.y;
      cropW = this.initialLayerTransform.cropRect.width;
      cropH = this.initialLayerTransform.cropRect.height;
    }

    if (activeHandle.includes("r")) cropW += imageDx;
    if (activeHandle.includes("l")) {
      cropX += imageDx;
      cropW -= imageDx;
    }
    if (activeHandle.includes("b")) cropH += imageDy;
    if (activeHandle.includes("t")) {
      cropY += imageDy;
      cropH -= imageDy;
    }

    // Constrain
    if (cropX < 0) {
      cropW += cropX;
      cropX = 0;
    }
    if (cropY < 0) {
      cropH += cropY;
      cropY = 0;
    }
    if (cropX + cropW > layer.originalWidth)
      cropW = layer.originalWidth - cropX;
    if (cropY + cropH > layer.originalHeight)
      cropH = layer.originalHeight - cropY;

    if (cropW < 10) cropW = 10;
    if (cropH < 10) cropH = 10;

    // Calculate shift of center
    const oldCx = this.initialLayerTransform.cropRect
      ? this.initialLayerTransform.cropRect.x +
        this.initialLayerTransform.cropRect.width / 2
      : layer.originalWidth / 2;
    const oldCy = this.initialLayerTransform.cropRect
      ? this.initialLayerTransform.cropRect.y +
        this.initialLayerTransform.cropRect.height / 2
      : layer.originalHeight / 2;

    const newCx = cropX + cropW / 2;
    const newCy = cropY + cropH / 2;

    const diffCx = (newCx - oldCx) * Math.abs(scaleX);
    const diffCy = (newCy - oldCy) * Math.abs(scaleY);

    const globalShiftX = diffCx * Math.cos(angle) - diffCy * Math.sin(angle);
    const globalShiftY = diffCx * Math.sin(angle) + diffCy * Math.cos(angle);

    state.updateLayerTransform(
      this.activeLayerId!,
      {
        x: this.initialLayerTransform.x + globalShiftX,
        y: this.initialLayerTransform.y + globalShiftY,
        cropRect: { x: cropX, y: cropY, width: cropW, height: cropH },
      },
      false,
    );
  }

  private handleScalePointerMove(
    e: PIXI.FederatedPointerEvent,
    state: ReturnType<typeof useLayerStore.getState>,
    layer: ImageLayer,
    activeHandle: string,
  ) {
    const dx = e.global.x - this.dragStartPoint.x;
    const dy = e.global.y - this.dragStartPoint.y;
    const angle = this.initialLayerTransform.rotation;
    const zoom = this.zoomValue;
    const localDx = dx * Math.cos(-angle) - dy * Math.sin(-angle);
    const localDy = dx * Math.sin(-angle) + dy * Math.cos(-angle);

    let dScaleX = 0;
    let dScaleY = 0;
    let shiftX = 0;
    let shiftY = 0;

    const baseW = layer.originalWidth * zoom;
    const baseH = layer.originalHeight * zoom;

    if (activeHandle.includes("r")) {
      dScaleX = localDx / baseW;
      shiftX += localDx / 2;
    }
    if (activeHandle.includes("l")) {
      dScaleX = -localDx / baseW;
      shiftX += localDx / 2;
    }
    if (activeHandle.includes("b")) {
      dScaleY = localDy / baseH;
      shiftY += localDy / 2;
    }
    if (activeHandle.includes("t")) {
      dScaleY = -localDy / baseH;
      shiftY += localDy / 2;
    }

    // If corner handle, preserve aspect ratio by applying uniform scale to both
    if (activeHandle.length === 2) {
      const scaleDelta = (dScaleX + dScaleY) / 2;
      dScaleX = scaleDelta;
      dScaleY = scaleDelta;
      // We recalculate shift to match the proportional scale
      shiftX = activeHandle.includes("r")
        ? (scaleDelta * baseW) / 2
        : -(scaleDelta * baseW) / 2;
      shiftY = activeHandle.includes("b")
        ? (scaleDelta * baseH) / 2
        : -(scaleDelta * baseH) / 2;
    }

    const newScaleX = this.initialLayerTransform.scaleX + dScaleX;
    const newScaleY = this.initialLayerTransform.scaleY + dScaleY;

    // Rotate the shift back to global space to update x,y
    const globalShiftX = shiftX * Math.cos(angle) - shiftY * Math.sin(angle);
    const globalShiftY = shiftX * Math.sin(angle) + shiftY * Math.cos(angle);

    state.updateLayerTransform(
      this.activeLayerId!,
      {
        scaleX: newScaleX,
        scaleY: newScaleY,
        x: this.initialLayerTransform.x + globalShiftX,
        y: this.initialLayerTransform.y + globalShiftY,
      },
      false,
    );
  }

  private readonly onPointerUp = () => {
    if (this.activeHandle && this.activeLayerId) {
      const state = useLayerStore.getState();
      const layer = state.layers.find((l) => l.id === this.activeLayerId);
      if (layer) {
        state.updateLayerTransform(
          this.activeLayerId,
          {
            scaleX: layer.scaleX,
            scaleY: layer.scaleY,
            rotation: layer.rotation,
            x: layer.x,
            y: layer.y,
          },
          true,
        );
      }
    }
    this.activeHandle = null;
  };

  private setupHandleInteraction(handle: PIXI.Graphics, id: string) {
    handle.eventMode = "static";
    handle.removeAllListeners("pointerdown");
    handle.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
      this.activeHandle = id;
      this.dragStartPoint = { x: e.global.x, y: e.global.y };
      const state = useLayerStore.getState();
      const layer = state.layers.find((l) => l.id === this.activeLayerId);
      if (layer) {
        this.initialLayerTransform = {
          x: layer.x,
          y: layer.y,
          scaleX: layer.scaleX,
          scaleY: layer.scaleY,
          rotation: layer.rotation || 0,
          cropRect:
            layer.type === "image" && layer.cropRect
              ? { ...layer.cropRect }
              : undefined,
        };
      }
      e.stopPropagation(); // Prevent canvas pan
    });
  }

  public getContainer() {
    return this.container;
  }

  public destroy() {
    this.app.stage.removeChild(this.container);
    this.container.destroy({ children: true });
    this.app.stage.off("globalpointermove", this.onPointerMove);
    this.app.stage.off("pointerup", this.onPointerUp);
    this.app.stage.off("pointerupoutside", this.onPointerUp);
  }

  private calculateDimensions(layer: ImageLayer) {
    let activeWidth = layer.originalWidth * Math.abs(layer.scaleX);
    let activeHeight = layer.originalHeight * Math.abs(layer.scaleY);

    if (layer.cropRect && layer.originalWidth > 0) {
      activeWidth = layer.cropRect.width * Math.abs(layer.scaleX);
      activeHeight = layer.cropRect.height * Math.abs(layer.scaleY);
    }
    // layer.x and layer.y are always the center of the cropped image (or full image if uncropped)
    const offsetX = 0;
    const offsetY = 0;

    return { activeWidth, activeHeight, offsetX, offsetY };
  }

  public update(
    activeLayerId: string | null,
    theme: string,
    zoom: number,
    activeTool: string,
  ) {
    const toolDef = activeTool ? toolRegistry[activeTool] : null;

    if (!activeLayerId || !toolDef?.showTransformOverlay) {
      this.container.visible = false;
      this.activeLayerId = null;
      return;
    }

    const state = useLayerStore.getState();
    const layer = state.layers.find((l) => l.id === activeLayerId) as
      ImageLayer | undefined;
    if (layer?.type !== "image") {
      this.container.visible = false;
      this.activeLayerId = null;
      return;
    }

    this.container.visible = true;
    this.activeLayerId = activeLayerId;
    this.activeTool = activeTool;
    this.zoomValue = zoom / 100;
    this.allowRotation = toolDef.allowRotation !== false;

    const _overlayColor = theme === "dark" ? 0xffffff : 0x0ea5e9;
    const overlayAlpha = theme === "dark" ? 0.3 : 0.8;
    const handleFillColor = theme === "dark" ? 0x000000 : 0xffffff;
    const handleStrokeColor = theme === "dark" ? 0x333333 : 0xffffff;
    const handleStrokeAlpha = theme === "dark" ? 0.8 : 0.9;
    const isCropMode = activeTool === "crop";
    const isDark = theme === "dark";

    const { activeWidth, activeHeight, offsetX, offsetY } =
      this.calculateDimensions(layer);

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
        layer,
        this.zoomValue,
      );
      this.cropGrid.x = stagePos.x;
      this.cropGrid.y = stagePos.y;
      this.cropGrid.rotation = layer.rotation || 0;
      this.cropGrid.visible = true;
      this.rotationHandle.visible = false;
    } else {
      this.cropGrid.visible = false;

      if (this.allowRotation) {
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
        this.rotationHandle.cursor = "crosshair";
        this.setupHandleInteraction(this.rotationHandle, "rotate");
      } else {
        this.rotationHandle.visible = false;
      }
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
      if (!expectedHandles.some((h) => h.id === id)) {
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
        this.setupHandleInteraction(handle, pos.id);
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
