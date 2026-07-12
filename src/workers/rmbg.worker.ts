import * as Comlink from "comlink";
import { removeBackground } from "@imgly/background-removal";
import { createWorker } from "tesseract.js";

class RMBGProcessor {
  async removeBackground(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    try {
      const finalBlob = await removeBackground(imageBlob, {
        progress: (key: string, current: number, total: number) => {
          if (onProgress && total > 0) {
            onProgress(Math.round((current / total) * 100));
          }
        },
      });
      return finalBlob;
    } catch (e) {
      console.error("Failed to remove background:", e);
      throw e;
    }
  }

  async loadModel(onProgress?: (progress: number) => void) {
    // Kept for backward compatibility with UI
    if (onProgress) onProgress(100);
  }

  async extractText(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
  ): Promise<string> {
    const imageURL = URL.createObjectURL(imageBlob);
    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text" && onProgress) {
            onProgress(m.progress * 100);
          }
        },
      });
      const ret = await worker.recognize(imageURL);
      await worker.terminate();
      return ret.data.text;
    } finally {
      URL.revokeObjectURL(imageURL);
    }
  }
}

const aiProcessor = new RMBGProcessor();
export type AIProcessor = typeof aiProcessor;
Comlink.expose(aiProcessor);
