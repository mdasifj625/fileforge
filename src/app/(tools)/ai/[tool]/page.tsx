import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  ocr: {
    title: "Extract Text (OCR)",
    description: "Extract text from images and documents.",
  },
  "face-detection": {
    title: "Face Detection",
    description: "Detect and highlight faces in images.",
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
      category="ai"
      relatedTools={relatedTools}
    />
  );
}
