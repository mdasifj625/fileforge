import { ToolDefinition } from "@/lib/toolRegistry";
import { ConvertSettings } from "@/features/Convert/ConvertSettings";

export const convertTool: ToolDefinition = {
  id: "convert",
  name: "Convert",
  category: "convert",
  surfaceType: "image-canvas",
  description: "Convert your file format.",
  params: [],
  PropertiesComponent: ConvertSettings,
};

export const videoConvertTool: ToolDefinition = {
  id: "video-convert",
  name: "Convert Video",
  category: "video",
  surfaceType: "image-canvas",
  description: "Convert your video file format.",
  params: [],
  PropertiesComponent: ConvertSettings,
};
