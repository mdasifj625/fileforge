import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const WatermarkSettings = dynamic(
  () =>
    import("@/features/Watermark/WatermarkSettings").then(
      (mod) => mod.WatermarkSettings,
    ),
  { ssr: false },
);

export const watermarkTool: ToolDefinition = {
  id: "pdf-watermark",
  name: "Watermark PDF",
  category: "pdf",
  description: "Add a custom text watermark to your PDF.",
  params: [],
  PropertiesComponent: WatermarkSettings,
};
