# File Forge Architecture

This document provides a high-level overview of the systems and architecture driving File Forge. For a high-level overview of the project, see [README.md](./README.md).

## 1. UI & Theming System

- **Semantic CSS Framework**: Built on a robust, Apple/Linear-style OKLCH semantic token system defined in `src/app/globals.css`.
- **Themes**: Full support for Light and Dark modes via `--background`, `--panel`, `--foreground`, etc., synchronized to `document.documentElement.classList`.
- **Layout Structure**: A responsive workspace with:
  - Left Toolbar (`Toolbar.tsx`)
  - Center Canvas (`CanvasArea.tsx`)
  - Right Properties panel (`PropertiesPanel.tsx`)
  - Bottom Layer List integrated directly into the workspace layout.

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

## 5. Upcoming Implementation: Image Processing

- **Destructive/Non-Destructive Workflows**: Future features like the Cropping Tool and complex filters will be offloaded to Web Workers.
- **Web Workers**: Connecting `image.worker.ts` to process intense mathematical manipulations off the main UI thread.
