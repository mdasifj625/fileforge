import * as Comlink from "comlink";

/**
 * Image Processing Worker
 * This worker runs the WASM/heavy lifting for image processing.
 * By exposing this object via Comlink, the main thread can call these functions asynchronously.
 */
const imageProcessor = {
  async ping() {
    return "pong from image worker";
  },

  // Example placeholder for future processing
  async processImage(
    fileBlob: Blob,
    params: Record<string, unknown>,
  ): Promise<Blob> {
    console.log("Processing image with params:", params);
    // TODO: Implement actual WASM processing (e.g. OpenCV, Pica)
    // For now, return the original blob
    return fileBlob;
  },
};

export type ImageProcessor = typeof imageProcessor;

Comlink.expose(imageProcessor);
