import "@testing-library/jest-dom";

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated
    removeListener: () => {}, // Deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock crypto.randomUUID
if (!global.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).crypto = {};
}
let uuidCounter = 0;
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => {
    uuidCounter += 1;
    const str = uuidCounter.toString(16).padStart(12, "0");
    return `00000000-0000-4000-8000-${str}`;
  };
}
