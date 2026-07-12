import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  "jpg-to-png": {
    title: "JPG to PNG",
    description: "Convert JPG images to PNG.",
  },
  "png-to-webp": {
    title: "PNG to WebP",
    description: "Convert PNG images to WebP.",
  },
  "webp-to-png": {
    title: "WebP to PNG",
    description: "Convert WebP images to PNG.",
  },
  "pdf-to-word": {
    title: "PDF to Word",
    description: "Convert PDF documents to Word.",
  },
  "word-to-pdf": {
    title: "Word to PDF",
    description: "Convert Word documents to PDF.",
  },
  "excel-to-pdf": {
    title: "Excel to PDF",
    description: "Convert Excel spreadsheets to PDF.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default function ConvertToolPage({
  params,
}: {
  params: { tool: string };
}) {
  const toolData = VALID_TOOLS[params.tool];

  if (!toolData) {
    notFound();
  }

  const relatedTools = Object.keys(VALID_TOOLS)
    .filter((k) => k !== params.tool)
    .slice(0, 5)
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/convert/${k}` }));

  return (
    <ToolPageLayout
      toolId={`convert-${params.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="convert"
      relatedTools={relatedTools}
    />
  );
}
