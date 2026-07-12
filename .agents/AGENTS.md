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

### 3. File Persistence (Dexie / IndexedDB)

- **Data Normalization**: NEVER store literal `File` objects directly into Dexie/IndexedDB. Depending on the browser/OS, the internal memory pointers will corrupt over time.
- **Correct Method**: Always convert the file into an ArrayBuffer and store it as a generic `Blob` (`new Blob([await file.arrayBuffer()], { type: file.type })`).
- **Error Handling**: If `createImageBitmap` throws an `InvalidStateError` (indicating file corruption), gracefully catch it, call `removeLayer(id)` to clear the broken layer from the Zustand state, and log it.

### 4. Web Workers & WASM

- **FFmpeg & Shared Memory**: When using `@ffmpeg/ffmpeg`, the worker utilizes `SharedArrayBuffer`. When casting FFmpeg outputs (which are `Uint8Array<ArrayBufferLike>`) to standard Blobs, ALWAYS explicitly cast to `Uint8Array<ArrayBuffer>` (e.g., `new Blob([data as unknown as Uint8Array<ArrayBuffer>])`) to satisfy strict TypeScript `BlobPart` constraints without using `any`.
- **AI Models (Transformers.js)**: Transformers.js and the `AutoProcessor` library occasionally reference DOM globals like `document` which do not exist in Web Workers, causing `ReferenceError` crashes. NEVER remove the `import "./polyfill"` line at the top of AI workers, as it safely mocks these globals.

### 5. Backend & Database Architecture

- **Mongoose Caching**: Due to Next.js API hot-reloading and serverless environments, ALWAYS use the globally cached mongoose connection method defined in `src/lib/mongodb.ts`. Never establish rogue inline `mongoose.connect()` calls in random files, as this exhausts connection pools rapidly.
- **Dual Support (Supabase + MongoDB)**: The identity layer runs on `@supabase/auth-helpers-nextjs`, but all physical user state (Subscriptions, Workspace Configs) is retained inside MongoDB. Do not write direct SQL to Supabase. Always link the Supabase `authProviderId` strictly back to the Mongoose `User` model.

<!-- END:file-forge-agent-rules -->
