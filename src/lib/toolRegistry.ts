import React from "react";
import { Layer } from "@/types/layer";
import { removeBackgroundTool } from "@/features/RemoveBackground";
import { ocrTool } from "@/features/OCR";
import { cropTool } from "@/features/Crop";
import { resizeTool } from "@/features/Resize";
import { watermarkTool } from "@/features/Watermark";
import { appearanceTool } from "@/features/Appearance";
import { profilePictureTool } from "@/features/ProfilePicture";

export type UIParamType = "slider" | "toggle" | "select" | "button";

export interface UIParam {
  key: string;
  label: string;
  type: UIParamType;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string }[];
  description?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: "image" | "pdf" | "video" | "audio" | "utility" | "ai" | "convert";
  description: string;
  workerAction?: string; // e.g. "processImage", "extractText"
  params: UIParam[];
  PropertiesComponent?: React.ComponentType<{ layer?: Layer }>;
  WorkspaceOverlayComponent?: React.ComponentType;
}

export const toolRegistry: Record<string, ToolDefinition> = {
  vintage: {
    id: "vintage",
    name: "Vintage Filter",
    category: "image",
    description: "Apply a vintage effect to your image.",
    workerAction: "processImage",
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
    ],
  },
  grayscale: {
    id: "grayscale",
    name: "Grayscale Filter",
    category: "image",
    description: "Convert your image to black and white.",
    workerAction: "processImage",
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 100,
        defaultValue: 100,
      },
    ],
  },
  sepia: {
    id: "sepia",
    name: "Sepia Filter",
    category: "image",
    description: "Apply a sepia tone to your image.",
    workerAction: "processImage",
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 100,
        defaultValue: 100,
      },
    ],
  },
  invert: {
    id: "invert",
    name: "Invert Colors",
    category: "image",
    description: "Invert all colors in your image.",
    workerAction: "processImage",
    params: [
      {
        key: "intensity",
        label: "Intensity",
        type: "slider",
        min: 0,
        max: 100,
        defaultValue: 100,
      },
    ],
  },
  solarize: {
    id: "solarize",
    name: "Solarize Filter",
    category: "image",
    description: "Apply a solarize effect to your image.",
    workerAction: "processImage",
    params: [
      {
        key: "threshold",
        label: "Threshold",
        type: "slider",
        min: 0,
        max: 255,
        defaultValue: 127,
      },
    ],
  },
  "ai-remove-background": removeBackgroundTool,
  "ai-ocr": ocrTool,
  crop: cropTool,
  resize: resizeTool,
  "pdf-watermark": watermarkTool,
  appearance: appearanceTool,
  "profile-picture": profilePictureTool,
  // We can scale this effortlessly to the 100+ tools mapped out
};
