# Architecture & Guidelines for File Forge

This directory contains technical decisions to guide development.

## 1. Web Workers & Communication

All heavy lifting MUST be done in Web Workers. We use `comlink` to wrap workers in an RPC API to avoid `postMessage` boilerplate.

## 2. Storage

Use `Dexie.js` for persistent storage of large blobs (undo history, autosaves). DO NOT use `localStorage` for binary data.

## 3. UI and Canvas

- Use `Radix UI` primitives styled with `Tailwind CSS`.
- Real-time canvas previews use a WebGL pipeline (e.g. `PixiJS`) to run tools as GPU fragment shaders, ensuring 60fps interaction before the final WASM export.

## 4. Routing

Use Next.js shallow routing for tool navigation. Keep the core workspace component mounted to preserve Dexie connections and file state between tools.
