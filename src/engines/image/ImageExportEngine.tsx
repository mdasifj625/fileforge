import React from "react";
import { IExportEngine } from "../types";
import { ImageExportUI } from "./ImageExportUI";

export class ImageExportEngine implements IExportEngine {
  id = "image";

  getUI(onClose: () => void): React.ReactNode {
    return <ImageExportUI onClose={onClose} />;
  }
}

export const imageExportEngine = new ImageExportEngine();
