import { ToolDefinition } from "@/lib/toolRegistry";
import { AudioSettings } from "@/features/Audio/AudioSettings";

export const audioTrimTool: ToolDefinition = {
  id: "audio-trim",
  name: "Trim Audio",
  category: "audio",
  description: "Trim your audio file.",
  params: [],
  PropertiesComponent: AudioSettings,
};

export const audioMergeTool: ToolDefinition = {
  id: "audio-merge",
  name: "Merge Audio",
  category: "audio",
  description: "Merge audio files.",
  params: [],
  PropertiesComponent: AudioSettings,
};

export const audioConvertTool: ToolDefinition = {
  id: "audio-convert",
  name: "Convert Audio",
  category: "audio",
  description: "Convert your audio file.",
  params: [],
  PropertiesComponent: AudioSettings,
};

export const audioAdjustTool: ToolDefinition = {
  id: "audio-adjust",
  name: "Volume & Speed",
  category: "audio",
  description: "Adjust audio volume and speed.",
  params: [],
  PropertiesComponent: AudioSettings,
};
