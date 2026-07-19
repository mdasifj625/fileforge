# File Forge

File Forge is a local-first, privacy-focused file processing workspace. It allows you to process images, PDFs, video, and audio directly in your browser using WebAssembly and Web Workers. Files never leave your device.

## Core Features

- **100% Local Processing:** Powered by WASM and Web Workers.
- **Dynamic Tool Generation:** New tools (e.g., Vintage, Sepia filters) are generated dynamically via a JSON `toolRegistry` that automatically mounts UI controls and routes arguments to Web Workers. No more writing redundant React components for simple effects.
- **AI & Advanced Tools:** Local background removal (BEN2 via Transformers.js pipeline) featuring a non-destructive GPU-accelerated editing suite (Real-time Edge Feathering, Edge Shifting, and a Manual Restore/Erase Mask Brush). **Hardware Acceleration:** Includes a robust multi-tiered fallback architecture prioritizing WebGPU and WebNN (NPU) for blazing-fast inference (slashing processing times from minutes to seconds) with dynamic resolution scaling. **Future-Proofed Architecture:** AI models are strictly decoupled via a generic `PipelinePlugin` interface, meaning when a highly superior model drops in the future, you can swap the ONNX file without having to rewrite any of the UI or post-processing hooks. Also includes OCR (Tesseract.js). **Image AI tools** (Remove Background, Profile Picture Maker, Magic Eraser, Image Upscale) live under `/image/*` routes; **document/text AI tools** (OCR, Face Detection, Summarize PDF, Translate Document) live under `/ai/*` routes.
- **High-Fidelity WebGL Export:** Accurately extracts processed canvas layers directly from the GPU, perfectly capturing non-destructive AI masks, crop rects, and edge effects while enforcing proper bounds for JPEG conversion. Includes a dedicated Export Engine overlay featuring real-time format conversion, quantization, and smart 2x scaling presets.
- **Maximized UX & Premium Design:** Edge-to-edge full-screen responsive workspace minimizing header bloat. Features dynamic navigation titles on mobile, sleek Apple-quality light/dark modes using semantic `oklch` CSS variables, and visually stunning interactive tool layouts.
- **Advanced Crop & Transform UI:** A truly premium photo editing experience. Features a unified 'Crop Area Size' master slider that perfectly syncs width and height relative to center, stylized L-shape and pill handles, and a dynamically rendered Rule of Thirds grid on the WebGL canvas. Also includes a unified Resize Engine with dynamic aspect ratio unlinking, strict constraint enforcements ("Do not enlarge"), and perfectly synchronized 1x canvas overrides.
- **Media Heavyweight:** Full client-side video and audio processing (Trim, Merge, Convert, Compress) using FFmpeg.wasm with SharedArrayBuffer.
- **Document Workspaces:** Fast PDF processing, merging, splitting, watermarking, and rendering via `pdf-lib` and `react-pdf`.
- **Developer Utilities:** In-browser ZIP/Unzip, Base64 encoding/decoding, and UUID generation without API calls.
- **Backend & Monetization Setup:** Prepared architecture with dual compatibility for Supabase Authentication and MongoDB/Mongoose models (`User`, `Subscription`, `Workspace`). Fully integrated with Google AdSense, featuring optimized, high-RPM placements (Responsive Leaderboards, In-feed Rectangles, Skyscrapers, and Sticky Bottom Anchors) that comply with UX best practices and policies against accidental clicks.
- **Time Travel:** Fully integrated Undo/Redo history system that tracks complex state transformations and retains original native file references.
- **Privacy First:** No server uploads, no data collection.
- **Standalone Tools & SEO:** Dedicated dynamic routes (e.g., `/image/crop`, `/image/remove-background`, `/video/compress`) that offer focused workspaces optimized for mobile and desktop, featuring rich SEO content directly embedded for discoverability. Image-processing AI tools are co-located in the `/image/` category for intuitive discoverability; purely document/text AI tools (OCR, Face Detection, etc.) remain in the `/ai/` category.
- **Blazing Fast:** Leveraging `Comlink` for worker RPC, `PixiJS` (WebGL) for real-time previews, and zero-lag React bindings (via imperative Zustand subscriptions) to eliminate UI freezing during 60fps canvas manipulations.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database / Auth:** MongoDB (Mongoose) / Supabase Auth
- **Styling:** Tailwind CSS + Radix UI
- **State:** Modular Zustand (independent slices for Layers, Tools, AI, Export) + Dexie.js (for massive Blob storage)
- **Workers:** Comlink + WASM (FFmpeg, OpenCV, ONNX)
- **Package Manager:** Yarn

## Development

```bash
# Install dependencies
yarn install

# Run the development server
yarn dev
```

## Testing

```bash
# Run unit tests (Vitest)
yarn test

# Run e2e tests (Playwright)
yarn test:e2e
```

## Architecture Highlights

File Forge employs a strictly decoupled architecture designed for raw browser performance:

1. **WebGL Canvas Engine:** Powered by PixiJS (`LayerManager`) and completely detached from the React render tree during interactions for 0-lag dragging/scaling.
2. **Worker Orchestration:** Intense tasks (BEN2 AI, OCR, FFmpeg) are routed via `Comlink` to strictly isolated Web Workers to prevent memory crashes on the main thread.
3. **Modular Zustand State:** The global store is partitioned into independent slices (`useLayerStore`, `useToolStore`, `useAIStore`, `useExportStore`) to prevent global re-renders.
4. **Decoupled Canvas Surfaces:** Surface routing allows hot-swapping between `ImageCanvas` (PixiJS) and `PdfCanvas` (Native DOM) based on the active tool, ensuring text remains selectable for documents while keeping pixel operations blazingly fast.
5. **Smart Export Engine:** A strategy-pattern export engine handles dynamic UI injection and format-specific execution (PNG vs PDF vs Audio) while keeping the root `<ExportModal>` a pure shell.

## Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md): Detailed overview of the system design, Canvas Engine, and State Management.
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md): Guidelines for developing, testing, and submitting code to File Forge.
- [AI Rules](./.agents/AGENTS.md): Core rules and context specifically designed for AI coding agents.

## Route Structure

| Category | URL pattern       | Contains                                                                                                                                              |
| -------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image    | `/image/[tool]`   | Compress, Crop (with Smart Auto-Trim), Resize, Convert, Watermark, Filters, **Remove Background, Profile Picture Maker, Magic Eraser, Image Upscale** |
| PDF      | `/pdf/[tool]`     | Merge, Split, Compress, Watermark, Protect, Unlock                                                                                                    |
| Video    | `/video/[tool]`   | Trim, Convert, Compress, Extract Audio, GIF Creator                                                                                                   |
| Audio    | `/audio/[tool]`   | Trim, Merge, Convert, Volume & Speed                                                                                                                  |
| AI       | `/ai/[tool]`      | Extract Text (OCR), Face Detection, Summarize PDF, Translate Document                                                                                 |
| Utility  | `/utility/[tool]` | ZIP, Unzip, Base64, UUID, Color Converter, Regex Tester                                                                                               |
