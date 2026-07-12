# File Forge Architecture

This document provides a high-level overview of the systems and architecture driving File Forge. For a high-level overview of the project, see [README.md](./README.md).

## 1. UI & Theming System

- **Semantic CSS Framework**: Built on a robust, Apple/Linear-style OKLCH semantic token system defined in `src/app/globals.css`.
- **Themes**: Full support for Light and Dark modes via `--background`, `--panel`, `--foreground`, etc., synchronized to `document.documentElement.classList`.
- **Layout Structure**: A premium, edge-to-edge responsive workspace designed for individual tools (`ToolPageLayout.tsx` and `WorkspaceLayout.tsx`):
  - **Tool-Specific Pages**: Instead of a global toolbar, each tool has its own dedicated dynamic route (e.g., `/image/[tool]/page.tsx`).
  - **Center Canvas (`CanvasArea.tsx`)**: Edge-to-edge 55vh on mobile, perfectly scaled flex-1 on desktop.
  - **Right Properties Panel (`PropertiesPanel.tsx`)**: Responsive natural document flow on mobile (scrolls natively below canvas without UI hacks) and a sticky sidebar on desktop.

## 2. Canvas Engine (PixiJS)

- **WebGL Rendering**: Employs PixiJS v8 for high-performance, 60fps hardware-accelerated rendering of image layers.
- **Transparent Canvas**: The PixiJS background is fully transparent (`backgroundAlpha: 0`), allowing CSS-based Light/Dark themes to organically flow through the workspace.
- **Interactivity & UX**:
  - Drag-and-drop layer movement using WebGL pointer events.
  - Implements a custom `TransformOverlay` that renders an interactive bounding box and scale handles on the active layer.
  - Uses `globalpointermove` and `app.stage.toLocal()` to prevent mouse-tracking glitches during rapid scaling or dragging outside the bounding box.
- **Resource Management**: Automatically hooks into Zustand layer updates. When a layer is deleted, the engine sweeps the canvas, instantly removing the sprite and destroying its WebGL GPU textures to prevent memory leaks.

## 2.5 Keyboard & Shortcuts

- Global keybinds attached to the workspace allow for immediate layer deletion (`Delete` or `Backspace`). These events safely ignore inputs while typing in forms.

## 3. State Management (Zustand)

- **Central Store (`useWorkspaceStore.ts`)**: Acts as the single source of truth, managing:
  - The list of active layers
  - The currently active tool
  - The active layer ID
  - The active workspace theme
- **Real-time Sync**: The React UI (e.g., Properties Panel) and the PixiJS canvas both subscribe to this central store. Dragging a layer in the canvas updates the Zustand state instantly, which then instantly updates the DOM inputs in the Properties Panel.

## 4. File Management & Persistence (IndexedDB)

- **Dexie.js Engine**: Used for persistent, local browser storage to keep the app 100% private.
- **Data Normalization**: Dropped `File` objects are explicitly processed into an `ArrayBuffer` and stored as a `Blob`. This guarantees safe storage across all browser implementations of IndexedDB, preventing memory pointer corruption often seen with raw `File` instances.
- **Graceful Error Recovery**: If an image fails to decode (e.g., an unsupported or corrupted file format), the system catches the `InvalidStateError`, safely deletes the corrupted layer from state, and gracefully continues without crashing the WebGL pipeline.

## 5. Crop Engine (Non-Destructive)

- **Texture Frames**: The cropping system is entirely non-destructive. It leverages PixiJS `PIXI.Texture.frame` to crop the image on the GPU without altering the original underlying WebGL texture.
- **Ghost Preview**: During crop operations, a low-opacity "ghost" sprite of the full original image is rendered behind the crop bounding box, providing contextual awareness.
- **Aspect Ratio Locking**: Crop boundaries dynamically calculate safe maximum extents to prevent out-of-bounds dragging, and can rigidly enforce standard aspect ratios (e.g. 1:1, 16:9).
- **Image Panning**: By calculating relative mouse offsets and updating `sprite.texture.frame` instead of `sprite.x/y`, users can seamlessly drag the image _behind_ the stationary crop mask.

## 6. Image Processing (Web Workers)

- **Destructive Workflows**: Complex pixel-level filters (Grayscale, Sepia, Invert, Vintage, Solarize) are completely offloaded to Web Workers via `image.worker.ts`.
- **OffscreenCanvas**: The worker natively decodes image blobs using `createImageBitmap` and processes the raw `ImageData` via an `OffscreenCanvas`. This prevents heavy JavaScript loops from blocking the main UI thread.
- **RPC & Storage**: Uses `Comlink` for type-safe RPC. When a worker completes a filter, the new resulting blob is automatically saved to IndexedDB as a new file, and the Canvas layer seamlessly hot-swaps to the new texture.

## 7. History & Time Travel (Undo/Redo)

- **Zustand State Wrapping**: The `useWorkspaceStore` implements a fully functional `past` and `future` array stack for layer states.
- **Layer Snapshots**: Before any layer transformation, addition, or removal, the current layer tree is snapshotted into the `past` array.
- **Original File Restoration**: Every layer explicitly tracks its `originalFileId`, allowing the "Restore Original" feature to revert a file back to its pre-filtered native form without corrupting the broader undo/redo history timeline.
