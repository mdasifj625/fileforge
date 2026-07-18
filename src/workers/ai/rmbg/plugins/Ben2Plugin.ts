import { pipeline, RawImage } from "@huggingface/transformers";
import { AIModelPlugin } from "../../../shared/interfaces/AIModelPlugin";

export class Ben2Plugin implements AIModelPlugin {
  public readonly id = "ben2";
  public readonly name = "BEN2 Background Erase Network";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private segmenter: any = null;
  private readonly device: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly dtype: any;

  constructor(device: string = "wasm", dtype?: string) {
    this.device = device;
    this.dtype = dtype;
  }

  async loadModel(onProgress?: (progress: number) => void): Promise<void> {
    if (this.segmenter) return;

    this.segmenter = await pipeline(
      "image-segmentation",
      "onnx-community/BEN2-ONNX",
      {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        device: this.device as any,
        // Quantized dtype drastically reduces inference time on CPU (q4 = ~4x smaller weights)
        ...(this.dtype ? { dtype: this.dtype } : {}),
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

  async predict(image: RawImage): Promise<RawImage> {
    if (!this.segmenter) {
      throw new Error("Model not loaded");
    }

    const results = await this.segmenter(image);

    let mask: RawImage;
    if (Array.isArray(results)) {
      mask = results[0].mask;
    } else {
      mask = results;
    }
    return mask;
  }

  async dispose(): Promise<void> {
    if (this.segmenter && typeof this.segmenter.dispose === "function") {
      await this.segmenter.dispose();
    }
    this.segmenter = null;
  }

  postProcess(mask: RawImage): void {
    // Crush absolute minimum noise, leaving BEN2's natural alpha matte intact
    for (let i = 0; i < mask.data.length; i++) {
      if (mask.data[i] < 30) {
        mask.data[i] = 0;
      }
    }
  }
}
