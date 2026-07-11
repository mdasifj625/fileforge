"use client";

import React, { useEffect, useRef, useCallback } from "react";
import * as PIXI from "pixi.js";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>(null);
  const spritesRef = useRef<Record<string, PIXI.Sprite>>({});

  const addLayer = useWorkspaceStore((state) => state.addLayer);
  const layers = useWorkspaceStore((state) => state.layers);

  // PIXI Initialization
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

      // Store app ref for later
      appRef.current = app;
    };

    initPixi();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, []);

  // Render Pipeline: Listen to layers and render them
  useEffect(() => {
    const renderLayers = async () => {
      const app = appRef.current;
      if (!app) return;

      // For each layer, ensure it exists in PixiJS
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];

        // If we already have this sprite, skip creation
        if (spritesRef.current[layer.id]) {
          const sprite = spritesRef.current[layer.id];
          sprite.visible = layer.visible;
          // Set zIndex based on array order (bottom of array = top of screen)
          sprite.zIndex = layers.length - i;
          continue;
        }

        // Otherwise, load it from Dexie
        const fileData = await db.files.get(layer.fileId);
        if (!fileData) continue;

        try {
          const url = URL.createObjectURL(fileData.blob);

          // Manually create an Image element to bypass PIXI.Assets.load extension guessing on blob URLs
          const image = new window.Image();
          image.src = url;
          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
          });

          const texture = PIXI.Texture.from(image);
          const sprite = new PIXI.Sprite(texture);

          // Center the sprite
          sprite.anchor.set(0.5);
          sprite.x = app.screen.width / 2;
          sprite.y = app.screen.height / 2;

          // Basic scale to fit if it's too large
          const scaleX = (app.screen.width * 0.8) / sprite.width;
          const scaleY = (app.screen.height * 0.8) / sprite.height;
          const scale = Math.min(scaleX, scaleY, 1);
          sprite.scale.set(scale);

          sprite.zIndex = layers.length - i;

          // Enable interaction so we can drag it later
          sprite.eventMode = "static";
          sprite.cursor = "pointer";

          app.stage.addChild(sprite);
          spritesRef.current[layer.id] = sprite;

          // Enable z-index sorting on the stage
          app.stage.sortableChildren = true;
        } catch (error) {
          console.error("Failed to load texture for layer", layer.name, error);
        }
      }
    };

    renderLayers();
  }, [layers]);

  // Handle File Drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = uuidv4();
        const layerId = uuidv4();

        await db.files.add({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
          createdAt: Date.now(),
        });

        addLayer({
          id: layerId,
          fileId: fileId,
          name: file.name,
          visible: true,
          locked: false,
        });
      }
    },
    [addLayer],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
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

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm border-2 border-blue-500 border-dashed m-4 rounded-xl pointer-events-none">
          <p className="text-xl font-semibold text-blue-100 shadow-sm">
            Drop files to add as layers
          </p>
        </div>
      )}

      {layers.length === 0 && !isDragActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <p className="text-zinc-400 bg-zinc-950/80 px-6 py-3 rounded-full font-medium pointer-events-auto shadow-lg backdrop-blur-md border border-zinc-800">
            Drag & Drop images here to start editing
          </p>
        </div>
      )}
    </div>
  );
}
