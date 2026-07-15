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
  category: "image" | "pdf" | "video" | "audio" | "utility";
  description: string;
  workerAction?: string; // e.g. "processImage", "extractText"
  params: UIParam[];
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
    params: [],
  },
  sepia: {
    id: "sepia",
    name: "Sepia Filter",
    category: "image",
    description: "Apply a sepia tone to your image.",
    workerAction: "processImage",
    params: [],
  },
  invert: {
    id: "invert",
    name: "Invert Colors",
    category: "image",
    description: "Invert all colors in your image.",
    workerAction: "processImage",
    params: [],
  },
  solarize: {
    id: "solarize",
    name: "Solarize Filter",
    category: "image",
    description: "Apply a solarize effect to your image.",
    workerAction: "processImage",
    params: [],
  },
  resize: {
    id: "resize",
    name: "Resize Image",
    category: "image",
    description: "Resize your image by scaling its dimensions.",
    workerAction: "processImage",
    params: [
      {
        key: "scale",
        label: "Scale (%)",
        type: "slider",
        min: 10,
        max: 500,
        defaultValue: 100,
        step: 1,
        description: "Scale the image proportionally as a percentage.",
      },
    ],
  },
  // We can scale this effortlessly to the 100+ tools mapped out
};
