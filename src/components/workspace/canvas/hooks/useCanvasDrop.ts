import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useLayerStore } from "@/store/useLayerStore";
import { Layer } from "@/types/layer";

function getFileType(mimeType: string): "video" | "audio" | "image" | "pdf" {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image";
}

async function parsePdfDimensions(blob: Blob) {
  const { pdfjs } = await import("@/lib/pdfjs");
  const url = URL.createObjectURL(blob);
  const pdfDoc = await pdfjs.getDocument(url).promise;
  const pdfDimensions: { width: number; height: number }[] = [];

  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    pdfDimensions.push({
      width: viewport.width,
      height: viewport.height,
    });
  }
  URL.revokeObjectURL(url);
  return pdfDimensions;
}

async function processFile(file: File, addLayer: (layer: Layer) => void) {
  const fileId = uuidv4();
  const layerId = uuidv4();

  const buffer = await file.arrayBuffer();
  const normalizedBlob = new Blob([buffer], { type: file.type });

  await db.files.add({
    id: fileId,
    name: file.name,
    type: file.type,
    size: file.size,
    blob: normalizedBlob,
    createdAt: Date.now(),
  });

  const fileType = getFileType(file.type);

  if (fileType === "pdf") {
    const pdfDimensions = await parsePdfDimensions(normalizedBlob);
    const pdfLayerId = uuidv4();

    addLayer({
      id: pdfLayerId,
      fileId: fileId,
      originalFileId: fileId,
      name: file.name,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      originalWidth: 0,
      originalHeight: 0,
      type: "pdf",
    });

    // Add child page layers
    pdfDimensions.forEach((dim, index) => {
      addLayer({
        id: uuidv4(),
        fileId: fileId,
        originalFileId: fileId,
        name: `Page ${index + 1}`,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        originalWidth: dim.width,
        originalHeight: dim.height,
        type: "page",
        parentId: pdfLayerId,
        pageIndex: index,
      });
    });
  } else {
    addLayer({
      id: layerId,
      fileId: fileId,
      originalFileId: fileId,
      name: file.name,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      originalWidth: 0, // This is updated by the CanvasArea when the texture loads
      originalHeight: 0,
      type: fileType,
    });
  }
}

export function useCanvasDrop() {
  const addLayer = useLayerStore((s) => s.addLayer);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        await processFile(file, addLayer);
      }
    },
    [addLayer],
  );

  const dropzone = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "image/*": [],
      "application/pdf": [],
      "video/*": [],
      "audio/*": [],
      "application/zip": [".zip"],
      "application/x-zip-compressed": [".zip"],
    },
  });

  return dropzone;
}
