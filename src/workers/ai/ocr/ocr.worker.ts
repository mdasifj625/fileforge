import "@/workers/shared/dom.polyfill";
import * as Comlink from "comlink";
import { createWorker } from "tesseract.js";

class OCRProcessor {
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

const ocrProcessor = new OCRProcessor();
export type OCRProcessorType = typeof ocrProcessor;
Comlink.expose(ocrProcessor);
