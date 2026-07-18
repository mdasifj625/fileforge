import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import type { OCRProcessorType } from "@/workers/ai/ocr/ocr.worker";
import { Layer } from "@/types/layer";

export function useOCR(activeLayer: Layer | undefined) {
  const [isFiltering, setIsFiltering] = useState(false);
  const [aiProgress, setAiProgress] = useState<number | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);

  const applyOCR = useCallback(async () => {
    if (!activeLayer || isFiltering) return;

    setIsFiltering(true);
    setAiProgress(0);
    setOcrText(null);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/ai/ocr/ocr.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<OCRProcessorType>(worker);

      const text = await api.extractText(
        fileRecord.blob,
        Comlink.proxy((progress: number) => {
          setAiProgress(progress);
        }),
      );

      setOcrText(text);

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to extract text.");
    } finally {
      setIsFiltering(false);
      setAiProgress(null);
    }
  }, [activeLayer, isFiltering]);

  return { applyOCR, isFiltering, aiProgress, ocrText };
}
