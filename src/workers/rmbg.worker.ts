import * as Comlink from "comlink";
import { env, pipeline, RawImage } from "@huggingface/transformers";
import { createWorker } from "tesseract.js";

// Disable local models, since we will download from huggingface hub
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

class RMBGProcessor {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private segmenter: any = null;

  async loadModel(onProgress?: (progress: number) => void) {
    if (this.segmenter) return;

    this.segmenter = await pipeline(
      "image-segmentation",
      "onnx-community/BEN2-ONNX",
      {
        device: "wasm",
        progress_callback: (data: { status: string; progress?: number }) => {
          if (
            data.status === "progress" &&
            data.progress !== undefined &&
            onProgress
          ) {
            onProgress(Math.round(data.progress));
          }
        },
      },
    );
  }

  async removeBackgroundGetMask(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
  ): Promise<Blob> {
    await this.loadModel(onProgress);
    const imageURL = URL.createObjectURL(imageBlob);

    try {
      const img = await RawImage.fromURL(imageURL);
      const results = await this.segmenter(img);
      let mask: RawImage;
      if (Array.isArray(results)) {
        mask = results[0].mask;
      } else {
        mask = results;
      }

      for (let i = 0; i < mask.data.length; i++) {
        if (mask.data[i] < 30) {
          mask.data[i] = 0;
        }
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

      // 2. Run the official BEN2 segmentation pipeline
      // BEN2 (Background Erase Network) natively handles alpha matting and edge refinement
      const results = await this.segmenter(img);

      // Extract the output mask RawImage
      let mask: RawImage;
      if (Array.isArray(results)) {
        mask = results[0].mask;
      } else {
        mask = results;
      }

      // 3. Optional: Mathematical Mask Refinement (Noise Floor)
      for (let i = 0; i < mask.data.length; i++) {
        if (mask.data[i] < 30) {
          mask.data[i] = 0; // Crush absolute minimum noise, leaving BEN2's natural alpha matte intact
        }
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
