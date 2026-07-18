"use client";

import { useEffect } from "react";
import { CanvasRefs } from "@/components/workspace/canvas/types";
import { useLayerStore, useToolStore } from "@/store";

export function useCanvasRender(refs: CanvasRefs, isPixiReady: boolean) {
  useEffect(() => {
    if (
      !isPixiReady ||
      !refs.layerManagerRef.current ||
      !refs.transformOverlayManagerRef.current
    )
      return;

    // We subscribe to the store manually to avoid triggering React re-renders 60fps during dragging!
    const unsubLayerStore = useLayerStore.subscribe(async (state) => {
      if (
        !refs.layerManagerRef.current ||
        !refs.transformOverlayManagerRef.current
      )
        return;

      // 1. Sync PixiJS Sprites
      await refs.layerManagerRef.current.syncLayers(
        state.layers,
        state.activeLayerId,
      );

      // 2. Sync Bounding Box/Overlays
      const toolState = useToolStore.getState();
      refs.transformOverlayManagerRef.current.update(
        state.activeLayerId,
        toolState.theme,
        toolState.zoom,
        toolState.activeTool || "",
      );
    });

    const unsubToolStore = useToolStore.subscribe((toolState) => {
      if (!refs.transformOverlayManagerRef.current) return;
      const layerState = useLayerStore.getState();
      refs.transformOverlayManagerRef.current.update(
        layerState.activeLayerId,
        toolState.theme,
        toolState.zoom,
        toolState.activeTool || "",
      );
    });

    return () => {
      unsubLayerStore();
      unsubToolStore();
    };
  }, [isPixiReady, refs.layerManagerRef, refs.transformOverlayManagerRef]);
}
