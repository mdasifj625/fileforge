import { RawImage } from "@huggingface/transformers";

export interface PipelinePlugin {
  /**
   * Unique identifier for the plugin (e.g. "ben2", "rmbg-1.4")
   */
  readonly id: string;

  /**
   * Display name for the plugin model
   */
  readonly name: string;

  /**
   * Initializes and loads the ONNX model into memory.
   * @param onProgress Callback for download/initialization progress.
   */
  loadModel(onProgress?: (progress: number) => void): Promise<void>;

  /**
   * Processes the input image and returns the raw alpha mask.
   * @param image The decoded RawImage to process.
   * @returns A RawImage representing the predicted alpha mask.
   */
  predict(image: RawImage): Promise<RawImage>;

  /**
   * Optional post-processing logic specific to the model (e.g. thresholding noise floors).
   * @param mask The raw mask returned by predict().
   */
  postProcess?(mask: RawImage): void;
}
