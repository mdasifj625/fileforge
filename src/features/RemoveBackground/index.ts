import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

import { ImageLayer } from "@/types/layer";

const BackgroundRemovalSettings = dynamic(
  () =>
    import("@/features/RemoveBackground/BackgroundRemovalSettings").then(
      (mod) => mod.BackgroundRemovalSettings,
    ),
  { ssr: false },
);

export const removeBackgroundTool: ToolDefinition = {
  id: "ai-remove-background",
  name: "Remove Background",
  category: "image",
  surfaceType: "image-canvas",
  showTransformOverlay: true,
  enableCropOverlay: (layer) => {
    return !!(layer as ImageLayer).isAiBackgroundRemoved;
  },
  allowRotation: false,
  description: "Automatically remove the background from an image using AI.",
  params: [],
  PropertiesComponent: BackgroundRemovalSettings,
};
