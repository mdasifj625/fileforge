import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  compress: {
    title: "Video Compressor",
    description: "Compress video files without losing quality using WASM.",
  },
  trim: {
    title: "Trim Video",
    description: "Cut and trim video files locally in your browser.",
  },
  convert: {
    title: "Video Converter",
    description: "Convert videos to MP4, WebM, or GIF format instantly.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default async function VideoToolPage({
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
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/video/${k}` }));

  return (
    <ToolPageLayout
      toolId={`video-${resolvedParams.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="video"
      relatedTools={relatedTools}
    />
  );
}
