import { useEffect, useRef } from "react";
import { useLayerStore, useToolStore, useExportStore, useAIStore } from "@/store";

export function useCanvasGestures(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const initialPinchDistance = useRef<number | null>(null);
  const initialLayerScale = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
      initialPinchDistance.current = dist;

      const { activeLayerId, layers } = useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        initialLayerScale.current = { x: layer.scaleX, y: layer.scaleY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      e.touches.length === 2 &&
      initialPinchDistance.current &&
      initialLayerScale.current
    ) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const scale = dist / initialPinchDistance.current;
      const { activeLayerId, updateLayerTransform } =
        useLayerStore.getState();
      if (activeLayerId) {
        updateLayerTransform(
          activeLayerId,
          {
            scaleX: initialLayerScale.current.x * scale,
            scaleY: initialLayerScale.current.y * scale,
          },
          false,
        );
      }
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistance.current = null;
    initialLayerScale.current = null;
  };

  // Block native pinch-to-zoom on mobile and native wheel scroll/zoom on desktop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventNativeZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault(); // Block native page scroll and browser zoom

      const { activeLayerId, layers, updateLayerTransform } =
        useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (!layer) return;

      const delta = e.deltaY < 0 ? 1.05 : 0.95;
      updateLayerTransform(
        layer.id,
        {
          scaleX: layer.scaleX * delta,
          scaleY: layer.scaleY * delta,
        },
        false,
      );
    };

    container.addEventListener("touchmove", preventNativeZoom, {
      passive: false,
    });
    container.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      container.removeEventListener("touchmove", preventNativeZoom);
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [containerRef]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
