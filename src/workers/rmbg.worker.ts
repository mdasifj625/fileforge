import * as Comlink from "comlink";
import { env, RawImage } from "@huggingface/transformers";
import { createWorker } from "tesseract.js";
import { PipelinePlugin } from "./plugins/PipelinePlugin";
import { Ben2Plugin } from "./plugins/Ben2Plugin";

// Disable local models, since we will download from huggingface hub
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends?.onnx?.wasm) {
  // Allow multi-threading to speed up WASM execution drastically
  env.backends.onnx.wasm.numThreads =
    typeof navigator !== "undefined"
      ? Math.max(1, (navigator.hardwareConcurrency || 4) - 1)
      : 4;
}

class RMBGProcessor {
  private readonly activePlugin: PipelinePlugin;

  constructor() {
    // We can easily swap this out for Rmbg14Plugin or a future model
    this.activePlugin = new Ben2Plugin();
  }

  async loadModel(onProgress?: (progress: number) => void) {
    await this.activePlugin.loadModel(onProgress);
  }

  async removeBackgroundGetMask(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    await this.loadModel(onProgress);
    const imageURL = URL.createObjectURL(imageBlob);

    try {
      const img = await RawImage.fromURL(imageURL);
      const mask = await this.activePlugin.predict(img);

      if (this.activePlugin.postProcess) {
        this.activePlugin.postProcess(mask);
      }

      const maskCanvas = new OffscreenCanvas(mask.width, mask.height);
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) throw new Error("Failed to get 2d context");

      const maskImgData = new ImageData(mask.width, mask.height);
      for (let i = 0; i < mask.data.length; i++) {
        const val = mask.data[i];
        const idx = i * 4;
        maskImgData.data[idx] = 255;
        maskImgData.data[idx + 1] = 255;
        maskImgData.data[idx + 2] = 255;
        maskImgData.data[idx + 3] = val;
      }
      maskCtx.putImageData(maskImgData, 0, 0);

      return await maskCanvas.convertToBlob({ type: "image/png" });
    } finally {
      URL.revokeObjectURL(imageURL);
    }
  }

  async removeBackground(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    await this.loadModel(onProgress);
    const imageURL = URL.createObjectURL(imageBlob);

    try {
      // 1. Load image using Transformers.js native RawImage
      const img = await RawImage.fromURL(imageURL);

      // 2. Run the official segmentation pipeline via the plugin
      const mask = await this.activePlugin.predict(img);

      // 3. Optional: Mathematical Mask Refinement (Noise Floor)
      if (this.activePlugin.postProcess) {
        this.activePlugin.postProcess(mask);
      }

      // 4. Inject the precise mask directly into the original image's alpha channel
      const transparentImg = img.putAlpha(mask);

      // 5. Render to an OffscreenCanvas
      const finalCanvas = new OffscreenCanvas(
        transparentImg.width,
        transparentImg.height,
      );
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Failed to get 2d context for final");

      const imgData = new ImageData(
        new Uint8ClampedArray(transparentImg.data),
        transparentImg.width,
        transparentImg.height,
      );
      finalCtx.putImageData(imgData, 0, 0);

      // 6. Export pristine PNG
      return await finalCanvas.convertToBlob({ type: "image/png" });
    } finally {
      URL.revokeObjectURL(imageURL);
    }
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
