"use client";

import { useState } from "react";
import { CanvasRefs } from "../types";
import { useLayerRenderer } from "./useLayerRenderer";
import { useTransformOverlay } from "./useTransformOverlay";

export function useCanvasRender(refs: CanvasRefs, isPixiReady: boolean) {
  const [spriteUpdateTick, setSpriteUpdateTick] = useState(0);

  useLayerRenderer(refs, isPixiReady, setSpriteUpdateTick);
  useTransformOverlay(refs, isPixiReady, spriteUpdateTick);
}
