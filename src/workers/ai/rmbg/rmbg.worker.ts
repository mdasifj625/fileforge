import "@/workers/shared/dom.polyfill";
import * as Comlink from "comlink";
import { env, RawImage } from "@huggingface/transformers";

import { AIModelPlugin } from "@/workers/shared/interfaces/AIModelPlugin";
import { NavigatorWithAI } from "@/workers/shared/interfaces/NavigatorWithAI";
import { Ben2Plugin } from "@/workers/ai/rmbg/plugins/Ben2Plugin";
import { PerformanceProfiler } from "@/utils/PerformanceProfiler";

// Phase 6: ONNX Runtime Optimization & Phase 5: Backend Detection
env.allowLocalModels = false;
// When testing over a local network IP (HTTP), caches will be undefined.
env.useBrowserCache = typeof caches !== "undefined";
if (env.backends?.onnx?.wasm) {
  // Allow multi-threading to speed up WASM execution drastically
  env.backends.onnx.wasm.numThreads =
    typeof navigator !== "undefined"
      ? Math.max(1, (navigator.hardwareConcurrency || 4) - 1)
      : 4;
  env.backends.onnx.wasm.simd = true;
}

// BEN2 transformer requires substantial GPU buffer capacity.
// Devices that expose WebGPU but have tiny limits will crash at shader compilation.
const WEBGPU_MIN_BUFFER_SIZE = 256 * 1024 * 1024; // 256 MB

// Global cache for backend probing outcome to avoid repeating logs across worker reinstantiations.
let preferredBackends: string[] | null = null;

