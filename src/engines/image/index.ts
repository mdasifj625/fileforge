import * as Comlink from "comlink";
import type { ImageProcessor } from "@/workers/media/image/canvas-image.worker";

// Next.js handles Web Workers via the native URL API
const worker = new Worker(
  new URL("@/workers/media/image/canvas-image.worker", import.meta.url),
  {
    type: "module",
  },
);

// Create a typed proxy to the worker
export const imageEngine = Comlink.wrap<ImageProcessor>(worker);

// Export a singleton or factory based on architecture needs
export default imageEngine;
