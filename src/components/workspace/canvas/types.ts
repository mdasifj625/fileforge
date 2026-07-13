import * as PIXI from "pixi.js";
import { MaskBrushController } from "@/lib/pixi/MaskBrushController";

export interface CanvasRefs {
  appRef: React.MutableRefObject<PIXI.Application | null>;
  containerRef: React.MutableRefObject<HTMLDivElement | null>;
  spritesRef: React.MutableRefObject<
    Record<string, PIXI.Sprite & { isBeingManipulated?: boolean }>
  >;
  bgSpritesRef: React.MutableRefObject<Record<string, PIXI.Graphics>>;
  maskSpritesRef: React.MutableRefObject<
    Record<
      string,
      PIXI.Sprite & { renderTexture?: PIXI.RenderTexture; maskFileId?: string }
    >
  >;
  transformOverlayRef: React.MutableRefObject<PIXI.Container | null>;
  gridRef: React.MutableRefObject<PIXI.Graphics | null>;
  brushControllerRef: React.MutableRefObject<MaskBrushController | null>;
}
