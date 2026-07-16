"use client";

import { useEffect } from "react";
import { useLayerStore, useToolStore } from "@/store";
import { CanvasRefs } from "../types";

export function useTransformOverlay(
  refs: CanvasRefs,
  isPixiReady: boolean,
  spriteUpdateTick: number,
) {
  const { transformOverlayManagerRef } = refs;

  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const activeTool = useToolStore((s) => s.activeTool);
  const theme = useToolStore((s) => s.theme);
  const zoom = useToolStore((s) => s.zoom);

  useEffect(() => {
    if (!isPixiReady || !transformOverlayManagerRef.current) return;
    
    transformOverlayManagerRef.current.update(
      activeLayerId,
      theme,
      zoom,
      activeTool || "",
    );
  }, [
    activeLayerId,
    activeTool,
    theme,
    zoom,
    spriteUpdateTick,
    isPixiReady,
    transformOverlayManagerRef,
  ]);
}
