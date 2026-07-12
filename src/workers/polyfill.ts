// Robust polyfill for transformers.js and onnxruntime-web DOM dependencies
// This MUST be imported before transformers.js to ensure top-level evaluations see it.

interface GlobalWithDOM {
  document: unknown;
  window: unknown;
}

if (typeof document === "undefined") {
  (globalThis as unknown as GlobalWithDOM).document = {
    createElement: (tag: string) => {
      if (tag === "canvas" || tag === "Canvas") {
        return new OffscreenCanvas(1, 1);
      }
      return {
        href: "",
        src: "",
        click: () => {},
        setAttribute: () => {},
        getContext: () => null,
      };
    },
    location: self.location,
    baseURI: self.location.href,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}

if (typeof window === "undefined") {
  (globalThis as unknown as GlobalWithDOM).window = globalThis;
  (
    (globalThis as unknown as GlobalWithDOM).window as {
      location: typeof self.location;
    }
  ).location = self.location;
}
