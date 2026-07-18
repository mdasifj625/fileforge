import * as Comlink from "comlink";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface AudioProcessor {
  trimAudio: (
    audioBlob: Blob,
    startTime: number,
    endTime: number,
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
  mergeAudio: (
    audioBlobs: Blob[],
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
  convertAudio: (
    audioBlob: Blob,
    targetFormat: string, // e.g., "mp3", "wav", "aac"
    onProgress?: (progress: number) => void,
  ) => Promise<Blob>;
  normalizeAudio: (
    audioBlob: Blob,
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

const api: AudioProcessor = {
  async trimAudio(audioBlob, startTime, endTime, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.mp3";
    const outputName = "output.mp3";

    await ff.writeFile(inputName, await fetchFile(audioBlob));

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
      type: "audio/mp3",
    });
  },

  async mergeAudio(audioBlobs, onProgress) {
    const ff = await initFFmpeg(onProgress);

    let concatStr = "";
    for (let i = 0; i < audioBlobs.length; i++) {
      const name = `input${i}.mp3`;
      await ff.writeFile(name, await fetchFile(audioBlobs[i]));
      concatStr += `file '${name}'\n`;
    }

    await ff.writeFile("inputs.txt", concatStr);
    const outputName = "output_merged.mp3";

    await ff.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "inputs.txt",
      "-c",
      "copy",
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: "audio/mp3",
    });
  },

  async convertAudio(audioBlob, targetFormat, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.tmp";
    const outputName = `output.${targetFormat}`;

    await ff.writeFile(inputName, await fetchFile(audioBlob));
    await ff.exec(["-i", inputName, outputName]);

    const data = await ff.readFile(outputName);
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: `audio/${targetFormat}`,
    });
  },

  async normalizeAudio(audioBlob, onProgress) {
    const ff = await initFFmpeg(onProgress);
    const inputName = "input.mp3";
    const outputName = "output.mp3";

    await ff.writeFile(inputName, await fetchFile(audioBlob));

    // Using simple volume normalization or loudnorm filter
    await ff.exec([
      "-i",
      inputName,
      "-af",
      "loudnorm=I=-16:TP=-1.5:LRA=11",
      outputName,
    ]);

    const data = await ff.readFile(outputName);
    return new Blob([data as unknown as Uint8Array<ArrayBuffer>], {
      type: "audio/mp3",
    });
  },
};

Comlink.expose(api);
