"use client";

import React, { useEffect, useRef, useCallback, useState } from "react";
import * as PIXI from "pixi.js";
import { useDropzone } from "react-dropzone";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application>(null);
  const spritesRef = useRef<
    Record<string, PIXI.Sprite & { isBeingManipulated?: boolean }>
  >({});
  const transformOverlayRef = useRef<PIXI.Container>(null);
  const [spriteUpdateTick, setSpriteUpdateTick] = useState(0);

  const addLayer = useWorkspaceStore((state) => state.addLayer);
  const layers = useWorkspaceStore((state) => state.layers);
  const activeLayerId = useWorkspaceStore((state) => state.activeLayerId);
  const activeTool = useWorkspaceStore((state) => state.activeTool);

  // PIXI Initialization
  useEffect(() => {
    if (!containerRef.current) return;

    const app = new PIXI.Application();

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // Add a simple grid background
      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0x888888, 0.15); // Neutral transparent grid works on light/dark
      const gridSize = 50;
      for (let x = 0; x < app.screen.width; x += gridSize) {
        grid.moveTo(x, 0).lineTo(x, app.screen.height);
      }
      for (let y = 0; y < app.screen.height; y += gridSize) {
        grid.moveTo(0, y).lineTo(app.screen.width, y);
      }
      app.stage.addChild(grid);

      // Initialize Transform Overlay Container (Always on top)
      const transformOverlay = new PIXI.Container();
      transformOverlay.zIndex = 9999;
      app.stage.addChild(transformOverlay);
      transformOverlayRef.current = transformOverlay;

      app.stage.sortableChildren = true;
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

      // Clean up deleted layers
      const currentLayerIds = new Set(layers.map((l) => l.id));
      for (const id in spritesRef.current) {
        if (!currentLayerIds.has(id)) {
          const sprite = spritesRef.current[id];
          app.stage.removeChild(sprite);
          sprite.destroy({ texture: true });
          delete spritesRef.current[id];
        }
      }

      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];

        if (spritesRef.current[layer.id]) {
          const sprite = spritesRef.current[layer.id];
          sprite.visible = layer.visible;
          sprite.zIndex = layers.length - i;

          // Apply transforms from store if not currently being actively dragged/scaled
          // (To prevent jitter, we only force sync if we aren't the ones changing it)
          if (!sprite.isBeingManipulated) {
            if (layer.x !== 0 || layer.y !== 0) {
              sprite.x = layer.x;
              sprite.y = layer.y;
            }
            if (layer.scaleX !== 1) sprite.scale.x = layer.scaleX;
            if (layer.scaleY !== 1) sprite.scale.y = layer.scaleY;
            sprite.rotation = layer.rotation || 0;
          }

          continue;
        }

        const fileData = await db.files.get(layer.fileId);
        if (!fileData) continue;

        try {
          // Use natively hardware-accelerated createImageBitmap which handles Blobs perfectly
          const imageBitmap = await window.createImageBitmap(fileData.blob);
          const texture = PIXI.Texture.from(imageBitmap);
          const sprite = new PIXI.Sprite(texture) as PIXI.Sprite & {
            isBeingManipulated?: boolean;
          };

          sprite.anchor.set(0.5);

          const initialX = layer.x !== 0 ? layer.x : app.screen.width / 2;
          const initialY = layer.y !== 0 ? layer.y : app.screen.height / 2;

          sprite.x = initialX;
          sprite.y = initialY;

          const scaleX = (app.screen.width * 0.8) / sprite.width;
          const scaleY = (app.screen.height * 0.8) / sprite.height;
          const defaultScale = Math.min(scaleX, scaleY, 1);

          sprite.scale.set(layer.scaleX !== 1 ? layer.scaleX : defaultScale);

          sprite.zIndex = layers.length - i;
          sprite.eventMode = "static";
          sprite.cursor = "pointer";

          let dragging = false;
          let dragData: PIXI.FederatedPointerEvent | null = null;
          const offset = { x: 0, y: 0 };

          sprite.on("pointerdown", (e) => {
            const store = useWorkspaceStore.getState();
            store.setActiveLayerId(layer.id);

            if (store.activeTool !== "select") return;

            dragging = true;
            sprite.isBeingManipulated = true;
            dragData = e;
            const localPos = dragData.getLocalPosition(app.stage);
            offset.x = sprite.x - localPos.x;
            offset.y = sprite.y - localPos.y;
          });

          const onDragEnd = () => {
            if (dragging) {
              dragging = false;
              dragData = null;
              sprite.isBeingManipulated = false;

              useWorkspaceStore.getState().updateLayerTransform(layer.id, {
                x: sprite.x,
                y: sprite.y,
              });
            }
          };

          sprite.on("pointerup", onDragEnd);
          sprite.on("pointerupoutside", onDragEnd);

          sprite.on("globalpointermove", (e) => {
            if (dragging && dragData) {
              const globalPos = e.global;
              const localPos = app.stage.toLocal(globalPos);
              sprite.x = localPos.x + offset.x;
              sprite.y = localPos.y + offset.y;
            }
          });

          app.stage.addChild(sprite);
          spritesRef.current[layer.id] = sprite;
          setSpriteUpdateTick((t) => t + 1); // Trigger overlay update

          if (layer.x === 0 && layer.y === 0) {
            useWorkspaceStore.getState().updateLayerTransform(layer.id, {
              x: sprite.x,
              y: sprite.y,
              scaleX: sprite.scale.x,
              scaleY: sprite.scale.y,
            });
          }
        } catch (error) {
          console.error("Failed to load texture for layer", layer.name, error);

          // Gracefully handle decode errors
          useWorkspaceStore.getState().removeLayer(layer.id);
          db.files.delete(layer.fileId).catch(console.error);

          // Use a microtask to alert so it doesn't block rendering
          queueMicrotask(() => {
            alert(
              `Failed to decode image "${layer.name}". The file might be corrupted, unsupported, or a glitch occurred in storage.`,
            );
          });
        }
      }
    };

    renderLayers();
  }, [layers]); // Deliberately removed activeLayerId so it doesn't re-render sprites just on selection change

  // Draw and Manage the Transform Overlay for the Active Layer
  useEffect(() => {
    const app = appRef.current;
    const overlay = transformOverlayRef.current;
    if (!app || !overlay) return;

    overlay.removeChildren();

    if (
      activeTool !== "select" ||
      !activeLayerId ||
      !spritesRef.current[activeLayerId]
    )
      return;

    const activeSprite = spritesRef.current[activeLayerId] as PIXI.Sprite & {
      isBeingManipulated?: boolean;
    };

    // Draw bounding box
    const boundsBox = new PIXI.Graphics();
    overlay.addChild(boundsBox);

    // Handle positions
    const handles = [
      { id: "tl", x: -1, y: -1 },
      { id: "tr", x: 1, y: -1 },
      { id: "bl", x: -1, y: 1 },
      { id: "br", x: 1, y: 1 },
    ];

    const handleGraphics: PIXI.Graphics[] = [];

    handles.forEach((pos) => {
      const handle = new PIXI.Graphics();
      handle.beginFill(0xffffff); // White interior
      handle.lineStyle(1.5, 0x3b82f6, 1); // Blue border
      // Draw a crisp square like Figma
      handle.drawRect(-4.5, -4.5, 9, 9);
      handle.endFill();
      handle.eventMode = "static";
      handle.cursor =
        pos.id === "tl" || pos.id === "br" ? "nwse-resize" : "nesw-resize";

      let isScaling = false;
      let startScaleX = 1;
      let startScaleY = 1;
      let startPointerPos: PIXI.Point | null = null;
      let startSpriteWidth = 0;

      handle.on("pointerdown", (e) => {
        isScaling = true;
        activeSprite.isBeingManipulated = true;
        startPointerPos = e.getLocalPosition(app.stage).clone();
        startScaleX = activeSprite.scale.x;
        startScaleY = activeSprite.scale.y;
        startSpriteWidth = activeSprite.texture.width * startScaleX;
        e.stopPropagation(); // Prevent dragging the sprite itself
      });

      const onScaleEnd = () => {
        if (isScaling) {
          isScaling = false;
          activeSprite.isBeingManipulated = false;
          useWorkspaceStore.getState().updateLayerTransform(activeLayerId, {
            scaleX: activeSprite.scale.x,
            scaleY: activeSprite.scale.y,
            x: activeSprite.x,
            y: activeSprite.y,
          });
        }
      };

      handle.on("pointerup", onScaleEnd);
      handle.on("pointerupoutside", onScaleEnd);

      handle.on("globalpointermove", (e) => {
        if (isScaling && startPointerPos) {
          const currentPos = e.global; // use e.global for global pointer move
          const localPos = app.stage.toLocal(currentPos);

          const dx = localPos.x - startPointerPos.x;

          const signX = pos.x;

          const scaleDelta = (dx * signX * 2) / activeSprite.texture.width;

          let newScaleX = startScaleX + scaleDelta;
          let newScaleY =
            startScaleY + scaleDelta * (startScaleY / startScaleX);

          if (newScaleX < 0.05) newScaleX = 0.05;
          if (newScaleY < 0.05) newScaleY = 0.05;

          activeSprite.scale.set(newScaleX, newScaleY);
        }
      });

      handleGraphics.push(handle);
      overlay.addChild(handle);
    });

    // Ticker to continuously update the overlay position to perfectly track the sprite
    const updateOverlay = () => {
      if (!activeSprite.visible || activeSprite.destroyed) {
        overlay.visible = false;
        return;
      }
      overlay.visible = true;

      const width = activeSprite.texture.width * Math.abs(activeSprite.scale.x);
      const height =
        activeSprite.texture.height * Math.abs(activeSprite.scale.y);

      boundsBox.clear();
      boundsBox.lineStyle(2, 0x3b82f6, 1); // blue-500
      // Draw relative to the sprite's center
      boundsBox.drawRect(-width / 2, -height / 2, width, height);

      boundsBox.position.set(activeSprite.x, activeSprite.y);
      boundsBox.rotation = activeSprite.rotation;

      // Position handles
      handleGraphics.forEach((handle, i) => {
        const pos = handles[i];
        // Calculate local corner
        const lx = (width / 2) * pos.x;
        const ly = (height / 2) * pos.y;

        // Apply sprite rotation
        const cos = Math.cos(activeSprite.rotation);
        const sin = Math.sin(activeSprite.rotation);

        handle.x = activeSprite.x + (lx * cos - ly * sin);
        handle.y = activeSprite.y + (lx * sin + ly * cos);
      });
    };

    app.ticker.add(updateOverlay);

    return () => {
      app.ticker.remove(updateOverlay);
      overlay.removeChildren();
    };
  }, [activeLayerId, activeTool, spriteUpdateTick]);

  // Handle File Drops
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const fileId = uuidv4();
        const layerId = uuidv4();

        // Normalize the File to a pure Blob backed by an ArrayBuffer.
        // This prevents obscure IndexedDB serialization bugs on some browsers
        // where File objects lose their backing data.
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
          name: file.name,
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        });
      }

      useWorkspaceStore.getState().setActiveTool("select");
    },
    [addLayer],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
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

      {/* Floating Add Button when layers exist */}
      {layers.length > 0 && (
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <button
            onClick={open}
            className="bg-panel/80 hover:bg-muted text-foreground text-xs px-3 py-1.5 rounded-md border border-panel-border shadow-sm backdrop-blur-md transition-colors flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Layer
          </button>
        </div>
      )}

      {isDragActive && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm border-2 border-primary border-dashed m-4 rounded-xl pointer-events-none">
          <p className="text-xl font-semibold text-primary shadow-sm">
            Drop files to add as layers
          </p>
        </div>
      )}

      {layers.length === 0 && !isDragActive && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <button
            onClick={open}
            className="group flex flex-col items-center gap-3 bg-panel/80 hover:bg-muted px-8 py-6 rounded-2xl pointer-events-auto shadow-2xl backdrop-blur-md border border-panel-border transition-all hover:border-muted-foreground/30"
          >
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shadow-sm">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium mb-1 tracking-wide">
                Drag & drop files here
              </p>
              <p className="text-muted-foreground text-sm">
                or click to browse your computer
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
