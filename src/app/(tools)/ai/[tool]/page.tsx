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

export default async function AIToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const resolvedParams = await params;
  const toolData = VALID_TOOLS[resolvedParams.tool];

  if (!toolData) {
    notFound();
  }

  const relatedTools = Object.keys(VALID_TOOLS)
    .filter((k) => k !== resolvedParams.tool)
    .slice(0, 5)
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/ai/${k}` }));

  return (
    <ToolPageLayout
      toolId={`ai-${resolvedParams.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="ai"
      relatedTools={relatedTools}
    />
  );
}
