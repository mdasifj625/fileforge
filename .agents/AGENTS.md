<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:file-forge-agent-rules -->

# File Forge Project Rules

To maintain architecture stability and a premium user experience, ALL AI agents working on this project MUST adhere to the following rules:

### 1. UI & Theming (Semantic OKLCH)

- **DO NOT** use hardcoded Tailwind gray classes (e.g., `bg-zinc-900`, `text-gray-500`, `border-neutral-800`).
- **DO USE** our semantic CSS variables defined in `src/app/globals.css`.
- **Core Semantic Tokens**: `bg-background`, `bg-panel`, `border-panel-border`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`.
- Our theme system automatically supports stunning, Apple-quality Light and Dark modes.

### 2. PixiJS WebGL Canvas

- **Blob Loading**: NEVER use `URL.createObjectURL()` to load images into PixiJS. It causes memory leaks and async tearing. ALWAYS use `createImageBitmap(blob)` to decode the image on the GPU before passing it to `PIXI.Texture.from()`.
- **Canvas Background**: The PixiJS application is initialized with `backgroundAlpha: 0`. This is intentional! It allows the CSS-based Light/Dark themes (`bg-panel`) to visually pass through the WebGL canvas. Do not hardcode black or white backgrounds in PixiJS.
- **Interactivity**: When dragging or scaling objects, always use `app.stage.on('globalpointermove')` combined with `app.stage.toLocal(event.global)` instead of attaching listeners directly to small sprites. This prevents the mouse from outrunning the bounding box.
- **Cropping (PixiJS v8)**: `texture.frame` is read-only in v8. To implement non-destructive cropping, you MUST instantiate a new `PIXI.Texture` sharing the same `source` but with the updated `frame` rectangle: `new PIXI.Texture({ source: sprite.texture.source, frame: new PIXI.Rectangle(...) })`.
- **Mask Swapping & GPU Memory**: In PixiJS v8, `AlphaMaskPipe` heavily caches render instructions. If you swap a sprite's mask and immediately call `renderTexture.destroy(true)` synchronously, the renderer will crash with `Cannot read properties of null (reading '0')` because the current frame's pipeline still attempts to execute against the now-destroyed VRAM. ALWAYS use `setTimeout(() => oldTexture.destroy(true), 100)` when hot-swapping masks.
- **Graphics API (PixiJS v8)**: `beginFill()`, `drawRect()`, `drawCircle()`, and `endFill()` are DEPRECATED. ALWAYS use `.rect()`, `.circle()`, `.fill()`, and `.stroke()` on `PIXI.Graphics` instances.

### 3. File Persistence (Dexie / IndexedDB)

- **Data Normalization**: NEVER store literal `File` objects directly into Dexie/IndexedDB. Depending on the browser/OS, the internal memory pointers will corrupt over time.
- **Correct Method**: Always convert the file into an ArrayBuffer and store it as a generic `Blob` (`new Blob([await file.arrayBuffer()], { type: file.type })`).
- **Error Handling**: If `createImageBitmap` throws an `InvalidStateError` (indicating file corruption), gracefully catch it, call `removeLayer(id)` to clear the broken layer from the Zustand state, and log it.

### 4. Web Workers & WASM

- **FFmpeg & Shared Memory**: When using `@ffmpeg/ffmpeg`, the worker utilizes `SharedArrayBuffer`. When casting FFmpeg outputs (which are `Uint8Array<ArrayBufferLike>`) to standard Blobs, ALWAYS explicitly cast to `Uint8Array<ArrayBuffer>`.
- **AI Models (Transformers.js)**: Transformers.js and the `AutoProcessor` library occasionally reference DOM globals like `document` which do not exist in Web Workers, causing `ReferenceError` crashes. NEVER remove the `import "./polyfill"` line at the top of AI workers.
- **AI Hardware Acceleration**: ALWAYS explicitly handle multi-tiered hardware acceleration (`webgpu` -> `webnn` -> `wasm`) inside the worker orchestrator (`rmbg.worker.ts`) before passing the chosen device to the model plugin.
  - **Asynchronous GPU Probing**: Probe GPU adapters asynchronously during module execution using `getOrProbeBackends()` instead of using top-level await which halts Comlink initialization. Ensure device has sufficient `maxBufferSize` (>= 256MB) and `maxStorageBufferBindingSize` (> 128MB) before enabling WebGPU to avoid attention graph compilation crashes.
  - **Dtype Selection**: Load `fp16` only if `shader-f16` is supported on the GPU, falling back to `fp32` on older hardware to prevent silent graph compilation deadlocks. Keep WASM on default `fp32` weights.
  - **Failure Blacklisting**: If a backend stalls/crashes, write it immediately to `localStorage` blacklist (`fileforge:ai_backend_blacklist`) to skip it permanently on the device on future runs. WASM must never be blacklisted.
- **AI Background Removal (PipelinePlugin)**: The AI models are decoupled from the Web Worker logic via the `PipelinePlugin` interface (`src/workers/plugins/PipelinePlugin.ts`). Always use this interface to build new models (like `Ben2Plugin`) and instantiate them in the `RMBGProcessor` constructor. This future-proofs the app, meaning you NEVER hardcode model logic directly into the worker thread. We currently use `onnx-community/BEN2-ONNX` which natively handles alpha matting.
- **Mobile Profiling**: If implementing a `PerformanceProfiler`, DO NOT use `alert()` to display it, as it breaks the user flow. ALWAYS use `console.log()` and instruct the user to utilize native Remote Debugging (Chrome Inspect / Safari Web Inspector). Use microseconds/nanoseconds for fine steps, and format byte sizes to MB/KB automatically.

### 5. Backend & Database Architecture

- **Mongoose Caching**: Due to Next.js API hot-reloading and serverless environments, ALWAYS use the globally cached mongoose connection method defined in `src/lib/mongodb.ts`. Never establish rogue inline `mongoose.connect()` calls in random files, as this exhausts connection pools rapidly.
- **Dual Support (Supabase + MongoDB)**: The identity layer runs on `@supabase/auth-helpers-nextjs`, but all physical user state (Subscriptions, Workspace Configs) is retained inside MongoDB. Do not write direct SQL to Supabase. Always link the Supabase `authProviderId` strictly back to the Mongoose `User` model.

### 6. Code Architecture & Component Modularization

- **No Monolithic Components**: Complex components (like `CanvasArea.tsx` or `PropertiesPanel.tsx`) must NOT exceed a few hundred lines.
- **Logic / UI Split**: Always extract heavy logical operations (`useEffect` hooks, Web Worker bindings) into custom files inside a `hooks/` subdirectory (e.g., `usePixiApp.ts`, `useBackgroundRemoval.ts`). Extract pure UI blocks into their own files within a `components/` subdirectory.
- **Orchestrator Pattern**: Main component files should act purely as lightweight orchestrators that stitch together custom logic hooks and UI sub-components.

### 7. Adding New Tools (toolRegistry)

- **Do Not Write Redundant React Components**: If you are adding a basic image filter, audio effect, or video transformation that just requires simple sliders, dropdowns, or toggles, DO NOT write a custom UI component.
- **Use the Registry**: Simply add the tool definition into `src/lib/toolRegistry.ts`. The `DynamicPropertiesPanel` will automatically render the UI, and `useDynamicTool` will route the parameters to the correct Web Worker.

### 8. Premium UI & Tool Aesthetics

- **Master Sliders**: When building transform or crop controls, favor unified "Master Sliders" (e.g., a single slider that scales width and height proportionally from the center) rather than multiple individual X/Y offset sliders. It yields a more professional feel.
- **Canvas Visuals**: Features like cropping should always include premium graphical hints, such as drawing a "Rule of Thirds" grid on the PixiJS bounds box (`useTransformOverlay.ts`) and utilizing stylized handles (thick L-shapes or pills) rather than standard small squares.
- **Responsive Layout**: If you create a new workspace tool, ensure the layout remains clean on mobile devices. Navigation bars should dynamically show the active tool on small viewports so users don't lose context.

### 9. Export & Modal Architecture

- **React Portals for Modals**: When building global overlays like the `ExportModal`, ALWAYS use `createPortal(..., document.body)` and apply `z-[100]`. Due to the `ToolPageLayout` and `WorkspaceLayout` heavily utilizing internal `z-10` to `z-50` stacking contexts for the canvas and navigation bars, nesting a fixed modal inside the workspace DOM will cause it to be clipped or trapped behind navigation headers.
- **Mobile History Management**: If a modal occupies the full screen on mobile devices, use the browser's `history.pushState` API upon opening and listen for `popstate` events to close the modal. This ensures that users who swipe back on their phones or press the physical back button will gracefully exit the modal rather than accidentally navigating away from the tool page and losing their work.

<!-- END:file-forge-agent-rules -->
