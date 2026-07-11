"use client";

import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

export function CanvasArea() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Basic PixiJS Setup for the non-destructive preview pipeline
  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the WebGL Application
    const app = new PIXI.Application();

    const initPixi = async () => {
      await app.init({
        resizeTo: containerRef.current!,
        backgroundColor: 0x18181b, // zinc-900 to match Tailwind
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (containerRef.current) {
        containerRef.current.appendChild(app.canvas);
      }

      // Add a placeholder checkerboard or grid background
      // This is where we will render the layers and apply fragment shaders (tools)
    };

    initPixi();

    return () => {
      app.destroy(true, { children: true, texture: true });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none" }} // Prevent browser pan/zoom
    >
      {/* The canvas is injected here by PixiJS */}

      {/* Overlay UI (like crop handles) can go here absolutely positioned over the canvas */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <p className="text-zinc-600 bg-zinc-950/80 px-4 py-2 rounded-full font-medium pointer-events-auto shadow-lg backdrop-blur-md">
          Drag & Drop files here
        </p>
      </div>
    </div>
  );
}
