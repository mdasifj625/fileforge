import * as Comlink from "comlink";
import {
  env,
  AutoModel,
  AutoProcessor,
  RawImage,
  PreTrainedModel,
  Processor,
} from "@huggingface/transformers";
import { createWorker } from "tesseract.js";

// Disable local models, since we will download from huggingface hub
env.allowLocalModels = false;
env.useBrowserCache = true;

class RMBGProcessor {
  private model: PreTrainedModel | null = null;
  private processor: Processor | null = null;
  private isLoaded: boolean = false;

  async loadModel(onProgress?: (progress: number) => void) {
    if (this.isLoaded) return;

    try {
      this.model = await AutoModel.from_pretrained("briaai/RMBG-1.4", {
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

      this.processor = await AutoProcessor.from_pretrained("briaai/RMBG-1.4", {
        config: {
          do_normalize: true,
          do_pad: false,
          do_rescale: true,
          do_resize: true,
          image_mean: [0.5, 0.5, 0.5],
          feature_extractor_type: "ImageFeatureExtractor",
          image_std: [1, 1, 1],
          resample: 2,
          rescale_factor: 0.00392156862745098,
          size: { width: 1024, height: 1024 },
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

    if (!this.processor || !this.model) {
      throw new Error("Model or processor not loaded");
    }

    const imageURL = URL.createObjectURL(imageBlob);
    try {
      // 1. Read image
      const image = await RawImage.fromURL(imageURL);

      // 2. Preprocess image
      const { pixel_values } = await this.processor(image);

      // 3. Predict alpha matte
      const { output } = await this.model({ input: pixel_values });

      // 4. Resize mask back to original size
      const mask = await RawImage.fromTensor(
        output[0].mul(255).to("uint8"),
      ).resize(image.width, image.height);

      // 5. Update alpha channel
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get 2d context");

      // Draw original image
      const img = new Image();
      img.src = imageURL;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      ctx.drawImage(img, 0, 0);

      // Apply mask
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < mask.data.length; i++) {
        imageData.data[i * 4 + 3] = mask.data[i]; // Update alpha channel
      }
      ctx.putImageData(imageData, 0, 0);

      // 6. Return as Blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) =>
            blob ? resolve(blob) : reject(new Error("Blob conversion failed")),
          "image/png", // MUST be png to support transparency
        );
      });
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
