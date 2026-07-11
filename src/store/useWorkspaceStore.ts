import { create } from "zustand";

export interface WorkspaceState {
  activeTool: string | null;
  zoom: number;
  theme: "light" | "dark" | "system";
  setActiveTool: (tool: string | null) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeTool: null,
  zoom: 100,
  theme: "system",
  setActiveTool: (tool) => set({ activeTool: tool }),
  setZoom: (zoom) => set({ zoom }),
  setTheme: (theme) => set({ theme }),
}));
