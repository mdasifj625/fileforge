import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "src/content/tools");

export interface ToolContent {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  content: string;
}

export function getToolContent(
  category: string,
  toolId: string,
): ToolContent | null {
  const filePath = path.join(CONTENT_DIR, category, `${toolId}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    title: data.title || "",
    description: data.description || "",
    seoTitle: data.seoTitle || data.title,
    seoDescription: data.seoDescription || data.description,
    content,
  };
}
