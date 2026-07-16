const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Replace type imports
  newContent = newContent.replace(/import\s*\{\s*FileLayer\s+as\s+Layer\s*\}\s*from\s*"@\/store\/useWorkspaceStore";/g, 'import { Layer } from "@/types/layer";');
  newContent = newContent.replace(/import\s*\{\s*FileLayer\s+as\s+ImageLayer\s*\}\s*from\s*"@\/store\/useWorkspaceStore";/g, 'import { ImageLayer } from "@/types/layer";');
  newContent = newContent.replace(/import\s*\{\s*FileLayer\s*\}\s*from\s*"@\/store\/useWorkspaceStore";/g, 'import { Layer as FileLayer } from "@/types/layer";');
  newContent = newContent.replace(/import\s*\{\s*useWorkspaceStore\s*\}\s*from\s*"@\/store\/useWorkspaceStore";/g, 'import { useLayerStore, useToolStore, useExportStore, useAIStore } from "@/store";');
  
  // Also for ResizeSettings which had a multiline import
  newContent = newContent.replace(/import\s*\{[^}]*ImageLayer[^}]*\}\s*from\s*"@\/store\/useWorkspaceStore";/g, 'import { ImageLayer } from "@/types/layer";');

  // Fix remaining useWorkspaceStore calls that failed regex
  newContent = newContent.replace(/useWorkspaceStore\(\(s\)\s*=>\s*s\.theme\)/g, 'useToolStore((s) => s.theme)');
  newContent = newContent.replace(/useWorkspaceStore\.getState\(\)\.theme/g, 'useToolStore.getState().theme');
  newContent = newContent.replace(/useWorkspaceStore\(\)/g, 'useLayerStore()'); // As a fallback, if someone destructured everything
  newContent = newContent.replace(/useWorkspaceStore/g, 'useLayerStore'); // final catch all

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
