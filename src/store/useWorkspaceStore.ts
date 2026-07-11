import { create } from "zustand";

export interface FileLayer {
  id: string;
  fileId: string;
  name: string;
  visible: boolean;
  locked: boolean;
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
  setActiveLayerId: (id) => set({ activeLayerId: id }),
}));
