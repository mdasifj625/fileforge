import { create } from "zustand";

export interface FileLayer {
  id: string;
  fileId: string;
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
  // cropRect stores the cropped region relative to the original image dimensions
  cropRect?: { x: number; y: number; width: number; height: number };
  cropAspectRatio?: number | "original" | "free" | null;
}

export interface WorkspaceState {
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
  updateLayerTransform: (id: string, transform: Partial<FileLayer>) => void;
  setActiveLayerId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
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
      layers: [layer, ...state.layers],
      activeLayerId: layer.id,
    })),
  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
    })),
  updateLayerTransform: (id, transform) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, ...transform } : layer,
      ),
    })),
  setActiveLayerId: (id) => set({ activeLayerId: id }),
}));
