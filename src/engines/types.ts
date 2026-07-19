import React from "react";
import { Layer } from "@/types/layer";

export interface ExportResult {
  blob: Blob;
  filename: string;
  extension: string;
}

export interface WorkspaceState {
  layers: Layer[];
  activeLayerId: string | null;
  // Expand with other necessary state properties
}

export interface IExportEngine<TOptions = Record<string, unknown>> {
  id: string; // e.g., 'image' | 'pdf'
  getOptionsUI: (
    currentOptions: TOptions,
    setOptions: (opts: TOptions) => void,
  ) => React.ReactNode;
  execute: (
    state: WorkspaceState,
    options: TOptions,
    canvasRef?: unknown,
  ) => Promise<ExportResult>;
}
