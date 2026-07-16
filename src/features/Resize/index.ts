import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const ResizeSettings = dynamic(
  () => import("./ResizeSettings").then((mod) => mod.ResizeSettings),
  { ssr: false }
);

export const resizeTool: ToolDefinition = {
  id: "resize",
  name: "Resize Image",
  category: "image",
  description: "Resize your image by scaling its dimensions.",
  params: [],
  PropertiesComponent: ResizeSettings,
};
