import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  merge: {
    title: "Merge PDF",
    description: "Combine multiple PDFs into a single file.",
  },
  split: {
    title: "Split PDF",
    description:
      "Separate one page or a whole set for easy conversion into independent PDF files.",
  },
  compress: {
    title: "Compress PDF",
    description: "Reduce file size while optimizing for maximal PDF quality.",
  },
  rotate: {
    title: "Rotate PDF",
    description: "Rotate your PDFs the way you need them.",
  },
  reorder: {
    title: "Reorder PDF",
    description: "Drag and drop pages to rearrange them.",
  },
  "extract-pages": {
    title: "Extract Pages",
    description: "Extract pages from your PDF document.",
  },
  "delete-pages": {
    title: "Delete Pages",
    description: "Remove pages from your PDF document.",
  },
  protect: {
    title: "Protect PDF",
    description: "Encrypt your PDF with a password.",
  },
  unlock: { title: "Unlock PDF", description: "Remove PDF password security." },
  sign: {
    title: "Sign PDF",
    description: "Add a signature to your PDF document.",
  },
  "images-to-pdf": {
    title: "Images to PDF",
    description: "Convert JPG, PNG, and more to PDF.",
  },
  "pdf-to-images": {
    title: "PDF to Images",
    description: "Extract images from your PDF.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default async function PDFToolPage({
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
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/pdf/${k}` }));

  return (
    <ToolPageLayout
      toolId={`pdf-${resolvedParams.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="pdf"
      relatedTools={relatedTools}
    />
  );
}
