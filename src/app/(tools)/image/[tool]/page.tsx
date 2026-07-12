import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

// Define the valid tools for this category to prevent 404s
const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  compress: {
    title: "Compress Image",
    description: "Reduce image file size with minimal quality loss.",
  },
  resize: { title: "Resize Image", description: "Change image dimensions." },
  crop: {
    title: "Crop Image",
    description: "Crop and extract parts of an image.",
  },
  rotate: { title: "Rotate Image", description: "Rotate or flip images." },
  convert: {
    title: "Convert Image",
    description: "Change image format (e.g. PNG to JPG).",
  },
  "remove-background": {
    title: "Remove Background",
    description: "Automatically remove backgrounds using AI.",
  },
  "blur-background": {
    title: "Blur Background",
    description: "Apply a depth-of-field blur to your image.",
  },
  watermark: {
    title: "Add Watermark",
    description: "Stamp your images with a logo or text.",
  },
  metadata: { title: "Edit Metadata", description: "View or strip EXIF data." },
  compare: {
    title: "Compare Images",
    description: "Side-by-side visual difference tool.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default function ImageToolPage({
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
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/image/${k}` }));

  return (
    <ToolPageLayout
      toolId={params.tool}
      title={toolData.title}
      description={toolData.description}
      category="image"
      relatedTools={relatedTools}
    />
  );
}
