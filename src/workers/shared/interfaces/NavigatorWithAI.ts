export interface NavigatorWithAI {
  gpu?: {
    requestAdapter: () => Promise<{
      info?: { vendor?: string; architecture?: string; description?: string };
      limits?: { maxBufferSize?: number; maxStorageBufferBindingSize?: number };
      features?: { has: (feature: string) => boolean };
    } | null>;
  };
  ml?: unknown;
}
