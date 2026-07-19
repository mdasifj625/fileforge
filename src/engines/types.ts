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

export interface IExportEngine {
  id: string;
  getUI: (onClose: () => void) => React.ReactNode;
}
