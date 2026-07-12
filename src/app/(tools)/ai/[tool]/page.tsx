import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  "remove-background": {
    title: "Remove Background",
    description: "AI powered background removal.",
  },
  "image-upscale": {
    title: "Image Upscale",
    description: "Upscale images without losing quality.",
  },
  "magic-eraser": {
    title: "Magic Eraser",
    description: "Remove unwanted objects from images.",
  },
  ocr: {
    title: "Extract Text (OCR)",
    description: "Extract text from images and documents.",
  },
  "summarize-pdf": {
    title: "Summarize PDF",
    description: "Get key points and summary of large PDFs.",
  },
  "translate-document": {
    title: "Translate Document",
    description: "Translate documents keeping layout intact.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default function AIToolPage({ params }: { params: { tool: string } }) {
  const toolData = VALID_TOOLS[params.tool];

  if (!toolData) {
    notFound();
  }

  const relatedTools = Object.keys(VALID_TOOLS)
    .filter((k) => k !== params.tool)
    .slice(0, 5)
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/ai/${k}` }));

  return (
    <ToolPageLayout
      toolId={`ai-${params.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="ai"
      relatedTools={relatedTools}
    />
  );
}
