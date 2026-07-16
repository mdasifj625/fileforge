import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import { ImageProcessor } from "@/workers/image.worker";
import {
  FileLayer as Layer,
  FileLayer as ImageLayer,
} from "@/store/useWorkspaceStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function useSmartCrop(activeLayer: Layer | undefined) {
  const replaceLayer = useWorkspaceStore((s) => s.replaceLayer);
  const [isFiltering, setIsFiltering] = useState(false);

  const applySmartCrop = useCallback(async () => {
    if (!activeLayer || isFiltering) return;
    setIsFiltering(true);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/image.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<ImageProcessor>(worker);

      const newBlob = await api.smartCrop(fileRecord.blob);

      const newFileId = crypto.randomUUID();
      await db.files.put({
        id: newFileId,
        blob: newBlob,
        name: `smartcrop-${fileRecord.name}`,
        type: fileRecord.type,
        size: newBlob.size,
        createdAt: Date.now(),
      });

      const bitmap = await createImageBitmap(newBlob);
      const newLayerId = crypto.randomUUID();

      const activeImgLayer = activeLayer as ImageLayer;
      replaceLayer(activeImgLayer.id, {
        ...activeImgLayer,
        id: newLayerId,
        fileId: newFileId,
        originalWidth: bitmap.width,
        originalHeight: bitmap.height,
        cropRect: {
          x: 0,
          y: 0,
          width: bitmap.width,
          height: bitmap.height,
        },
      });

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
