import { create } from "zustand";

interface ToolState {
  activeTool: string | null;
  brushMode: "none" | "restore" | "erase";
  brushSize: number;
  zoom: number;
  theme: "light" | "dark" | "system";

  setActiveTool: (tool: string | null) => void;
  setBrushMode: (mode: "none" | "restore" | "erase") => void;
  setBrushSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  reset: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: null,
  brushMode: "none",
  brushSize: 20,
  zoom: 100,
  theme: "system",

  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushMode: (mode) => set({ brushMode: mode }),
  setBrushSize: (size) => set({ brushSize: size }),
  setZoom: (zoom) => set({ zoom }),
  setTheme: (theme) => set({ theme }),

  reset: () =>
    set({
      brushMode: "none",
      brushSize: 20,
      zoom: 100,
    }),
}));
