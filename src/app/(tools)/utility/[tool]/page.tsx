import { ToolPageLayout } from "@/components/workspace/ToolPageLayout";
import { notFound } from "next/navigation";
import { getRelatedTools } from "@/lib/toolUtils";

const VALID_TOOLS: Record<string, { title: string; description: string }> = {
  "qr-generator": {
    title: "QR Generator",
    description: "Generate QR codes for text, URLs, and more.",
  },
  "qr-scanner": {
    title: "QR Scanner",
    description: "Scan QR codes from images or webcam.",
  },
  zip: {
    title: "ZIP Files",
    description: "Compress multiple files into a ZIP archive.",
  },
  unzip: {
    title: "Unzip Files",
    description: "Extract files from a ZIP archive.",
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
  "color-converter": {
    title: "Color Converter",
    description: "Convert colors between HEX, RGB, HSL, and more.",
  },
  regex: {
    title: "Regex Tester",
    description: "Test and debug regular expressions.",
  },
};

export function generateStaticParams() {
  return Object.keys(VALID_TOOLS).map((tool) => ({ tool }));
}

export default async function UtilityToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const resolvedParams = await params;
  const toolData = VALID_TOOLS[resolvedParams.tool];

  if (!toolData) {
    notFound();
  }

  const relatedTools = getRelatedTools("utility", resolvedParams.tool);

  return (
    <ToolPageLayout
      toolId={resolvedParams.tool}
      title={toolData.title}
      category="utility"
      relatedTools={relatedTools}
    />
  );
}
