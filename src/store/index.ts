import { useLayerStore } from "./useLayerStore";
import { useToolStore } from "./useToolStore";
import { useAIStore } from "./useAIStore";
import { useExportStore } from "./useExportStore";

export const useWorkspaceActions = () => {
  const startOver = () => {
    // Clear all persisted storage synchronously first
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fileforge_layers");
      sessionStorage.removeItem("fileforge_active_layer_id");
    }

    // Wipe both IndexedDB tables — files (blobs) and history (cached operations).
    import("@/db").then(({ db }) => {
      Promise.all([db.files.clear(), db.history.clear()]).catch((err) =>
        console.error("[startOver] Failed to clear DB:", err),
      );
    });

    // Reset ALL in-memory state across all independent stores
    useLayerStore.getState().reset();
    useToolStore.getState().reset();
    useAIStore.getState().reset();
    useExportStore.getState().reset();
  };

  return { startOver };
};

// Re-export stores for convenience if needed
export { useLayerStore, useToolStore, useAIStore, useExportStore };
