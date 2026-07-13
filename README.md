# File Forge

File Forge is a local-first, privacy-focused file processing workspace. It allows you to process images, PDFs, video, and audio directly in your browser using WebAssembly and Web Workers. Files never leave your device.

## Core Features

- **100% Local Processing:** Powered by WASM and Web Workers.
- **Dynamic Tool Generation:** New tools (e.g., Vintage, Sepia filters) are generated dynamically via a JSON `toolRegistry` that automatically mounts UI controls and routes arguments to Web Workers. No more writing redundant React components for simple effects.
- **AI & Advanced Tools:** Local background removal (BEN2 via Transformers.js pipeline) featuring a non-destructive GPU-accelerated editing suite (Real-time Edge Feathering, Edge Shifting, and a Manual Restore/Erase Mask Brush). **Future-Proofed Architecture:** AI models are strictly decoupled via a generic `PipelinePlugin` interface, meaning when a highly superior model drops in the future, you can swap the ONNX file without having to rewrite any of the UI or post-processing hooks. Also includes Smart Crop and OCR (Tesseract.js).
- **High-Fidelity WebGL Export:** Accurately extracts processed canvas layers directly from the GPU, perfectly capturing non-destructive AI masks, crop rects, and edge effects while enforcing proper bounds for JPEG conversion.
- **Maximized UX:** Edge-to-edge full-screen responsive workspace minimizing header bloat during active editing.
- **Media Heavyweight:** Full client-side video and audio processing (Trim, Merge, Convert, Compress) using FFmpeg.wasm with SharedArrayBuffer.
- **Document Workspaces:** Fast PDF processing, merging, splitting, watermarking, and rendering via `pdf-lib` and `react-pdf`.
- **Developer Utilities:** In-browser ZIP/Unzip, Base64 encoding/decoding, and UUID generation without API calls.
- **Backend & Monetization Setup:** Prepared architecture with dual compatibility for Supabase Authentication and MongoDB/Mongoose models (`User`, `Subscription`, `Workspace`).
- **Time Travel:** Fully integrated Undo/Redo history system that tracks complex state transformations and retains original native file references.
- **Privacy First:** No server uploads, no data collection.
- **Standalone Tools:** Dedicated dynamic routes (e.g., `/image/crop`, `/video/compress`) that offer focused workspaces optimized for mobile and desktop.
- **Blazing Fast:** Leveraging `Comlink` for worker RPC and `PixiJS` (WebGL) for 60fps real-time previews.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database / Auth:** MongoDB (Mongoose) / Supabase Auth
- **Styling:** Tailwind CSS + Radix UI
- **State:** Zustand + Dexie.js (for massive Blob storage)
- **Workers:** Comlink + WASM (FFmpeg, OpenCV, ONNX)
- **Package Manager:** Yarn

## Development

```bash
# Install dependencies
yarn install

# Run the development server
yarn dev
```

## Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md): Detailed overview of the system design, Canvas Engine, and State Management.
- [AI Rules](./.agents/AGENTS.md): Core rules and context specifically designed for AI coding agents.
