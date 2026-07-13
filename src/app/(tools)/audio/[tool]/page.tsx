import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  trim: { title: "Trim Audio", description: "Cut and trim audio length." },
  merge: {
    title: "Merge Audio",
    description: "Combine multiple audio files into one.",
  },
  convert: {
    title: "Convert Audio",
    description: "Convert audio formats like MP3, WAV, AAC.",
  },
  normalize: {
    title: "Normalize Audio",
    description: "Adjust audio volume to a standard level.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default async function AudioToolPage({
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
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/audio/${k}` }));

  return (
    <ToolPageLayout
      toolId={resolvedParams.tool}
      title={toolData.title}
      category="audio"
      relatedTools={relatedTools}
    />
  );
}
