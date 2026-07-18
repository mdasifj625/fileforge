import { ToolDefinition } from "@/lib/toolRegistry";
import { VideoTrimSettings } from "@/features/VideoTrim/VideoTrimSettings";

export const videoTrimTool: ToolDefinition = {
  id: "video-trim",
  name: "Trim Video",
  category: "video",
  description: "Trim your video file.",
  params: [],
  PropertiesComponent: VideoTrimSettings,
};
