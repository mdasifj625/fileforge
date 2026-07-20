import { create } from "zustand";
import { Layer } from "@/types/layer";

interface HistoryState {
  layers: Layer[];
  activeLayerId: string | null;
}

interface LayerState {
  past: HistoryState[];
  future: HistoryState[];
  layers: Layer[];
  activeLayerId: string | null;
  isHydrated: boolean;

  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  replaceLayer: (id: string, newLayer: Layer) => void;
  updateLayerTransform: (
    id: string,
    transform: Partial<Layer>,
    saveToHistory?: boolean,
  ) => void;
  setActiveLayerId: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  hydrateLayers: () => void;
  reset: () => void;
}

const saveHistory = (
  state: LayerState,
  newLayers: Layer[],
  newActiveId?: string | null,
) => {
  return {
    past: [
      ...state.past,
      { layers: state.layers, activeLayerId: state.activeLayerId },
    ],
    future: [],
    layers: newLayers,
    activeLayerId:
      newActiveId !== undefined ? newActiveId : state.activeLayerId,
  };
};

const getInitialLayers = (): Layer[] => {
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

export const useLayerStore = create<LayerState>((set) => ({
  past: [],
  future: [],
  layers: [],
  activeLayerId: null,
  isHydrated: false,

  hydrateLayers: () => {
    // Note: If old session storage data does not conform to the new Layer Discriminated Union,
    // it will be loaded here but might lack the 'type' field.
    // We intentionally let this fail gracefully or be wiped by startOver per the plan.
    set({
      layers: getInitialLayers(),
      activeLayerId: getInitialActiveLayerId(),
      isHydrated: true,
    });
  },

  addLayer: (layer) =>
    set((state) => saveHistory(state, [layer, ...state.layers], layer.id)),

  removeLayer: (id) =>
    set((state) =>
      saveHistory(
        state,
        state.layers.filter((l) => l.id !== id),
        state.activeLayerId === id ? null : state.activeLayerId,
      ),
    ),

  replaceLayer: (id, newLayer) =>
    set((state) =>
      saveHistory(
        state,
        state.layers.map((l) => (l.id === id ? newLayer : l)),
        state.activeLayerId === id ? newLayer.id : state.activeLayerId,
      ),
    ),

  updateLayerTransform: (id, transform, saveToHistory = true) =>
    set((state) => {
      const newLayers = state.layers.map((layer) =>
        layer.id === id ? ({ ...layer, ...transform } as Layer) : layer,
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
        future: [
          { layers: state.layers, activeLayerId: state.activeLayerId },
          ...state.future,
        ],
        layers: previous.layers,
        activeLayerId: previous.activeLayerId,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [
          ...state.past,
          { layers: state.layers, activeLayerId: state.activeLayerId },
        ],
        future: newFuture,
        layers: next.layers,
        activeLayerId: next.activeLayerId,
      };
    }),

  reset: () =>
    set({
      layers: [],
      past: [],
      future: [],
      activeLayerId: null,
    }),
}));

if (typeof window !== "undefined") {
  useLayerStore.subscribe((state) => {
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
