"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const addLayer = useWorkspaceStore((state) => state.addLayer);
  const layers = useWorkspaceStore((state) => state.layers);

  // PIXI Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundColor: 0x18181b, // zinc-900
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }
    };

    initPixi();

    return () => {
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  // Handle File Drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = uuidv4();
        const layerId = uuidv4();

        // 1. Save file Blob to Dexie IndexedDB
        await db.files.add({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
          createdAt: Date.now(),
        });

        // 2. Add as a layer in the Workspace Store
        addLayer({
          id: layerId,
          fileId: fileId,
          name: file.name,
          visible: true,
          locked: false,
        });

        console.log(`Saved ${file.name} to local DB and added as layer!`);
      }
    },
    [addLayer],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // Let them click layers/canvas, not upload dialog anywhere
    accept: {
      "image/*": [],
      "application/pdf": [],
      "video/*": [],
      "audio/*": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <input {...getInputProps()} />

      <div ref={containerRef} className="absolute inset-0" />

      {/* Overlay for drag state */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm border-2 border-blue-500 border-dashed m-4 rounded-xl">
          <p className="text-xl font-semibold text-blue-100 shadow-sm">
            Drop files to add as layers
          </p>
        </div>
      )}

      {/* Empty State Overlay */}
      {layers.length === 0 && !isDragActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <p className="text-zinc-400 bg-zinc-950/80 px-6 py-3 rounded-full font-medium pointer-events-auto shadow-lg backdrop-blur-md border border-zinc-800">
            Drag & Drop files here to start editing
          </p>
        </div>
      )}
    </div>
  );
}
