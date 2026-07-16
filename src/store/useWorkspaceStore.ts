import { create } from "zustand";

export interface FileLayer {
  id: string;
  fileId: string;
  originalFileId?: string; // Tracks the original file for "Original" filter restore
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
  pageOrder?: number[]; // For reordering pages within a PDF layer
  watermarkText?: string | null;
  maskFileId?: string;
  cropRect?: { x: number; y: number; width: number; height: number };
  cropAspectRatio?: number | "original" | "free" | null;
  opacity?: number;
  isAiBackgroundRemoved?: boolean;
  blendMode?:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
    | "hue"
    | "saturation"
    | "color"
    | "luminosity";
}

export interface WorkspaceState {
  past: FileLayer[][];
  future: FileLayer[][];
  activeTool: string | null;
  zoom: number;
  theme: "light" | "dark" | "system";
  layers: FileLayer[];
  activeLayerId: string | null;
  exportTrigger: number;
  exportImageBlob: Blob | null;

  setActiveTool: (tool: string | null) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addLayer: (layer: FileLayer) => void;
  removeLayer: (id: string) => void;
  replaceLayer: (id: string, newLayer: FileLayer) => void;
  updateLayerTransform: (
    id: string,
    transform: Partial<FileLayer>,
    saveToHistory?: boolean,
  ) => void;
  setActiveLayerId: (id: string | null) => void;
  triggerExport: () => void;
  setExportImageBlob: (blob: Blob | null) => void;
  brushMode: "none" | "restore" | "erase";
  setBrushMode: (mode: "none" | "restore" | "erase") => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  undo: () => void;
  redo: () => void;
  isRemovingBackground: boolean;
  setIsRemovingBackground: (val: boolean) => void;
  aiProgress: number | null;
  setAiProgress: (val: number | null) => void;
  aiProgressPhase: "model" | "inference" | null;
  setAiProgressPhase: (val: "model" | "inference" | null) => void;
  aiProgressBackend: string | null;
  setAiProgressBackend: (val: string | null) => void;
  bgRemovalSuccessTrigger: number;
  triggerBgRemovalSuccess: () => void;
  bgRemovalDuration: number | null;
  setBgRemovalDuration: (val: number | null) => void;
  isHydrated: boolean;
  hydrateLayers: () => void;
  startOver: () => void;
}

const saveHistory = (state: WorkspaceState, newLayers: FileLayer[]) => {
  return {
    past: [...state.past, state.layers],
    future: [],
    layers: newLayers,
  };
};

const getInitialLayers = (): FileLayer[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem("fileforge_layers");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getInitialActiveLayerId = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("fileforge_active_layer_id");
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  past: [],
  future: [],
  activeTool: null,
  zoom: 100,
  theme: "system",
  layers: [],
  activeLayerId: null,
  exportTrigger: 0,
  exportImageBlob: null,
  brushMode: "none",
  brushSize: 20,
  isRemovingBackground: false,
  aiProgress: null,
  aiProgressPhase: null,
  aiProgressBackend: null,
  bgRemovalSuccessTrigger: 0,
  bgRemovalDuration: null,
  isHydrated: false,

  setIsRemovingBackground: (val) => set({ isRemovingBackground: val }),
  setAiProgress: (val) => set({ aiProgress: val }),
  setAiProgressPhase: (val) => set({ aiProgressPhase: val }),
  setAiProgressBackend: (val) => set({ aiProgressBackend: val }),
  triggerBgRemovalSuccess: () =>
    set((state) => ({
      bgRemovalSuccessTrigger: state.bgRemovalSuccessTrigger + 1,
    })),
  setBgRemovalDuration: (val) => set({ bgRemovalDuration: val }),
  hydrateLayers: () =>
    set({
      layers: getInitialLayers(),
      activeLayerId: getInitialActiveLayerId(),
      isHydrated: true,
    }),
  startOver: () => {
    // Clear all persisted storage synchronously first, so no stale data
    // can be re-hydrated if the component re-mounts immediately after.
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fileforge_layers");
      sessionStorage.removeItem("fileforge_active_layer_id");
    }

    // Wipe both IndexedDB tables — files (blobs) and history (cached operations).
    // Both .clear() calls are fire-and-forget; errors are logged but won't block the UI.
    import("@/db").then(({ db }) => {
      Promise.all([db.files.clear(), db.history.clear()]).catch((err) =>
        console.error("[startOver] Failed to clear DB:", err),
      );
    });

    // Reset ALL in-memory state to initial values — no stale fields left behind.
    set({
      // Canvas / layers
      layers: [],
      activeLayerId: null,
      past: [],
      future: [],

      // Export
      exportTrigger: 0,
      exportImageBlob: null,

      // Brush / mask
      brushMode: "none",
      brushSize: 20,

      // AI background removal
      isRemovingBackground: false,
      aiProgress: null,
      aiProgressPhase: null,
      aiProgressBackend: null,
      bgRemovalDuration: null,
    });
  },
  setBrushMode: (mode) => set({ brushMode: mode }),
  setBrushSize: (size) => set({ brushSize: size }),
  triggerExport: () =>
    set((state) => ({ exportTrigger: state.exportTrigger + 1 })),
  setExportImageBlob: (blob) => set({ exportImageBlob: blob }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setTheme: (theme) => set({ theme }),
  addLayer: (layer) =>
    set((state) => ({
      ...saveHistory(state, [layer, ...state.layers]),
      activeLayerId: layer.id,
    })),
  removeLayer: (id) =>
    set((state) => ({
      ...saveHistory(
        state,
        state.layers.filter((l) => l.id !== id),
      ),
      activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
    })),
  replaceLayer: (id, newLayer) =>
    set((state) => ({
      ...saveHistory(
        state,
        state.layers.map((l) => (l.id === id ? newLayer : l)),
      ),
      activeLayerId:
        state.activeLayerId === id ? newLayer.id : state.activeLayerId,
    })),
  updateLayerTransform: (id, transform, saveToHistory = true) =>
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...transform } : layer,
      );
      if (saveToHistory) {
        return saveHistory(state, newLayers);
      }
      return { layers: newLayers };
    }),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        future: [state.layers, ...state.future],
        layers: previous,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.layers],
        future: newFuture,
        layers: next,
      };
    }),
}));

if (typeof window !== "undefined") {
  useWorkspaceStore.subscribe((state) => {
    if (!state.isHydrated) return;
    try {
      sessionStorage.setItem("fileforge_layers", JSON.stringify(state.layers));
      if (state.activeLayerId) {
        sessionStorage.setItem(
          "fileforge_active_layer_id",
          state.activeLayerId,
        );
      } else {
        sessionStorage.removeItem("fileforge_active_layer_id");
      }
    } catch {
      // ignore
    }
  });
}
