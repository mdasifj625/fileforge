# File Forge Architecture

This document provides a high-level overview of the systems and architecture driving File Forge. For a high-level overview of the project, see [README.md](./README.md).

## 1. UI & Theming System

- **Semantic CSS Framework**: Built on a robust, Apple/Linear-style OKLCH semantic token system defined in `src/app/globals.css`.
- **Themes**: Full support for Light and Dark modes via `--background`, `--panel`, `--foreground`, etc., synchronized to `document.documentElement.classList`.
- **Layout Structure**: A premium, edge-to-edge responsive workspace designed for individual tools (`ToolPageLayout.tsx` and `WorkspaceLayout.tsx`):
  - **Tool-Specific Pages**: Instead of a global toolbar, each tool has its own dedicated dynamic route (e.g., `/image/[tool]/page.tsx`).
  - **Center Canvas (`CanvasArea.tsx`)**: Edge-to-edge 55vh on mobile, perfectly scaled flex-1 on desktop. Now completely modularized, orchestrating logic via custom hooks (`usePixiApp`, `useCanvasRender`, `useCanvasDrop`, `useCanvasExport`) in `src/components/workspace/canvas/hooks/`.
  - **Right Properties Panel (`PropertiesPanel.tsx`)**: Responsive natural document flow on mobile and a sticky sidebar on desktop. Operates as a lightweight orchestrator importing pure UI modules (e.g., `LayerTransformSettings.tsx`, `OCRSettings.tsx`) from `src/components/workspace/properties/components/`.
  - **Maximized Viewport**: The layout drops massive hero sections during active editing, embedding the tool title neatly into the `WorkspaceLayout` top bar, and allowing the workspace to stretch full-screen (`100vh - 64px`) for optimal UX.

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
- **Aspect Ratio Locking & Sync**: Crop boundaries dynamically calculate safe maximum extents to prevent out-of-bounds dragging, and can rigidly enforce standard aspect ratios (e.g. 1:1, 16:9). A single unified "Crop Area Size" master slider keeps Width and Height perfectly synced relative to the center.
- **Premium Canvas Overlays**: Instead of standard bounding boxes, the engine dynamically draws a "Rule of Thirds" alignment grid (with opacity and contrast boundaries) and utilizes premium L-shaped corner handles and pill-shaped edge handles.
- **Image Panning**: By calculating relative mouse offsets and updating `sprite.texture.frame` instead of `sprite.x/y`, users can seamlessly drag the image _behind_ the stationary crop mask.

### 9. Dynamic Tool Engine

Instead of building a separate React component for every new image or video filter, we implemented a generic **Dynamic Tool Generation Architecture**.

- `src/lib/toolRegistry.ts`: A centralized JSON registry defining all available tools, their categories, and required parameters (e.g., sliders, toggles).
- `DynamicPropertiesPanel.tsx`: Automatically renders UI controls based on the active tool's definition in the registry.
- `useDynamicTool.ts`: A generic hook that maps the generated parameters to the correct Web Worker (via `Comlink`), processes the Blob, and safely updates the layer state inside `Dexie` without bloating the main thread.

### 10. Web Workers & WASM

- **Destructive Workflows**: Complex pixel-level filters (Grayscale, Sepia, Invert, Vintage, Solarize) are completely offloaded via `image.worker.ts`.
- **OffscreenCanvas**: The worker natively decodes image blobs using `createImageBitmap` and processes the raw `ImageData` via an `OffscreenCanvas`. This prevents heavy JavaScript loops from blocking the main UI thread.
- **RPC & Storage**: Uses `Comlink` for type-safe RPC. When a worker completes a filter, the new resulting blob is automatically saved to IndexedDB as a new file, and the Canvas layer seamlessly hot-swaps to the new texture.

## 7. History & Time Travel (Undo/Redo)

- **Zustand State Wrapping**: The `useWorkspaceStore` implements a fully functional `past` and `future` array stack for layer states.
- **Layer Snapshots**: Before any layer transformation, addition, or removal, the current layer tree is snapshotted into the `past` array.
- **Original File Restoration**: Every layer explicitly tracks its `originalFileId`, allowing the "Restore Original" feature to revert a file back to its pre-filtered native form without corrupting the broader undo/redo history timeline.

## 8. Document & PDF Processing

- **PDF Generation & Manipulation**: Utilizes `pdf-lib` via a dedicated `pdf.worker.ts` to merge, split, watermark, and construct PDF files from raw images.
- **Viewer Component**: Uses `react-pdf` to render a fully native React component thumbnail grid, allowing drag-and-drop array reordering for multi-page documents seamlessly within the workspace layout.

## 9. Media Heavyweight (Video & Audio)

- **FFmpeg Integration**: Powered by `@ffmpeg/ffmpeg` and compiled to WebAssembly. Allows deep manipulation of `.mp4`, `.webm`, `.mp3`, and `.wav` formats locally.
- **Shared Memory**: Requires strict `Cross-Origin-Embedder-Policy` and `Cross-Origin-Opener-Policy` headers in `next.config.ts` to unlock `SharedArrayBuffer` for zero-copy memory transfers.
- **Audio Workspaces**: Specialized `AudioWorkspaceArea` and `VideoWorkspaceArea` intercept these file types to bypass the PixiJS WebGL canvas, replacing it with native HTML5 `<audio>` and `<video>` players while retaining identical property pane synchronization.

