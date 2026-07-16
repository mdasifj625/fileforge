import { create } from "zustand";

interface AIState {
  isRemovingBackground: boolean;
  aiProgress: number | null;
  aiProgressPhase: "model" | "inference" | null;
  aiProgressBackend: string | null;
  bgRemovalSuccessTrigger: number;
  bgRemovalDuration: number | null;

  setIsRemovingBackground: (val: boolean) => void;
  setAiProgress: (val: number | null) => void;
  setAiProgressPhase: (val: "model" | "inference" | null) => void;
  setAiProgressBackend: (val: string | null) => void;
  triggerBgRemovalSuccess: () => void;
  setBgRemovalDuration: (val: number | null) => void;
  reset: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  isRemovingBackground: false,
  aiProgress: null,
  aiProgressPhase: null,
  aiProgressBackend: null,
  bgRemovalSuccessTrigger: 0,
  bgRemovalDuration: null,

  setIsRemovingBackground: (val) => set({ isRemovingBackground: val }),
  setAiProgress: (val) => set({ aiProgress: val }),
  setAiProgressPhase: (val) => set({ aiProgressPhase: val }),
  setAiProgressBackend: (val) => set({ aiProgressBackend: val }),
  triggerBgRemovalSuccess: () =>
    set((state) => ({
      bgRemovalSuccessTrigger: state.bgRemovalSuccessTrigger + 1,
    })),
  setBgRemovalDuration: (val) => set({ bgRemovalDuration: val }),

  reset: () =>
    set({
      isRemovingBackground: false,
      aiProgress: null,
      aiProgressPhase: null,
      aiProgressBackend: null,
      bgRemovalDuration: null,
    }),
}));
