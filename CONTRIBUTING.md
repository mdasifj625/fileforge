# Contributing to File Forge

Thank you for your interest in File Forge! We welcome contributions to make the premier browser-based media editor even better.

## Development Setup

1. **Prerequisites**: Node.js v18+ and Yarn (v1.22+).
2. **Install**: Run `yarn install` to fetch dependencies.
3. **Environment**: Copy `.env.local.example` to `.env.local`.
4. **Dev Server**: Run `yarn dev` to launch the Next.js server locally.

## Development Guidelines

1. **Strict TypeScript**: We enforce a zero `any` policy. All new files must pass `yarn tsc --noEmit`.
2. **ESLint**: Run `yarn lint` to ensure code style compliance before opening a PR.
3. **Component Size Limits**: We strictly prohibit monolithic components. Complex logic should reside in custom hooks (`useFeature.ts`) and large components must be split into sub-components.
4. **Zero-Lag React**: When dealing with the PixiJS canvas, you MUST NOT trigger React state updates inside a `pointermove` or `mousemove` loop. Use `useLayerStore.subscribe()` for 60fps operations.

## Architecture

Please read [ARCHITECTURE.md](./ARCHITECTURE.md) to familiarize yourself with the PixiJS pipeline, the Web Worker orchestration, and the modular Zustand state.

## Submitting Pull Requests

1. Fork the repository and create a feature branch (`feat/your-feature` or `fix/your-fix`).
2. Write clear, descriptive commit messages.
3. Test your changes locally to ensure no performance regressions occur in the canvas editor.
4. Submit a Pull Request targeting the `main` branch. Provide screenshots or screen recordings of any UI changes.

We look forward to reviewing your PR!
