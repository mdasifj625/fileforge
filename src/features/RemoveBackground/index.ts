import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const BackgroundRemovalSettings = dynamic(
  () => import("./BackgroundRemovalSettings").then(mod => mod.BackgroundRemovalSettings),
  { ssr: false }
);

export const removeBackgroundTool: ToolDefinition = {
  id: "ai-remove-background",
  name: "Remove Background",
  category: "image",
  description: "Automatically remove the background from an image using AI.",
  params: [],
  PropertiesComponent: BackgroundRemovalSettings,
};
