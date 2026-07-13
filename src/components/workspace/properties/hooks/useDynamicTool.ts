import { useState } from "react";
import * as Comlink from "comlink";
import { FileLayer } from "@/store/useWorkspaceStore";
import { toolRegistry } from "@/lib/toolRegistry";

export function useDynamicTool(
  activeLayer: FileLayer | undefined,
  replaceLayer: (id: string, layer: FileLayer) => void,
) {
  const [isProcessing, setIsProcessing] = useState(false);

  const applyDynamicTool = async (
    toolId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const workerInstance = new Worker(
          new URL("@/workers/image.worker.ts", import.meta.url),
          { type: "module" },
        );
        const imageProcessor = Comlink.wrap<unknown>(
          workerInstance,
        ) as unknown as {
          processImage: (blob: Blob, id: string) => Promise<Blob>;
        };

        // For now, assume processImage takes Blob and FilterType (string)
        // We can pass params if needed in the future
        newBlob = await imageProcessor.processImage(fileRecord.blob, tool.id);
        workerInstance.terminate();
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
