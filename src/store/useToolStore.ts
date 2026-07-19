import { create } from "zustand";

interface ToolState {
  activeTool: string | null;
  toolParams: Record<string, unknown>;
  brushMode: "none" | "restore" | "erase";
  brushSize: number;
  zoom: number;
  theme: "light" | "dark" | "system";

  setActiveTool: (tool: string | null) => void;
  setToolParam: (key: string, value: unknown) => void;
  resetToolParams: () => void;
  setBrushMode: (mode: "none" | "restore" | "erase") => void;
  setBrushSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  reset: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: null,
  toolParams: {},
  brushMode: "none",
  brushSize: 20,
  zoom: 100,
  theme: "system",

  setActiveTool: (tool) => set({ activeTool: tool, toolParams: {} }),
  setToolParam: (key, value) =>
    set((state) => ({ toolParams: { ...state.toolParams, [key]: value } })),
  resetToolParams: () => set({ toolParams: {} }),
  setBrushMode: (mode) => set({ brushMode: mode }),
  setBrushSize: (size) => set({ brushSize: size }),
  setZoom: (zoom) => set({ zoom }),
  setTheme: (theme) => set({ theme }),

  reset: () =>
    set({
      brushMode: "none",
      brushSize: 20,
      zoom: 100,
      toolParams: {},
    }),
}));
