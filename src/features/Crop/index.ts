import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const CropSettings = dynamic(
  () => import("@/features/Crop/CropSettings").then((mod) => mod.CropSettings),
  { ssr: false },
);

export const cropTool: ToolDefinition = {
  id: "crop",
  name: "Crop Image",
  category: "image",
  surfaceType: "image-canvas",
  showTransformOverlay: true,
  description: "Crop and resize the image canvas with Smart Crop support.",
  params: [],
  PropertiesComponent: CropSettings,
};
