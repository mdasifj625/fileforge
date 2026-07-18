import dynamic from "next/dynamic";
import { ToolDefinition } from "@/lib/toolRegistry";

const OCRSettings = dynamic(
  () => import("@/features/OCR/OCRSettings").then((mod) => mod.OCRSettings),
  { ssr: false },
);

export const ocrTool: ToolDefinition = {
  id: "ai-ocr",
  name: "Extract Text",
  category: "ai",
  description: "Extract text from an image using AI (OCR).",
  params: [],
  PropertiesComponent: OCRSettings,
};
