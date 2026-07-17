import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";
import { getToolContent } from "@/lib/contentParser";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Metadata } from "next";
import { getRelatedTools } from "@/lib/toolUtils";

// Define the valid tools for this category to prevent 404s
const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  "remove-background": {
    title: "Remove Background",
    description: "Automatically remove backgrounds using AI.",
  },
  compress: {
    title: "Compress Image",
    description: "Reduce image file size with minimal quality loss.",
  },
  convert: {
    title: "Convert Image",
    description: "Change image format (e.g. PNG to JPG).",
  },
  upscale: {
    title: "Image Upscale",
    description: "Upscale images to higher resolutions without quality loss.",
  },
  "magic-eraser": {
    title: "Magic Eraser",
    description: "Remove unwanted objects from images using AI.",
  },
  resize: { title: "Resize Image", description: "Change image dimensions." },
  crop: {
    title: "Crop Image",
    description: "Crop and extract parts of an image.",
  },
  watermark: {
    title: "Add Watermark",
    description: "Stamp your images with a logo or text.",
  },
  filters: {
    title: "Filters & Effects",
    description: "Apply Instagram-like filters and effects to your photos.",
  },
  "profile-picture": {
    title: "Profile Picture Maker",
    description: "Create stunning profile pictures with AI.",
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

  const relatedTools = getRelatedTools("image", resolvedParams.tool);

  return (
    <ToolPageLayout
      toolId={
        {
          "remove-background": "ai-remove-background",
          "magic-eraser": "ai-magic-eraser",
          upscale: "ai-upscale",
        }[resolvedParams.tool] || resolvedParams.tool
      }
      title={title}
      category="image"
      seoContent={
        contentData?.content ? (
          <MDXRemote source={contentData.content} />
        ) : undefined
      }
      relatedTools={relatedTools}
    />
  );
}
