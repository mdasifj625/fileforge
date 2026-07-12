import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  compress: {
    title: "Compress Video",
    description: "Reduce video file size without losing quality.",
  },
  trim: { title: "Trim Video", description: "Cut and trim video length." },
  convert: {
    title: "Convert Video",
    description: "Convert video to MP4, WebM, and more.",
  },
  crop: {
    title: "Crop Video",
    description: "Crop video dimensions and aspect ratio.",
  },
  resize: { title: "Resize Video", description: "Change video resolution." },
  gif: {
    title: "Video to GIF",
    description: "Convert video clips to animated GIFs.",
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
