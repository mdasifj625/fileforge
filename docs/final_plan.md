# File Forge: Final System Architecture & Product Plan

This document serves as the comprehensive, production-ready technical specification and product plan for **File Forge** (the local-first, privacy-focused file processing workspace). It synthesizes the core vision of building a fast, browser-native platform that rivals iLovePDF, TinyPNG, and Canva, while strictly adhering to the "NO SERVER PROCESSING, NO FILE UPLOADS" mandate.

This is a **full-fledged final product plan**, designed to be built in phases but architected from Day 1 for maximum scale, performance, and a premium "Figma-like" experience.

---

## 1. Core Vision & Technical Guiding Principles

- **Privacy-First & Local:** 100% of file processing happens in the browser via Web Workers, WebAssembly (WASM), and OffscreenCanvas. Files never leave the device.
- **Editor Experience:** A premium, dynamic UI resembling Figma or Linear. Real-time previews, drag-and-drop, non-destructive editing, and high-performance rendering.
- **Modular Architecture:** Independent processing engines (Image, PDF, Video, Audio, AI, Utility) that expose standard APIs to the UI.
- **Monetization without Friction:** Free core usage with no fake limits. Monetization via premium batch processing, desktop apps, and enterprise APIs.

---

## 2. Complete System Architecture

The application follows a clean separation of concerns: **UI Layer** (React/Next.js) ↔ **State Management** (Zustand + Dexie.js) ↔ **Engine Layer** (TypeScript APIs) ↔ **Worker Layer** (Web Workers/WASM via Comlink).

### 2.1 Processing Engine & Worker Architecture

- **Worker Communication (Comlink):** We use **Comlink** to wrap Web Workers in a seamless RPC (Remote Procedure Call) API. This allows the UI to call complex worker functions as if they were regular async functions, ensuring type safety and minimal boilerplate.
- **Engine Layer:** Each domain (Image, PDF, etc.) has an `Engine` class (e.g., `ImageEngine`). The UI interacts only with these Engines.
- **Worker Pool:** Engines dispatch heavy computation to a Web Worker Pool to prevent main thread blocking.
- **WASM & AI Loading Strategy:** WASM binaries and AI models (FFmpeg, OpenCV, ONNX) are **lazy-loaded** only when their specific tool route is accessed. They are permanently stored in the **Cache API (Service Worker)** so subsequent offline visits load them instantly.
- **Memory Management:** SharedArrayBuffer is used for zero-copy memory transfers between the main thread and workers (requires Cross-Origin Isolation headers).

### 2.2 Component Hierarchy & Real-Time Rendering

- **UI Components:** The UI layer uses **Radix UI primitives** for accessible, unstyled core functionality (modals, dropdowns, split panes), styled with a **fully custom Tailwind CSS** design system to ensure a highly flexible and premium editor layout.
- **Workspace Component:** The core editor interface is a **unified "Canvas / Timeline" workspace**. Tools act as applied **"Layers" or "Filters"**, allowing users to toggle/reorder operations non-destructively before exporting.
- **Real-time Rendering (WebGL/PixiJS):** To support 60fps real-time previews of stacked operations (e.g., Crop + Brightness + Blur), the canvas utilizes a **WebGL-based pipeline (PixiJS)**. Tools act as fragment shaders or GPU-accelerated filters for instant visual feedback, while the final high-resolution export is processed by WASM.
- **Animations:** Motion (Framer Motion) for micro-interactions and smooth transitions.

### 2.3 State Management & Storage

- **Global State (Zustand):** Manages user preferences and UI state (dark mode, active panels).
- **Persistent Storage (Dexie.js):** Because this is a full-fledged editor handling large files, **Dexie.js** (a robust IndexedDB wrapper) is used to efficiently store binary data (Blobs/ArrayBuffers) for undo/redo history and auto-saves, preventing browser crashes.

---

## 3. Complete Folder Structure

```text
file-forge/
├── src/
│   ├── app/                    # Next.js App Router (Pages & API)
│   │   ├── (marketing)/        # Landing page, blog, pricing, about
│   │   ├── (tools)/            # Dynamic routes for tools: /image/resize, /pdf/merge
│   │   └── layout.tsx          # Root layout (Providers, Fonts, Metadata)
│   ├── components/             # Reusable UI Components
│   │   ├── ui/                 # Radix UI + Tailwind Design System
│   │   ├── workspace/          # Core Editor UI (ToolPageLayout, WorkspaceLayout, Canvas, Properties)
│   │   └── layout/             # Navigation, Footer, SEO Breadcrumbs
│   ├── engines/                # Processing Engine APIs (Main Thread Wrapper)
│   │   ├── image/              # ImageEngine (Pica, OpenCV wrappers)
│   │   ├── pdf/                # PDFEngine (pdf-lib wrappers)
│   │   ├── video/              # VideoEngine (FFmpeg wrapper)
│   │   └── ai/                 # AIEngine (ONNX Runtime wrapper)
│   ├── workers/                # Web Workers (wrapped with Comlink)
│   ├── store/                  # Zustand stores
│   ├── db/                     # Dexie.js database schema & queries
│   ├── lib/                    # Utilities, Types, Constants
│   ├── styles/                 # Global CSS, Tailwind configurations
│   └── public/                 # Static assets, WASM binaries, ONNX models
├── package.json
├── tailwind.config.js
└── next.config.js              # Configured for Cross-Origin Isolation headers
```

