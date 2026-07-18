import * as Comlink from "comlink";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface VideoProcessor {
  compressVideo: (
    videoBlob: Blob,
    quality: string, // e.g., "high", "medium", "low"
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
  trimVideo: (
    videoBlob: Blob,
    startTime: number,
    endTime: number,
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
  convertVideo: (
    videoBlob: Blob,
    targetFormat: string, // e.g., "mp4", "webm", "gif"
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
}

let ffmpeg: FFmpeg | null = null;

async function initFFmpeg(onProgress?: (progress: number) => void) {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  if (onProgress) {
    ffmpeg.on("progress", ({ progress }) => {
      onProgress(progress * 100);
    });
  }

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

const api: VideoProcessor = {
  async compressVideo(videoBlob, quality, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.mp4";
    const outputName = "output.mp4";

    await ff.writeFile(inputName, await fetchFile(videoBlob));

    let crf = "23";
    if (quality === "low") crf = "32";
    if (quality === "medium") crf = "28";
    if (quality === "high") crf = "23";

    await ff.exec([
      "-i",
      inputName,
      "-vcodec",
      "libx264",
      "-crf",
      crf,
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: "video/mp4",
    });
  },

  async trimVideo(videoBlob, startTime, endTime, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.mp4";
    const outputName = "output.mp4";

    await ff.writeFile(inputName, await fetchFile(videoBlob));

    await ff.exec([
      "-ss",
      startTime.toString(),
      "-i",
      inputName,
      "-to",
      (endTime - startTime).toString(),
      "-c",
      "copy",
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: "video/mp4",
    });
  },

  async convertVideo(videoBlob, targetFormat, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.tmp";
    const outputName = `output.${targetFormat}`;

    await ff.writeFile(inputName, await fetchFile(videoBlob));

    await ff.exec(["-i", inputName, outputName]);

    const data = await ff.readFile(outputName);
    const mimeType =
      targetFormat === "gif" ? "image/gif" : `video/${targetFormat}`;
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: mimeType,
    });
  },
};

Comlink.expose(api);
