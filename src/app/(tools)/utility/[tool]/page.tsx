import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  "qr-generator": {
    title: "QR Generator",
    description: "Generate QR codes for text, URLs, and more.",
  },
  "qr-scanner": {
    title: "QR Scanner",
    description: "Scan QR codes from images or webcam.",
  },
  "barcode-generator": {
    title: "Barcode Generator",
    description: "Generate standard barcodes.",
  },
  "json-formatter": {
    title: "JSON Formatter",
    description: "Beautify and validate JSON.",
  },
  "xml-formatter": {
    title: "XML Formatter",
    description: "Beautify and validate XML.",
  },
  base64: {
    title: "Base64 Encoder/Decoder",
    description: "Encode or decode Base64 strings.",
  },
  uuid: { title: "UUID Generator", description: "Generate random UUIDs (v4)." },
  hash: {
    title: "Hash Generator",
    description: "Generate MD5, SHA-1, SHA-256 hashes.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default function UtilityToolPage({
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
    .map((k) => ({ title: VALID_TOOLS[k].title, href: `/utility/${k}` }));

  return (
    <ToolPageLayout
      toolId={`utility-${params.tool}`}
      title={toolData.title}
      description={toolData.description}
      category="utility"
      relatedTools={relatedTools}
    />
  );
}