---

## 4. Information Architecture & SEO Strategy

**Routing Structure:**

- `/` - Landing page (Optimized for conversions and explaining the "Local-first" advantage)
- `/image/[tool]` - All image operations, **including image-targeted AI tools** (Remove Background, Smart Crop, Magic Eraser, Image Upscale). Placing these here makes them discoverable alongside other image tools in the nav.
- `/ai/[tool]` - Document/text AI tools only: Extract Text (OCR), Face Detection, Summarize PDF, Translate Document.
- `/pdf/[tool]`, `/video/[tool]`, `/audio/[tool]`, `/utility/[tool]` - Their respective media domains.
- `/blog/[slug]` - Educational content, use-case guides, and "How to" articles.

**Workspace Navigation & SEO:**

- **Shallow Routing:** We use Next.js shallow routing (or parallel/intercepting routes). The URL updates for SEO and shareability, but the core Workspace component remains mounted. This preserves the Dexie.js state, loaded files, and layers without reloading the page when switching between tools.
- **Static Generation (SSG):** All tool pages and blog posts are statically generated.
- **Structured Data:** JSON-LD schema injected into every tool page.

---

## 5. Development Phases (Building the Final Product)

### Phase 1: Foundation & Core Editor (Months 1-2)

- **Infrastructure:** Next.js setup, Radix UI + Tailwind design system, Dexie.js storage layer, Comlink Worker RPC setup.
- **Workspace UI:** The non-destructive "Layers/Filters" canvas interface with WebGL/PixiJS real-time preview.
- **Engines:** Basic Image operations (Crop, Resize, Convert, Compress).

### Phase 2: Documents & PDF Processing (Months 3-4)

- **Engines:** PDF Merge, Split, Extract Pages, Watermark (`pdf-lib`).
- **UI:** Thumbnail grid layer, multi-page canvas views.

### Phase 3: AI & Advanced Tools (Months 5-6)

- **Infrastructure:** Cache API for lazy-loading ONNX models.
- **Engines:** Background Removal (RMBG/BEN2), Smart Crop, Magic Eraser, Image Upscale — all served under `/image/*` routes for intuitive discoverability.
- **Document AI:** Local OCR (Tesseract.js), Face Detection, Summarize PDF, Translate Document — served under `/ai/*` routes.

### Phase 4: Media Heavyweight (Months 7-8)

- **Infrastructure:** FFmpeg.wasm integration with SharedArrayBuffer.
- **Engines:** Video/Audio Trim, Format Conversion, GIF Creator.
- **Utilities:** ZIP/Unzip, Base64, UUID.

---

## 6. Premium, Monetization & Database Architecture

While the core app is serverless, the final product includes premium backend infrastructure.

**Database Architecture:**

- **Stack:** Supabase (PostgreSQL).
- **Tables:** `Users`, `Subscriptions`, `Workspaces` (syncing preferences and layer configurations, but _not_ the raw binary files).
- **Auth:** Supabase Auth.

**Monetization Roadmap:**

1.  **Premium Batch Processing:** Cap free batch processing. Charge for unlimited batching via Stripe.
2.  **Desktop App / Extension:** Sell a packaged Electron/Tauri app for offline-first, native system integration.
3.  **Developer API:** Expose the engines as a paid cloud API for enterprise users who _want_ cloud processing.

---

## 7. Scaling & Launch Strategy

- **Launch:** Product Hunt & Hacker News, emphasizing the technical achievement of 100% local WASM processing and non-destructive layering.
- **CDN:** Deploy via Vercel for global edge delivery of static assets and WASM bundles.
- **PWA:** Service Workers ensure the app loads instantly offline after the first visit.

---

## 8. Testing Strategy & Accessibility Checklist

- **Testing:** Unit Tests (Vitest) for engines/DB; E2E Tests (Playwright) for UI workflows.
- **Accessibility:** Radix UI ensures ARIA compliance. High contrast modes and keyboard navigation for all canvas tools.
