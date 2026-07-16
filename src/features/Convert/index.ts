import { ToolDefinition } from "@/lib/toolRegistry";
import { ConvertSettings } from "./ConvertSettings";

export const convertTool: ToolDefinition = {
  id: "convert",
  name: "Convert",
  category: "convert",
  description: "Convert your file format.",
  params: [],
  PropertiesComponent: ConvertSettings,
};

export const videoConvertTool: ToolDefinition = {
  id: "video-convert",
  name: "Convert Video",
  category: "video",
  description: "Convert your video file format.",
  params: [],
  PropertiesComponent: ConvertSettings,
};
