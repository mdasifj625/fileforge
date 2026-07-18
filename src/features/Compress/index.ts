import { ToolDefinition } from "@/lib/toolRegistry";
import { CompressSettings } from "@/features/Compress/CompressSettings";

export const compressTool: ToolDefinition = {
  id: "compress",
  name: "Compress",
  category: "image",
  description: "Compress your image file size.",
  params: [],
  PropertiesComponent: CompressSettings,
};

export const videoCompressTool: ToolDefinition = {
  id: "video-compress",
  name: "Compress Video",
  category: "video",
  description: "Compress your video file size.",
  params: [],
  PropertiesComponent: CompressSettings,
};
