import { IExportEngine } from "./types";
import { toolRegistry } from "@/lib/toolRegistry";
import { useToolStore } from "@/store/useToolStore";

class ExportManager {
  private engines: Map<string, IExportEngine> = new Map();

  registerEngine(surfaceType: string, engine: IExportEngine) {
    this.engines.set(surfaceType, engine);
  }

  getActiveEngine(): IExportEngine | null {
    const activeTool = useToolStore.getState().activeTool;
    if (!activeTool) return null;
    const surfaceType = toolRegistry[activeTool]?.surfaceType;
    if (!surfaceType) return null;
    return this.engines.get(surfaceType) || null;
  }
}

export const exportManager = new ExportManager();

import { imageExportEngine } from "./image/ImageExportEngine";
exportManager.registerEngine("image-canvas", imageExportEngine);
