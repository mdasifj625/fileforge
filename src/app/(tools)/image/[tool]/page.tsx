import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";
import { getToolContent } from "@/lib/contentParser";
import { Metadata } from "next";

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
  "smart-crop": {
    title: "Smart Crop",
    description: "Automatically trim transparent or empty borders from images.",
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
  "magic-eraser": {
    title: "Magic Eraser",
    description: "Remove unwanted objects from images using AI.",
  },
  upscale: {
    title: "Image Upscale",
    description: "Upscale images to higher resolutions without quality loss.",
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const toolData = VALID_TOOLS[resolvedParams.tool];

  if (!toolData) {
    return {};
  }

  const contentData = getToolContent("image", resolvedParams.tool);
  const title = contentData?.seoTitle || `${toolData.title} - File Forge`;
  const description = contentData?.seoDescription || toolData.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function ImageToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const resolvedParams = await params;
  const toolData = VALID_TOOLS[resolvedParams.tool];

  if (!toolData) {
    notFound();
  }

  const contentData = getToolContent("image", resolvedParams.tool);
  const title = contentData?.title || toolData.title;

  const relatedTools = Object.keys(VALID_TOOLS)
    .filter((k) => k !== resolvedParams.tool)
    .slice(0, 5)
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/image/${k}` }));

  return (
    <ToolPageLayout
      toolId={
        resolvedParams.tool === "remove-background"
          ? "ai-remove-background"
          : resolvedParams.tool === "smart-crop"
            ? "smart-crop"
            : resolvedParams.tool === "magic-eraser"
              ? "ai-magic-eraser"
              : resolvedParams.tool === "upscale"
                ? "ai-upscale"
                : resolvedParams.tool
      }
      title={title}
      category="image"
      content={contentData?.content}
      relatedTools={relatedTools}
    />
  );
}
