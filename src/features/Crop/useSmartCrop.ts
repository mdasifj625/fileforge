import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import { ImageProcessor } from "@/workers/media/image/canvas-image.worker";
import { Layer, ImageLayer } from "@/types/layer";
import { useLayerStore } from "@/store/useLayerStore";

export function useSmartCrop(activeLayer: Layer | undefined) {
  const replaceLayer = useLayerStore((s) => s.replaceLayer);
  const [isFiltering, setIsFiltering] = useState(false);

  const applySmartCrop = useCallback(async () => {
    if (!activeLayer || isFiltering) return;
    setIsFiltering(true);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/media/image/canvas-image.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<ImageProcessor>(worker);

      const bounds = await api.smartCrop(fileRecord.blob);
      if (!bounds) {
        worker.terminate();
        setIsFiltering(false);
        return;
      }

      const activeImgLayer = activeLayer as ImageLayer;

      const cropX = bounds.minX;
      const cropY = bounds.minY;
      const cropW = bounds.maxX - bounds.minX + 1;
      const cropH = bounds.maxY - bounds.minY + 1;

      // Calculate shift of center
      const oldCx = activeImgLayer.cropRect
        ? activeImgLayer.cropRect.x + activeImgLayer.cropRect.width / 2
        : activeImgLayer.originalWidth / 2;
      const oldCy = activeImgLayer.cropRect
        ? activeImgLayer.cropRect.y + activeImgLayer.cropRect.height / 2
        : activeImgLayer.originalHeight / 2;

      const newCx = cropX + cropW / 2;
      const newCy = cropY + cropH / 2;

      const diffCx = (newCx - oldCx) * Math.abs(activeImgLayer.scaleX);
      const diffCy = (newCy - oldCy) * Math.abs(activeImgLayer.scaleY);

      const angle = activeImgLayer.rotation || 0;
      const globalShiftX = diffCx * Math.cos(angle) - diffCy * Math.sin(angle);
      const globalShiftY = diffCx * Math.sin(angle) + diffCy * Math.cos(angle);

      replaceLayer(activeImgLayer.id, {
        ...activeImgLayer,
        x: activeImgLayer.x + globalShiftX,
        y: activeImgLayer.y + globalShiftY,
        cropRect: {
          x: cropX,
          y: cropY,
          width: cropW,
          height: cropH,
        },
      } as ImageLayer);

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to apply smart crop.");
    } finally {
      setIsFiltering(false);
    }
  }, [activeLayer, isFiltering, replaceLayer]);

  return { applySmartCrop, isFiltering };
}