async function probeWebGPU(backends: string[]): Promise<void> {
  if (
    typeof navigator === "undefined" ||
    !(navigator as unknown as NavigatorWithAI).gpu
  )
    return;
  try {
    const adapter = await (
      navigator as unknown as NavigatorWithAI
    ).gpu!.requestAdapter();
    if (!adapter) return;

    const bufferSize = adapter.limits?.maxBufferSize ?? 0;
    const storageSize = adapter.limits?.maxStorageBufferBindingSize ?? 0;
    // Use unknown cast first for features array spread to avoid typing issues if features is not iterable
    const features: string[] = [
      ...((adapter.features as unknown as Iterable<string>) ?? []),
    ];
    const hasF16 = features.includes("shader-f16");

    PerformanceProfiler.logGPUAdapter({
      vendor: adapter.info?.vendor ?? "unknown",
      architecture: adapter.info?.architecture ?? "unknown",
      description: adapter.info?.description ?? "unknown",
      maxBufferSize: bufferSize,
      maxStorageBufferBindingSize: storageSize,
      features,
    });

    const storageBindingSizeLimit = 128 * 1024 * 1024; // 128 MB
    if (
      bufferSize >= WEBGPU_MIN_BUFFER_SIZE &&
      storageSize > storageBindingSizeLimit
    ) {
      backends.push("webgpu");
      PerformanceProfiler.logInfo(
        `WebGPU accepted — shader-f16: ${hasF16 ? "✅ Yes" : "❌ No"}`,
      );
    } else {
      PerformanceProfiler.logInfo(
        `WebGPU skipped — limits insufficient for BEN2. maxBufferSize: ${(bufferSize / 1024 / 1024).toFixed(0)} MB (req: 256 MB), maxStorageBufferBindingSize: ${(storageSize / 1024 / 1024).toFixed(0)} MB (req: > 128 MB)`,
      );
    }
  } catch (e) {
    PerformanceProfiler.logInfo(
      `WebGPU adapter probe failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

async function probeBackends(): Promise<string[]> {
  const backends: string[] = [];
  await probeWebGPU(backends);

  if (
    typeof navigator !== "undefined" &&
    (navigator as unknown as NavigatorWithAI).ml
  ) {
    backends.push("webnn-npu", "webnn-gpu", "webnn");
  }

  backends.push("wasm");
  return Array.from(new Set(backends));
}

async function getOrProbeBackends(): Promise<string[]> {
  if (preferredBackends) return preferredBackends;
  preferredBackends = await probeBackends();

  // Log structured environment info via the profiler on worker init
  PerformanceProfiler.logEnvironment();
  return preferredBackends;
}

export type QualityMode = "fast" | "balanced" | "high" | "original";

const QualityMap: Record<QualityMode, number> = {
  fast: 512,
  balanced: 1024,
  high: 1536,
  original: 0,
};

class RMBGProcessor {
  private activePlugin: AIModelPlugin | null = null;

  async loadModel(
    onProgress?: (progress: number) => void,
    forceBackend?: string,
  ) {
    if (this.activePlugin) {
      return;
    }

    const backendsList = await getOrProbeBackends();
    const backend = forceBackend || backendsList[0];

    // If the adapter probe already rejected this backend, fail fast —
    // don't attempt to load the model and silently deadlock.
    if (forceBackend && !backendsList.includes(forceBackend)) {
      throw new Error(
        `Backend '${forceBackend}' was rejected by the GPU adapter probe (insufficient limits or unstable driver). Falling back.`,
      );
    }

    const profiler = new PerformanceProfiler(
      `Model Initialization [${backend}]`,
    );

    // Dtype Optimization Selection:
    // - WebGPU: If the device supports shader-f16 (e.g. Modern GPUs), load fp16 for faster speed and lower memory.
    //           Otherwise fall back to fp32.
    // - WASM: ONNX BEN2-ONNX only has official fp32 (and community pezhgorski/BEN2-FP32-ONNX).
    //         Specifying q4/q8 fails or hangs because the community repo lacks them. WASM uses default (fp32).
    let dtype: string | undefined = undefined;
    if (backend === "webgpu") {
      const adapter =
        typeof navigator !== "undefined" &&
        (navigator as unknown as NavigatorWithAI).gpu
          ? await (
              navigator as unknown as NavigatorWithAI
            ).gpu!.requestAdapter()
          : null;
      const hasF16 = adapter?.features?.has("shader-f16") ?? false;
      dtype = hasF16 ? "fp16" : "fp32";
    }

    const dtypeLabel = dtype ?? "default fp32";

    try {
      profiler.start(
        `Fetch Model Weights & Session Init [dtype=${dtypeLabel}]`,
      );
      const plugin = new Ben2Plugin(backend, dtype);
      await plugin.loadModel(onProgress);
      profiler.end(`Fetch Model Weights & Session Init [dtype=${dtypeLabel}]`);

      profiler.succeed(
        `Backend ${backend.toUpperCase()} [${dtypeLabel}] ready`,
      );
      this.activePlugin = plugin;
    } catch (e) {
      profiler.fail(`Backend ${backend.toUpperCase()} [${dtypeLabel}]`, e);
      throw e;
    }
  }

  private resizeImage(image: RawImage, maxDim: number): RawImage {
    if (maxDim === 0 || (image.width <= maxDim && image.height <= maxDim)) {
      return image;
    }
    const scale = Math.min(maxDim / image.width, maxDim / image.height);
    const newWidth = Math.round(image.width * scale);
    const newHeight = Math.round(image.height * scale);

    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context for resize");

    const imgData = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height,
    );

    const tempCanvas = new OffscreenCanvas(image.width, image.height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx!.putImageData(imgData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    const resizedData = ctx.getImageData(0, 0, newWidth, newHeight);

    return new RawImage(
      new Uint8ClampedArray(resizedData.data),
      newWidth,
      newHeight,
      image.channels,
    );
  }

  private upscaleMask(
    mask: RawImage,
    targetWidth: number,
    targetHeight: number,
  ): RawImage {
    if (mask.width === targetWidth && mask.height === targetHeight) {
      return mask;
    }
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2d context for upscale");

    const maskImgData = new ImageData(mask.width, mask.height);
    for (let i = 0; i < mask.data.length; i++) {
      const val = mask.data[i];
      const idx = i * 4;
      maskImgData.data[idx] = val;
      maskImgData.data[idx + 1] = val;
      maskImgData.data[idx + 2] = val;
      maskImgData.data[idx + 3] = 255;
    }

    const tempCanvas = new OffscreenCanvas(mask.width, mask.height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx!.putImageData(maskImgData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
    const upscaledData = ctx.getImageData(0, 0, targetWidth, targetHeight);

    const newMaskData = new Uint8Array(targetWidth * targetHeight);
    for (let i = 0; i < newMaskData.length; i++) {
      newMaskData[i] = upscaledData.data[i * 4];
    }

    return new RawImage(newMaskData, targetWidth, targetHeight, 1);
  }

  async removeBackgroundGetMask(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
    quality: QualityMode = "balanced",
  ): Promise<Blob> {
    const profiler = new PerformanceProfiler("Background Removal (Mask Only)");
    profiler.start("Load Model");
    await this.loadModel(onProgress);
    profiler.end("Load Model");

    profiler.start("Decode Image");
    const imageURL = URL.createObjectURL(imageBlob);
    let finalBlob: Blob;

    try {
      const img = await RawImage.fromURL(imageURL);
      profiler.end("Decode Image");

      profiler.setMetadata("Original File Size", imageBlob.size);
      profiler.setMetadata("Original Width", img.width);
      profiler.setMetadata("Original Height", img.height);
      profiler.setMetadata("Quality Mode", quality);

      profiler.start("Resize");
      const maxDim = QualityMap[quality];
      const shouldResize =
        maxDim > 0 && (img.width > maxDim || img.height > maxDim);
      const resizedImg = shouldResize ? this.resizeImage(img, maxDim) : img;
      profiler.end("Resize");

      profiler.start("Model Inference");
      if (!this.activePlugin) throw new Error("Model not loaded");
      const smallMask = await this.activePlugin.predict(resizedImg);
      profiler.end("Model Inference");

      profiler.start("Post Processing");
      if (this.activePlugin.postProcess) {
        this.activePlugin.postProcess(smallMask);
      }
      profiler.end("Post Processing");

      profiler.start("Upscale Mask");
      const mask = this.upscaleMask(smallMask, img.width, img.height);
      profiler.end("Upscale Mask");

      profiler.start("Canvas Rendering");
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
      profiler.end("Canvas Rendering");

      profiler.start("PNG Encoding");
      finalBlob = await maskCanvas.convertToBlob({ type: "image/png" });
      profiler.end("PNG Encoding");
    } finally {
      URL.revokeObjectURL(imageURL);
    }

    const reportStr = profiler.report();
    console.log(reportStr);
    return finalBlob;
  }

  async removeBackground(
    imageBlob: Blob,
    onProgress?: (progress: number) => void,
    quality: QualityMode = "balanced",
  ): Promise<Blob> {
    const profiler = new PerformanceProfiler("Background Removal");
    profiler.start("Load Model");
    await this.loadModel(onProgress);
    profiler.end("Load Model");

    profiler.start("Decode Image");
    const imageURL = URL.createObjectURL(imageBlob);
    let finalBlob: Blob;

    try {
      const img = await RawImage.fromURL(imageURL);
      profiler.end("Decode Image");

      profiler.setMetadata("Original File Size", imageBlob.size);
      profiler.setMetadata("Original Width", img.width);
      profiler.setMetadata("Original Height", img.height);
      profiler.setMetadata("Quality Mode", quality);

      profiler.start("Resize");
      const maxDim = QualityMap[quality];
      const shouldResize =
        maxDim > 0 && (img.width > maxDim || img.height > maxDim);
      const resizedImg = shouldResize ? this.resizeImage(img, maxDim) : img;
      profiler.end("Resize");

      profiler.setMetadata("Inference Width", resizedImg.width);
      profiler.setMetadata("Inference Height", resizedImg.height);

      profiler.start("Model Inference");
      if (!this.activePlugin) throw new Error("Model not loaded");
      const smallMask = await this.activePlugin.predict(resizedImg);
      profiler.end("Model Inference");

      profiler.start("Post Processing");
      if (this.activePlugin.postProcess) {
        this.activePlugin.postProcess(smallMask);
      }
      profiler.end("Post Processing");

      profiler.start("Upscale Mask");
      const mask = this.upscaleMask(smallMask, img.width, img.height);
      profiler.end("Upscale Mask");

      profiler.start("Alpha Composition");
      const transparentImg = img.putAlpha(mask);
      profiler.end("Alpha Composition");

      profiler.start("Canvas Rendering");
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
      profiler.end("Canvas Rendering");

      profiler.start("PNG Encoding");
      finalBlob = await finalCanvas.convertToBlob({ type: "image/png" });
      profiler.end("PNG Encoding");

      profiler.setMetadata("Output File Size", finalBlob.size);
    } finally {
      URL.revokeObjectURL(imageURL);
    }

    const reportStr = profiler.report();
    console.log(reportStr);
    return finalBlob;
  }
}

const aiProcessor = new RMBGProcessor();
export type AIProcessor = typeof aiProcessor;
Comlink.expose(aiProcessor);
