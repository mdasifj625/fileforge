import { useEffect } from "react";
import { CanvasRefs } from "../types";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

export function useCanvasExport({
  appRef,
  gridRef,
  transformOverlayRef,
}: CanvasRefs) {
  const exportTrigger = useWorkspaceStore((state) => state.exportTrigger);
  const activeTool = useWorkspaceStore((state) => state.activeTool);

  useEffect(() => {
    if (exportTrigger > 0 && appRef.current && activeTool !== "pdf-merge") {
      const app = appRef.current;
      const grid = gridRef.current;
      const overlay = transformOverlayRef.current;

      const wasGridVisible = grid?.visible;
      const wasOverlayVisible = overlay?.visible;

      if (grid) grid.visible = false;

      if (overlay) overlay.visible = false;

      // Force synchronous render to ensure the canvas doesn't have the grid/overlay
      app.renderer.render(app.stage);

      app.canvas.toBlob((blob) => {
        if (blob) {
          useWorkspaceStore.getState().setExportImageBlob(blob);
        }

        if (grid) grid.visible = wasGridVisible ?? true;

        if (overlay) overlay.visible = wasOverlayVisible ?? true;
        app.renderer.render(app.stage); // Render again to restore UI
      }, "image/png");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger, activeTool]);
}
