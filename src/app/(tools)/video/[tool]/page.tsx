import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";
import { TOOL_MENUS } from "@/config/tools";

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
  "extract-audio": {
    title: "Extract Audio",
    description: "Extract audio tracks from video files.",
  },
  "gif-creator": {
    title: "GIF Creator",
    description: "Create animated GIFs from your videos.",
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

  const categoryMenu = TOOL_MENUS.find(
    (m) => m.title.toLowerCase() === "video",
  );
  const relatedTools = categoryMenu
    ? categoryMenu.items
        .filter((item) => !item.href.endsWith(`/${resolvedParams.tool}`))
        .slice(0, 5)
        .map((item) => ({ title: item.name, href: item.href }))
    : [];

  return (
    <ToolPageLayout
      toolId={resolvedParams.tool}
      title={toolData.title}
      category="video"
      relatedTools={relatedTools}
    />
  );
}
