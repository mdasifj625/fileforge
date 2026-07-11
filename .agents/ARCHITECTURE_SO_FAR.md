# Architecture & Progress So Far

## 1. UI & Theming System

- **Semantic CSS Framework**: Replaced hardcoded Tailwind gray colors with a robust, Apple/Linear-style OKLCH semantic token system in `globals.css`.
- **Themes**: Full support for Light and Dark modes via `--background`, `--panel`, `--foreground`, etc., tied to `document.documentElement.classList`.
- **Layout**: A responsive workspace with a left Toolbar, center Canvas, right Properties panel, and a bottom Layer List.

## 2. Canvas Engine (PixiJS)

- **WebGL Rendering**: Uses PixiJS v8 for high-performance, 60fps rendering of image layers.
- **Transparent Canvas**: PixiJS background is fully transparent so the CSS-based Light/Dark themes organically flow through the workspace.
- **Interactivity**:
  - Supports pointer events for drag-and-drop layer movement.
  - Implements a custom `TransformOverlay` that renders a bounding box and scale handles on the active layer.
  - Uses `globalpointermove` and `app.stage.toLocal()` to prevent mouse-tracking glitches during rapid scaling or dragging.

## 3. State Management (Zustand)

- **Central Store (`useWorkspaceStore`)**: Manages the list of active layers, the currently active tool, the active layer ID, and the active theme.
- **Real-time Sync**: The React UI (e.g., Properties Panel) and the PixiJS canvas both subscribe to this single source of truth. Dragging a layer in the canvas instantly updates the Zustand state, which instantly updates the numbers in the Properties Panel.

## 4. File Management & Persistence (IndexedDB)

- **Dexie.js**: Used for local browser storage.
- **Data Normalization**: Any dropped `File` object is explicitly pulled into an `ArrayBuffer` and stored as a `Blob`. This guarantees safe storage in IndexedDB across all browsers, preventing memory pointer corruption.
- **Graceful Error Handling**: If an image fails to decode (e.g., corrupted file), the system intercepts the `InvalidStateError`, deletes the corrupted state, and gracefully continues without crashing the WebGL pipeline.

## 5. Next Steps

- **Cropping Tool**: Implement non-destructive WebGL masking or destructive WebWorker pixel cropping.
- **Web Workers**: Connect the `image.worker.ts` to process filters and extensive manipulations off the main thread.
