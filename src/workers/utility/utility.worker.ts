import * as Comlink from "comlink";
import JSZip from "jszip";

export interface UtilityProcessor {
  zipFiles: (files: { name: string; blob: Blob }[]) => Promise<Blob>;
  unzipFile: (zipBlob: Blob) => Promise<{ name: string; blob: Blob }[]>;
  encodeBase64: (blob: Blob) => Promise<string>;
  decodeBase64: (base64: string, mimeType: string) => Promise<Blob>;
  generateUUID: () => string;
}

const utilityProcessor: UtilityProcessor = {
  async zipFiles(files: { name: string; blob: Blob }[]): Promise<Blob> {
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.name, f.blob));
    return await zip.generateAsync({ type: "blob" });
  },

  async unzipFile(zipBlob: Blob): Promise<{ name: string; blob: Blob }[]> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(zipBlob);
    const extracted: { name: string; blob: Blob }[] = [];

    const promises: Promise<void>[] = [];
    loadedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async("blob").then((blob) => {
            extracted.push({ name: relativePath, blob });
          }),
        );
      }
    });
    await Promise.all(promises);
    return extracted;
  },

  async encodeBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    let binary = "";
    // Process in chunks to avoid max call stack size exceeded
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize)),
      );
    }
    return btoa(binary);
  },

  async decodeBase64(base64: string, mimeType: string): Promise<Blob> {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  },

  generateUUID(): string {
    return crypto.randomUUID();
  },
};

Comlink.expose(utilityProcessor);
