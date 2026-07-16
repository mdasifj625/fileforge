import { create } from "zustand";

interface ToolState {
  activeTool: string | null;
  brushMode: "none" | "restore" | "erase";
  brushSize: number;

  setActiveTool: (tool: string | null) => void;
  setBrushMode: (mode: "none" | "restore" | "erase") => void;
  setBrushSize: (size: number) => void;
  reset: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  activeTool: null,
  brushMode: "none",
  brushSize: 20,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushMode: (mode) => set({ brushMode: mode }),
  setBrushSize: (size) => set({ brushSize: size }),

  reset: () =>
    set({
      brushMode: "none",
      brushSize: 20,
    }),
}));
