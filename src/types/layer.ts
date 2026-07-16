export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

export interface BaseLayer {
  id: string;
  fileId: string;
  originalFileId?: string; // Tracks the original file for "Original" filter restore
  name: string;
  visible: boolean;
  locked: boolean;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  originalWidth: number;
  originalHeight: number;
  opacity?: number;
  blendMode?: BlendMode;
  type: "image" | "pdf" | "video" | "audio";
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  maskFileId?: string;
  cropRect?: { x: number; y: number; width: number; height: number };
  cropAspectRatio?: number | "original" | "free" | null;
  isAiBackgroundRemoved?: boolean;
}

export interface PDFLayer extends BaseLayer {
  type: "pdf";
  pageOrder?: number[]; // For reordering pages within a PDF layer
  watermarkText?: string | null;
}

export interface VideoLayer extends BaseLayer {
  type: "video";
  // Add video specific fields here
}

export interface AudioLayer extends BaseLayer {
  type: "audio";
  // Add audio specific fields here
}

export type Layer = ImageLayer | PDFLayer | VideoLayer | AudioLayer;
