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
  cropRect?: { x: number; y: number; width: number; height: number };
  cropAspectRatio?: number | "original" | "free" | null;
}

export interface WorkspaceState {
  past: FileLayer[][];
  future: FileLayer[][];
  activeTool: string | null;
  zoom: number;
  theme: "light" | "dark" | "system";
  layers: FileLayer[];
  activeLayerId: string | null;

  setActiveTool: (tool: string | null) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  addLayer: (layer: FileLayer) => void;
  removeLayer: (id: string) => void;
  replaceLayer: (id: string, newLayer: FileLayer) => void;
  updateLayerTransform: (id: string, transform: Partial<FileLayer>) => void;
  setActiveLayerId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
}

const saveHistory = (state: WorkspaceState, newLayers: FileLayer[]) => {
  return {
    past: [...state.past, state.layers],
    future: [],
    layers: newLayers,
  };
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  past: [],
  future: [],
  activeTool: null,
  zoom: 100,
  theme: "system",
  layers: [],
  activeLayerId: null,

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
  updateLayerTransform: (id, transform) =>
    set((state) => ({
      ...saveHistory(
        state,
        state.layers.map((layer) =>
          layer.id === id ? { ...layer, ...transform } : layer,
        ),
      ),
    })),
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
