const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  if (filePath.includes('ThemeToggle.tsx')) {
    newContent = newContent.replace(/useLayerStore/g, 'useToolStore');
  }
  
  if (filePath.includes('ExportModal.tsx')) {
    // ExportModal needs useExportStore and useLayerStore
    newContent = newContent.replace(/const\s+\{\s*layers\s*,\s*exportTrigger\s*,\s*exportImageBlob\s*,\s*setExportImageBlob\s*,\s*activeTool\s*,\s*\}\s*=\s*useLayerStore\(\);/g, `
    const layers = useLayerStore(s => s.layers);
    const { exportTrigger, exportImageBlob, setExportImageBlob } = useExportStore();
    const activeTool = useToolStore(s => s.activeTool);
    `);
    
    // Make sure useExportStore and useToolStore are imported
    newContent = newContent.replace(/import\s*\{\s*useLayerStore\s*\}\s*from\s*"@\/store";/g, 'import { useLayerStore, useExportStore, useToolStore } from "@/store";');
  }
  
  if (filePath.includes('PropertiesPanel.tsx') || filePath.includes('WorkspaceLayout.tsx')) {
    newContent = newContent.replace(/const\s+startOver\s*=\s*useWorkspaceActions\(\(s\)\s*=>\s*s\.startOver\);/g, 'const { startOver } = useWorkspaceActions();');
  }
  
  if (filePath.includes('useCanvasExport.ts')) {
    newContent = newContent.replace(/const\s+state\s*=\s*useLayerStore\.getState\(\);/g, `const state = useLayerStore.getState(); const activeLayerId = state.activeLayerId;`);
    // And import useLayerStore at the top
    if (!newContent.includes('import { useLayerStore } from "@/store"')) {
      newContent = newContent.replace(/import\s+\*\s+as\s+PIXI\s+from\s+"pixi.js";/, 'import * as PIXI from "pixi.js";\nimport { useLayerStore, useToolStore } from "@/store";');
    }
  }

  if (filePath.includes('spriteUtils.ts') || filePath.includes('MaskBrushController.ts')) {
    newContent = newContent.replace(/store\.activeTool/g, 'useToolStore.getState().activeTool');
    newContent = newContent.replace(/store\.brushMode/g, 'useToolStore.getState().brushMode');
    newContent = newContent.replace(/store\.brushSize/g, 'useToolStore.getState().brushSize');
    
    if (!newContent.includes('useToolStore')) {
      newContent = newContent.replace(/import \{ useLayerStore \} from "@\/store";/, 'import { useLayerStore, useToolStore } from "@/store";');
    }
  }

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
