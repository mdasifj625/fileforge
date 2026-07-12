import * as Comlink from "comlink";

export type FilterType =
  "grayscale" | "invert" | "sepia" | "vintage" | "solarize";

/**
 * Image Processing Worker
 * This worker runs the heavy lifting for image processing.
 */
const imageProcessor = {
  async ping() {
    return "pong from image worker";
  },

  async processImage(fileBlob: Blob, filterType: FilterType): Promise<Blob> {
    console.log(`Worker: Applying ${filterType} filter...`);

    // Decode the blob into an ImageBitmap
    const bitmap = await createImageBitmap(fileBlob);

    // Create an OffscreenCanvas matching the image dimensions
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context in worker");

    // Draw the image
    ctx.drawImage(bitmap, 0, 0);

    // Extract pixel data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply pixel-level math
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (filterType === "grayscale") {
        // Luminance math
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = lum;
      } else if (filterType === "invert") {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
      } else if (filterType === "sepia") {
        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
      } else if (filterType === "vintage") {
        data[i] = Math.min(255, r * 0.9 + g * 0.5 + b * 0.1);
        data[i + 1] = Math.min(255, r * 0.3 + g * 0.8 + b * 0.1);
        data[i + 2] = Math.min(255, r * 0.2 + g * 0.3 + b * 0.5);
      } else if (filterType === "solarize") {
        data[i] = r > 127 ? 255 - r : r;
        data[i + 1] = g > 127 ? 255 - g : g;
        data[i + 2] = b > 127 ? 255 - b : b;
      }
    }

    // Put data back
    ctx.putImageData(imageData, 0, 0);

    // Return as new Blob preserving original type (or default to png)
    const type = fileBlob.type || "image/png";
    return await canvas.convertToBlob({ type });
  },

  async exportHighResImage(
    fileBlob: Blob,
    options: {
      cropRect?: { x: number; y: number; width: number; height: number };
      scaleX: number;
      scaleY: number;
      rotation: number;
      format: "image/png" | "image/jpeg" | "image/webp";
      quality: number;
    },
  ): Promise<Blob> {
    console.log("Worker: Exporting high-res image...", options);

    const bitmap = await createImageBitmap(fileBlob);

    // 1. Determine source crop coordinates
    const sx = options.cropRect ? options.cropRect.x : 0;
    const sy = options.cropRect ? options.cropRect.y : 0;
    const sw = options.cropRect ? options.cropRect.width : bitmap.width;
    const sh = options.cropRect ? options.cropRect.height : bitmap.height;

    // 2. Determine final output dimensions
    const outW = Math.max(1, Math.round(sw * Math.abs(options.scaleX)));
    const outH = Math.max(1, Math.round(sh * Math.abs(options.scaleY)));

    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context for export");

    // Fill white background for JPEG
    if (options.format === "image/jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
    }

    // 3. Apply transformations
    ctx.save();

    // Translate to center to apply rotation and flip
    ctx.translate(outW / 2, outH / 2);

    if (options.rotation) {
      ctx.rotate(options.rotation);
    }

    // Flip if scale is negative
    const signX = options.scaleX < 0 ? -1 : 1;
    const signY = options.scaleY < 0 ? -1 : 1;
    ctx.scale(signX, signY);

    // Draw the specific crop region to the canvas
    ctx.drawImage(bitmap, sx, sy, sw, sh, -outW / 2, -outH / 2, outW, outH);

    ctx.restore();

    return await canvas.convertToBlob({
      type: options.format,
      quality: options.quality,
    });
  },

  async smartCrop(fileBlob: Blob): Promise<Blob> {
    console.log(
      "Worker: Applying Smart Crop (trimming transparent borders)...",
    );

    const bitmap = await createImageBitmap(fileBlob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Scan for non-transparent pixels
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 10) {
          // arbitrary threshold for transparency
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If completely transparent, return original
    if (minX > maxX || minY > maxY) {
      return fileBlob;
    }

    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;

    // Create cropped canvas
    const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
    const croppedCtx = croppedCanvas.getContext("2d");
    if (!croppedCtx) throw new Error("Failed to get 2D context");

    croppedCtx.drawImage(
      canvas,
      minX,
      minY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return await croppedCanvas.convertToBlob({
      type: fileBlob.type || "image/png",
    });
  },
};

export type ImageProcessor = typeof imageProcessor;

Comlink.expose(imageProcessor);
