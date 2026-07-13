import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import type { AIProcessor } from "@/workers/rmbg.worker";
import { FileLayer } from "@/store/useWorkspaceStore";

export function useBackgroundRemoval(
  activeLayer: FileLayer | undefined,
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void,
) {
  const [isFiltering, setIsFiltering] = useState(false);
  const [aiProgress, setAiProgress] = useState<number | null>(null);

  const applyAIBackgroundRemoval = useCallback(async () => {
    if (!activeLayer || isFiltering) return;

    setIsFiltering(true);
    setAiProgress(0);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/rmbg.worker.entry", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<AIProcessor>(worker);

      await api.loadModel(
        Comlink.proxy((progress: number) => {
          setAiProgress(progress);
        }),
      );

      const maskBlob = await api.removeBackgroundGetMask(fileRecord.blob);

      // Save new mask blob
      const maskFileId = crypto.randomUUID();
      await db.files.put({
        id: maskFileId,
        blob: maskBlob,
        name: `mask-${fileRecord.name}`,
        type: "image/png",
        size: maskBlob.size,
        createdAt: Date.now(),
      });

      // Instead of replacing the layer with a new image, we apply the mask to the existing layer
      updateLayerTransform(activeLayer.id, { maskFileId });

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to remove background.");
    } finally {
      setIsFiltering(false);
      setAiProgress(null);
    }
  }, [activeLayer, isFiltering, updateLayerTransform]);

  return { applyAIBackgroundRemoval, isFiltering, aiProgress };
}
