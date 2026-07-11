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
};

export type ImageProcessor = typeof imageProcessor;

Comlink.expose(imageProcessor);
