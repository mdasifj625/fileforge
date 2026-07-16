import * as PIXI from "pixi.js";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";
import { LayerManager } from "@/lib/pixi/LayerManager";
import { TransformOverlayManager } from "@/lib/pixi/TransformOverlayManager";

export interface CanvasRefs {
  appRef: React.MutableRefObject<PIXI.Application | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  layerManagerRef: React.MutableRefObject<LayerManager | null>;
  transformOverlayManagerRef: React.MutableRefObject<TransformOverlayManager | null>;
  brushControllerRef: React.MutableRefObject<MaskBrushController | null>;
}
