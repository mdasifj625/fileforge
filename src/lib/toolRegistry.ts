import React from "react";
import { Layer } from "@/types/layer";
import { removeBackgroundTool } from "@/features/RemoveBackground";
import { ocrTool } from "@/features/OCR";
import { cropTool } from "@/features/Crop";
import { resizeTool } from "@/features/Resize";
import { watermarkTool } from "@/features/Watermark";
import { appearanceTool } from "@/features/Appearance";
import { profilePictureTool } from "@/features/ProfilePicture";
import { compressTool, videoCompressTool } from "@/features/Compress";
import { convertTool, videoConvertTool } from "@/features/Convert";
import { videoTrimTool } from "@/features/VideoTrim";
import {
  audioTrimTool,
  audioMergeTool,
  audioConvertTool,
  audioAdjustTool,
} from "@/features/Audio";

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

export type SurfaceType = "image-canvas" | "pdf-canvas" | "form";

export interface ToolDefinition {
  id: string;
  name: string;
  category: "image" | "pdf" | "video" | "audio" | "utility" | "ai" | "convert";
  surfaceType?: SurfaceType;
  description: string;
  workerAction?: string;
  params: UIParam[];
  PropertiesComponent?: React.ComponentType<{ layer?: Layer }>;
  WorkspaceOverlayComponent?: React.ComponentType;
}

export const toolRegistry: Record<string, ToolDefinition> = {
  vintage: {
    id: "vintage",
    name: "Vintage Filter",
    category: "image",
    surfaceType: "image-canvas",
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
    surfaceType: "image-canvas",
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
    surfaceType: "image-canvas",
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
    surfaceType: "image-canvas",
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
    surfaceType: "image-canvas",
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

  compress: compressTool,
  "video-compress": videoCompressTool,
  convert: convertTool,
  "video-convert": videoConvertTool,
  "video-trim": videoTrimTool,
  "audio-trim": audioTrimTool,
  "audio-merge": audioMergeTool,
  "audio-convert": audioConvertTool,
  "audio-adjust": audioAdjustTool,
};
