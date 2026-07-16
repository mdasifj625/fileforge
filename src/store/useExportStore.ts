import { create } from "zustand";

interface ExportState {
  exportTrigger: number;
  exportImageBlob: Blob | null;

  triggerExport: () => void;
  setExportImageBlob: (blob: Blob | null) => void;
  reset: () => void;
}

export const useExportStore = create<ExportState>((set) => ({
  exportTrigger: 0,
  exportImageBlob: null,

  triggerExport: () =>
    set((state) => ({ exportTrigger: state.exportTrigger + 1 })),
  setExportImageBlob: (blob) => set({ exportImageBlob: blob }),

  reset: () =>
    set({
      exportTrigger: 0,
      exportImageBlob: null,
    }),
}));
