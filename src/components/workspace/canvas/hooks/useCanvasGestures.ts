import { useEffect, useRef } from "react";
import { useLayerStore } from "@/store";

export function useCanvasGestures(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const initialPinchDistance = useRef<number | null>(null);
  const initialLayerScale = useRef<{ x: number; y: number } | null>(null);

  const isPanning = useRef(false);
  const lastPanPos = useRef({ x: 0, y: 0 });
  const initialPanCenter = useRef<{ x: number; y: number } | null>(null);
  const initialLayerPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.ctrlKey || e.metaKey) {
      isPanning.current = true;
      lastPanPos.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPanPos.current.x;
      const dy = e.clientY - lastPanPos.current.y;
      lastPanPos.current = { x: e.clientX, y: e.clientY };

      const { activeLayerId, layers, updateLayerTransform } =
        useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        updateLayerTransform(
          layer.id,
          {
            x: layer.x + dx,
            y: layer.y + dy,
          },
          false,
        );
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const { activeLayerId, updateLayerTransform, layers } =
        useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        updateLayerTransform(layer.id, { x: layer.x, y: layer.y }, true);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );
      initialPinchDistance.current = dist;

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      initialPanCenter.current = { x: centerX, y: centerY };

      const { activeLayerId, layers } = useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        initialLayerScale.current = { x: layer.scaleX, y: layer.scaleY };
        initialLayerPos.current = { x: layer.x, y: layer.y };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      e.touches.length === 2 &&
      initialPinchDistance.current &&
      initialLayerScale.current &&
      initialPanCenter.current &&
      initialLayerPos.current
    ) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY,
      );

      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const scale = dist / initialPinchDistance.current;
      const dx = centerX - initialPanCenter.current.x;
      const dy = centerY - initialPanCenter.current.y;

      const { activeLayerId, updateLayerTransform } = useLayerStore.getState();
      if (activeLayerId) {
        updateLayerTransform(
          activeLayerId,
          {
            scaleX: initialLayerScale.current.x * scale,
            scaleY: initialLayerScale.current.y * scale,
            x: initialLayerPos.current.x + dx,
            y: initialLayerPos.current.y + dy,
          },
          false,
        );
      }
    }
  };

  const handleTouchEnd = () => {
    if (initialPinchDistance.current !== null) {
      const { activeLayerId, updateLayerTransform, layers } =
        useLayerStore.getState();
      const layer = layers.find((l) => l.id === activeLayerId);
      if (layer) {
        updateLayerTransform(
          layer.id,
          {
            scaleX: layer.scaleX,
            scaleY: layer.scaleY,
            x: layer.x,
            y: layer.y,
          },
          true,
        );
      }
    }

    initialPinchDistance.current = null;
    initialLayerScale.current = null;
    initialPanCenter.current = null;
    initialLayerPos.current = null;
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
      if (e.ctrlKey || e.metaKey) {
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
      }
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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
