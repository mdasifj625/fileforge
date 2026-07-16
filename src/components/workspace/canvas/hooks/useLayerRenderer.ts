"use client";

import { useEffect } from "react";
import { useLayerStore } from "@/store/useLayerStore";
import { CanvasRefs } from "../types";

export function useLayerRenderer(
  refs: CanvasRefs,
  isPixiReady: boolean,
  setSpriteUpdateTick: React.Dispatch<React.SetStateAction<number>>,
) {
  const { layerManagerRef } = refs;
  const layers = useLayerStore((s) => s.layers);
  const activeLayerId = useLayerStore((s) => s.activeLayerId);

  useEffect(() => {
    let cancelled = false;
    const renderLayers = async () => {
      if (!isPixiReady || !layerManagerRef.current) return;

      await layerManagerRef.current.syncLayers(layers, activeLayerId);

      if (!cancelled) {
        setSpriteUpdateTick((t) => t + 1);
      }
    };

    renderLayers();

    return () => {
      cancelled = true;
    };
  }, [
    layers,
    isPixiReady,
    layerManagerRef,
    setSpriteUpdateTick,
    activeLayerId,
  ]);
}
