import * as Comlink from "comlink";

export type FilterType =
  "grayscale" | "invert" | "sepia" | "vintage" | "solarize";

/**
 * Image Processing Worker
 * This worker runs the heavy lifting for image processing.
 */
function getColorForFilter(
  r: number,
  g: number,
  b: number,
  filterType: FilterType,
  threshold: number,
) {
  if (filterType === "grayscale") {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return { r: lum, g: lum, b: lum };
  }
  if (filterType === "invert") {
    return { r: 255 - r, g: 255 - g, b: 255 - b };
  }
  if (filterType === "sepia") {
    return {
      r: Math.min(255, r * 0.393 + g * 0.769 + b * 0.189),
      g: Math.min(255, r * 0.349 + g * 0.686 + b * 0.168),
      b: Math.min(255, r * 0.272 + g * 0.534 + b * 0.131),
    };
  }
  if (filterType === "vintage") {
    return {
      r: Math.min(255, r * 0.9 + g * 0.5 + b * 0.1),
      g: Math.min(255, r * 0.3 + g * 0.8 + b * 0.1),
      b: Math.min(255, r * 0.2 + g * 0.3 + b * 0.5),
    };
  }
  if (filterType === "solarize") {
    return {
      r: r > threshold ? 255 - r : r,
      g: g > threshold ? 255 - g : g,
      b: b > threshold ? 255 - b : b,
    };
  }
  return { r, g, b };
}

function applyFilterToPixels(
  data: Uint8ClampedArray,
  filterType: FilterType,
  strength: number,
  params: Record<string, unknown>,
) {
  const threshold =
    typeof params.threshold === "number" ? params.threshold : 127;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const filtered = getColorForFilter(r, g, b, filterType, threshold);

    // Interpolate based on strength
    data[i] = r + (filtered.r - r) * strength;
    data[i + 1] = g + (filtered.g - g) * strength;
    data[i + 2] = b + (filtered.b - b) * strength;
  }
}

function updateBounds(
  x: number,
  y: number,
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
) {
  if (x < bounds.minX) bounds.minX = x;
  if (x > bounds.maxX) bounds.maxX = x;
  if (y < bounds.minY) bounds.minY = y;
  if (y > bounds.maxY) bounds.maxY = y;
}

function scanForContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const bounds = {
    minX: width,
    minY: height,
    maxX: 0,
    maxY: 0,
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        updateBounds(x, y, bounds);
      }
    }
  }

  return bounds;
}

const imageProcessor = {
  async ping() {
    return "pong from image worker";
  },

  async processImage(
    fileBlob: Blob,
    filterType: FilterType,
    params: Record<string, unknown> = {},
  ): Promise<Blob> {
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

    // Extract optional strength from params (default 100%)
    const strength =
      typeof params.intensity === "number" ? params.intensity / 100 : 1;

    applyFilterToPixels(imageData.data, filterType, strength, params);

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

  async smartCrop(fileBlob: Blob) {
    console.log("Worker: Applying Smart Crop (scanning for bounds)...");

    const bitmap = await createImageBitmap(fileBlob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const { minX, minY, maxX, maxY } = scanForContentBounds(
      imageData.data,
      canvas.width,
      canvas.height,
    );

    // If completely transparent, return null
    if (minX > maxX || minY > maxY) {
      return null;
    }

    return { minX, minY, maxX, maxY };
  },

  async applyCrop(
    fileBlob: Blob,
    cropRect: { x: number; y: number; width: number; height: number },
  ): Promise<Blob> {
    const bitmap = await createImageBitmap(fileBlob);
    const canvas = new OffscreenCanvas(cropRect.width, cropRect.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");

    ctx.drawImage(
      bitmap,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height,
    );

    return await canvas.convertToBlob({
      type: fileBlob.type || "image/png",
    });
  },
};

export type ImageProcessor = typeof imageProcessor;

Comlink.expose(imageProcessor);
