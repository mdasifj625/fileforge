import { useState } from "react";
import * as Comlink from "comlink";
import { Layer as FileLayer } from "@/types/layer";
import { toolRegistry } from "@/lib/toolRegistry";

let cachedImageWorker: Worker | null = null;
let imageProcessor: {
  processImage: (
    blob: Blob,
    id: string,
    params?: Record<string, unknown>,
  ) => Promise<Blob>;
} | null = null;

function getImageProcessor() {
  if (!cachedImageWorker) {
    cachedImageWorker = new Worker(
      new URL("@/workers/image.worker.ts", import.meta.url),
      { type: "module" },
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imageProcessor = Comlink.wrap(cachedImageWorker) as any;
  }
  return imageProcessor!;
}

export function useDynamicTool(
  activeLayer: FileLayer | undefined,
  replaceLayer: (id: string, newLayer: FileLayer) => void,
) {
  const [isProcessing, setIsProcessing] = useState(false);

  const applyDynamicTool = async (
    toolId: string,
    params: Record<string, unknown>,
  ) => {
    if (!activeLayer || !activeLayer.fileId) return;

    const tool = toolRegistry[toolId];
    if (!tool) return;

    try {
      setIsProcessing(true);
      const dbModule = await import("@/db");
      const db = dbModule.db;
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      let newBlob: Blob;

      // Map to the correct worker based on category
      if (tool.category === "image") {
        const processor = getImageProcessor();
        newBlob = await processor.processImage(
          fileRecord.blob,
          tool.id,
          params,
        );
      } else {
        throw new Error("Worker for category not implemented yet");
      }

      // Save new blob
      const newFileId = crypto.randomUUID();
      await db.files.put({
        id: newFileId,
        blob: newBlob,
        name: `dynamic-${toolId}-${Date.now()}`,
        type: newBlob.type,
        size: newBlob.size,
        createdAt: Date.now(),
      });

      // Update layer
      replaceLayer(activeLayer.id, {
        ...activeLayer,
        fileId: newFileId,
        originalFileId: activeLayer.originalFileId || activeLayer.fileId,
      });
    } catch (e) {
      console.error(`Dynamic tool ${toolId} failed:`, e);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    applyDynamicTool,
    isProcessing,
  };
}
