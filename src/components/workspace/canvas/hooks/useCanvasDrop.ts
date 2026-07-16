import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function useCanvasDrop() {
  const addLayer = useWorkspaceStore((state) => state.addLayer);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
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
          originalWidth: 0,
          originalHeight: 0,
          type: "image",
        });
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
