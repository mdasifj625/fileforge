# File Forge

File Forge is a local-first, privacy-focused file processing workspace. It allows you to process images, PDFs, video, and audio directly in your browser using WebAssembly and Web Workers. Files never leave your device.

## Core Features

- **100% Local Processing:** Powered by WASM and Web Workers.
- **Non-Destructive Editing:** A Figma-like canvas where operations act as layers.
- **Privacy First:** No server uploads, no data collection.
- **Blazing Fast:** Leveraging `Comlink` for worker RPC and `PixiJS` (WebGL) for 60fps real-time previews.

## Tech Stack

- **Framework:** Next.js (App Router)
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

For AI coding agents, please refer to the `.agents/` directory for architecture decisions and guidelines.
