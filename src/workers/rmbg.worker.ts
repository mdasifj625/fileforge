import * as Comlink from "comlink";
import {
  env,
  AutoModel,
  PreTrainedModel,
  Tensor,
} from "@huggingface/transformers";
import { createWorker } from "tesseract.js";

// Disable local models, since we will download from huggingface hub
env.allowLocalModels = false;
env.useBrowserCache = true;
if (env.backends && env.backends.onnx && env.backends.onnx.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

class RMBGProcessor {
  private model: PreTrainedModel | null = null;
  private isLoaded: boolean = false;

  async loadModel(onProgress?: (progress: number) => void) {
    if (this.isLoaded) return;

    try {
      this.model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
        device: "wasm",
        progress_callback: (data: { status: string; progress?: number }) => {
          if (
            data.status === "progress" &&
            data.progress !== undefined &&
            onProgress
          ) {
            onProgress(data.progress);
          }
        },
      });

      this.isLoaded = true;
    } catch (e) {
      console.error("Failed to load RMBG model:", e);
      throw e;
    }
  }

  async removeBackground(imageBlob: Blob): Promise<Blob> {
    if (!this.isLoaded) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error("Model not loaded");
    }

    const imageURL = URL.createObjectURL(imageBlob);
    try {
      // 1. Read image and manually resize to 1024x1024 to prevent transformers.js
      // from falling back to RawImage.resize() which uses document.createElement.
      const imgBitmap = await createImageBitmap(imageBlob);
      const origWidth = imgBitmap.width;
      const origHeight = imgBitmap.height;

      // We need the original image data later for final composition
      const origCanvas = new OffscreenCanvas(origWidth, origHeight);
      const origCtx = origCanvas.getContext("2d");
      if (!origCtx) throw new Error("Failed to get orig 2d context");
      origCtx.drawImage(imgBitmap, 0, 0);
      const imgData = origCtx.getImageData(0, 0, origWidth, origHeight);

      // Now create the 1024x1024 resized version for the model
      const targetSize = 1024;
      const resizedCanvas = new OffscreenCanvas(targetSize, targetSize);
      const resizedCtx = resizedCanvas.getContext("2d");
      if (!resizedCtx) throw new Error("Failed to get resized 2d context");
      resizedCtx.imageSmoothingQuality = "high";
      resizedCtx.drawImage(imgBitmap, 0, 0, targetSize, targetSize);

      const resizedImgData = resizedCtx.getImageData(
        0,
        0,
        targetSize,
        targetSize,
      );

      const numPixels = targetSize * targetSize;
      const float32Data = new Float32Array(3 * numPixels);

      const rStride = 0;
      const gStride = numPixels;
      const bStride = numPixels * 2;

      for (let i = 0; i < numPixels; i++) {
        const r = resizedImgData.data[i * 4];
        const g = resizedImgData.data[i * 4 + 1];
        const b = resizedImgData.data[i * 4 + 2];

        // Rescale (0-1) and Normalize (mean=0.5, std=1.0)
        float32Data[rStride + i] = (r / 255.0 - 0.5) / 1.0;
        float32Data[gStride + i] = (g / 255.0 - 0.5) / 1.0;
        float32Data[bStride + i] = (b / 255.0 - 0.5) / 1.0;
      }

      const pixel_values = new Tensor("float32", float32Data, [
        1,
        3,
        targetSize,
        targetSize,
      ]);

      // 3. Predict alpha matte
      const { output } = await this.model({ input: pixel_values });

      // 4. Manually resize mask using OffscreenCanvas to avoid RawImage DOM dependencies
      const maskTensor = output[0].mul(255).to("uint8");
      // The mask is usually 1024x1024
      const maskWidth = maskTensor.dims[maskTensor.dims.length - 2] || 1024;
      const maskHeight = maskTensor.dims[maskTensor.dims.length - 1] || 1024;

      const maskData = new Uint8ClampedArray(maskWidth * maskHeight * 4);
      for (let i = 0; i < maskTensor.data.length; i++) {
        const val = maskTensor.data[i];
        maskData[i * 4] = val;
        maskData[i * 4 + 1] = val;
        maskData[i * 4 + 2] = val;
        maskData[i * 4 + 3] = val;
      }

      const maskImageData = new ImageData(maskData, maskWidth, maskHeight);
      const maskCanvas = new OffscreenCanvas(maskWidth, maskHeight);
      const maskCtx = maskCanvas.getContext("2d");
      if (!maskCtx) throw new Error("Failed to get 2d context for mask");
      maskCtx.putImageData(maskImageData, 0, 0);

      // 5. Apply mask to original image
      const finalCanvas = new OffscreenCanvas(origWidth, origHeight);
      const finalCtx = finalCanvas.getContext("2d");
      if (!finalCtx) throw new Error("Failed to get 2d context for final");

      // Draw the scaled mask
      finalCtx.imageSmoothingQuality = "high";
      finalCtx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
      const scaledMaskData = finalCtx.getImageData(0, 0, origWidth, origHeight);

      // Inject mask alpha into original image data
      for (let i = 0; i < scaledMaskData.data.length; i += 4) {
        // The red channel of the scaled mask serves as the alpha mask
        imgData.data[i + 3] = scaledMaskData.data[i];
      }

      finalCtx.putImageData(imgData, 0, 0);

      // 6. Return as Blob
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
