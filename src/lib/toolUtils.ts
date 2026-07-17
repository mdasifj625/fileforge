import { TOOL_MENUS } from "@/config/tools";

export function getRelatedTools(category: string, toolId: string) {
  const categoryMenu = TOOL_MENUS.find(
    (m) => m.title.toLowerCase() === category.toLowerCase(),
  );

  if (!categoryMenu) return [];

  return categoryMenu.items
    .filter((item) => !item.href.endsWith(`/${toolId}`))
    .slice(0, 5)
    .map((item) => ({ title: item.name, href: item.href }));
}