## 10. AI Processing (Machine Learning)

- **ONNX & Transformers.js**: Runs true Machine Learning models locally using the browser's WASM backend or WebGPU.
- **Hardware Acceleration Probe & Cascade**: The inference engine implements an asynchronous, multi-tiered startup probe (`WebGPU` -> `WebNN-NPU` -> `WebNN` -> `WASM`). To prevent crashing or deadlocking on low-spec hardware:
  - **GPU Memory Checks**: Probes the GPU adapter limits (`maxBufferSize`) to ensure at least 256MB of buffer allocation size is supported before enabling WebGPU.
  - **Dynamic Precision Selection**: Queries device feature support (e.g. `shader-f16` extension) to load optimized 16-bit float models (`fp16`) for ~2x speedups on modern GPUs, while safely falling back to full-precision `fp32` on older hardware (like Intel Gen 9) where fp16 shaders cause compilation stalls.
  - **Lazy Worker Initialization**: Keeps worker import synchronous and offloads adapter checking inside `getOrProbeBackends()` to avoid top-level await deadlocks on the Comlink RPC thread.
- **Self-Healing Device Blacklisting**: If a backend encounters an unrecoverable driver deadlock or crash during session initialization, the system intercepts the error and blacklists that backend in `localStorage` (`fileforge:ai_backend_blacklist`) to automatically skip it on subsequent runs and route directly to the stable multi-threaded WASM CPU fallback.
- **Dynamic Scaling & Profiling**: Automatically downscales high-megapixel images to optimal tensor boundaries (`512px`, `1024px`) before inference to prevent WebGL memory allocation crashes, then intelligently upscaled the generated alpha mask back to native resolution. A `PerformanceProfiler` captures exact telemetry step-by-step with microsecond/nanosecond formatting and formatted file metrics.
- **Background Removal**: Implements the advanced `onnx-community/BEN2-ONNX` model within `rmbg.worker.ts` to generate precise alpha masks and extract foreground subjects from images, natively handling alpha matting.
- **Pipeline Plugin System**: The AI models are completely decoupled from the Web Workers via a generic `PipelinePlugin` TypeScript interface. **CRITICAL ARCHITECTURE DECISION:** This future-proofs the background removal tool, ensuring that when superior open-source models are released in the future, developers can simply swap out the ONNX file (e.g., migrating from `Rmbg1.4` to `BEN2`) without rewriting the UI, the Web Worker logic, or the post-processing hooks.
- **Non-Destructive Mask Engine**: The UI features an advanced WebGL pipeline leveraging a dual-texture system (`baseMaskRenderTexture`). This allows users to manually restore/erase mask edges using a customized brush, while simultaneously applying real-time, non-destructive `BlurFilter` and `ColorMatrixFilter` thresholding for feathering and edge-shifting directly on the GPU.
- **Polyfill Overrides**: Uses a custom `polyfill.ts` injected into the worker to safely mock DOM variables (like `document`), circumventing library bugs in `AutoProcessor` and ensuring flawless background AI execution.

## 11. Local Utilities

- **Archive Tools**: Natively packs and extracts `.zip` archives into the browser's IndexedDB using `jszip`, bypassing OS file explorers entirely.
- **Cryptographic & Encoders**: Securely generates UUIDs via the native `crypto.randomUUID()` Web Crypto API and processes gigabyte-scale files into Base64 using chunked `ArrayBuffer` iterators to prevent JavaScript engine call stack limitations.

## 12. High-Fidelity Export Engine

- **WebGL Canvas Extraction**: The export pipeline (`useCanvasExport.ts`) directly extracts the specific active layer via PixiJS `app.renderer.extract.canvas()`. It seamlessly captures non-destructive GPU edits including AI background removal masks, edge feathering, scaling, and crop rectangles, while dynamically ignoring inactive layers, grid lines, and overlay controls.
- **Accurate JPEG Transcoding**: By isolating the target layer to its exact pixel bounds before extracting, the conversion accurately handles transparency bounds without exporting the empty space of the broader application viewport.
- **Mobile Responsive Modals & Architecture Escapes**: The `ExportModal` relies on flexible CSS utilities to adjust preview screens and download settings sidebars naturally across mobile and desktop. It utilizes React's `createPortal` to render the modal directly to `document.body`, gracefully escaping local z-index constraints of the main workspace. It also intercepts the browser's `popstate` history API to ensure mobile users can close the modal using their physical/swipe back button without breaking navigation state.

## 12. Backend Architecture (Phase 6)

- **Database Engine**: Powered by MongoDB (Mongoose) with a globally cached connection system in `src/lib/mongodb.ts` for optimized serverless execution.
- **Data Models**: Fully typed and strictly schema-enforced models for `User`, `Subscription`, and `Workspace` configs.
- **Authentication**: Built with `@supabase/auth-helpers-nextjs` to provide seamless, scalable JWT-based email/password authentication via `src/lib/supabase.ts`, effectively bridging standard MongoDB data layers with secure external Supabase identity providers.
