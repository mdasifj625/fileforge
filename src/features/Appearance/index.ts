import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const AppearanceSettings = dynamic(
  () =>
    import("@/features/Appearance/AppearanceSettings").then(
      (mod) => mod.AppearanceSettings,
    ),
  { ssr: false },
);

export const appearanceTool: ToolDefinition = {
  id: "appearance",
  name: "Layer Appearance",
  category: "image",
  description: "Adjust opacity and blend modes.",
  params: [],
  PropertiesComponent: AppearanceSettings,
};
