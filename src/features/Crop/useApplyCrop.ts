import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import { ImageProcessor } from "@/workers/media/image/canvas-image.worker";
import { Layer, ImageLayer } from "@/types/layer";
import { useLayerStore } from "@/store/useLayerStore";

export function useApplyCrop(activeLayer: Layer | undefined) {
  const replaceLayer = useLayerStore((s) => s.replaceLayer);
  const [isApplying, setIsApplying] = useState(false);

  const applyCrop = useCallback(async () => {
    if (!activeLayer || activeLayer.type !== "image") return;
    const layer = activeLayer as ImageLayer;
    if (!layer.cropRect || isApplying) return;
    setIsApplying(true);
    try {
      const fileRecord = await db.files.get(layer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/media/image/canvas-image.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<ImageProcessor>(worker);

      const newBlob = await api.applyCrop(fileRecord.blob, layer.cropRect);

      const newFileId = crypto.randomUUID();
      await db.files.put({
        id: newFileId,
        blob: newBlob,
        name: `cropped-${fileRecord.name}`,
        type: fileRecord.type,
        size: newBlob.size,
        createdAt: Date.now(),
      });

      const bitmap = await createImageBitmap(newBlob);
      const newLayerId = crypto.randomUUID();

      replaceLayer(layer.id, {
        ...layer,
        id: newLayerId,
        fileId: newFileId,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
        cropRect: undefined,
      });

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to apply crop.");
    } finally {
      setIsApplying(false);
    }
  }, [activeLayer, isApplying, replaceLayer]);

  return { applyCrop, isApplying };
}
