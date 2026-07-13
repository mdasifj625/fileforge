import { pipeline, RawImage } from "@huggingface/transformers";
import { PipelinePlugin } from "./PipelinePlugin";

export class Ben2Plugin implements PipelinePlugin {
  public readonly id = "ben2";
  public readonly name = "BEN2 Background Erase Network";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private segmenter: any = null;

  async loadModel(onProgress?: (progress: number) => void): Promise<void> {
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

  async predict(image: RawImage): Promise<RawImage> {
    if (!this.segmenter) throw new Error("Model not loaded");

    const results = await this.segmenter(image);
    let mask: RawImage;
    if (Array.isArray(results)) {
      mask = results[0].mask;
    } else {
      mask = results;
    }
    return mask;
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
