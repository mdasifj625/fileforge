const fs = require('fs');
const path = require('path');

const MAPPING = {
  activeTool: 'useToolStore',
  setActiveTool: 'useToolStore',
  zoom: 'useToolStore',
  setZoom: 'useToolStore',
  theme: 'useToolStore',
  setTheme: 'useToolStore',
  brushMode: 'useToolStore',
  setBrushMode: 'useToolStore',
  brushSize: 'useToolStore',
  setBrushSize: 'useToolStore',
  
  layers: 'useLayerStore',
  activeLayerId: 'useLayerStore',
  past: 'useLayerStore',
  future: 'useLayerStore',
  addLayer: 'useLayerStore',
  removeLayer: 'useLayerStore',
  replaceLayer: 'useLayerStore',
  updateLayerTransform: 'useLayerStore',
  setActiveLayerId: 'useLayerStore',
  undo: 'useLayerStore',
  redo: 'useLayerStore',
  
  exportTrigger: 'useExportStore',
  exportImageBlob: 'useExportStore',
  triggerExport: 'useExportStore',
  setExportImageBlob: 'useExportStore',
  
  isRemovingBackground: 'useAIStore',
  setIsRemovingBackground: 'useAIStore',
  aiProgress: 'useAIStore',
  setAiProgress: 'useAIStore',
  aiProgressPhase: 'useAIStore',
  setAiProgressPhase: 'useAIStore',
  aiProgressBackend: 'useAIStore',
  setAiProgressBackend: 'useAIStore',
  bgRemovalSuccessTrigger: 'useAIStore',
  triggerBgRemovalSuccess: 'useAIStore',
  bgRemovalDuration: 'useAIStore',
  setBgRemovalDuration: 'useAIStore',

  startOver: 'useWorkspaceActions'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.includes('useWorkspaceStore')) return;
  
  // Find all destructured/accessed properties from useWorkspaceStore
  // e.g. useWorkspaceStore((state) => state.layers)
  // or useWorkspaceStore(s => s.zoom)
  let newContent = content;
  const storeUsages = new Set();
  
  for (const [prop, store] of Object.entries(MAPPING)) {
    const regex1 = new RegExp(`useWorkspaceStore\\(\\s*\\(\\s*\\w+\\s*\\)\\s*=>\\s*\\w+\\.${prop}\\s*\\)`, 'g');
    const regex2 = new RegExp(`useWorkspaceStore\\(\\s*\\w+\\s*=>\\s*\\w+\\.${prop}\\s*\\)`, 'g');
    const regex3 = new RegExp(`useWorkspaceStore\\.getState\\(\\)\\.${prop}\\(`, 'g');
    const regex4 = new RegExp(`useWorkspaceStore\\.getState\\(\\)\\.${prop}`, 'g');
    
    if (regex1.test(newContent) || regex2.test(newContent) || regex3.test(newContent) || regex4.test(newContent)) {
      storeUsages.add(store);
      newContent = newContent.replace(regex1, `${store}((s) => s.${prop})`);
      newContent = newContent.replace(regex2, `${store}(s => s.${prop})`);
      newContent = newContent.replace(regex3, `${store}.getState().${prop}(`);
      newContent = newContent.replace(regex4, `${store}.getState().${prop}`);
    }
  }

  // Handle const { ... } = useWorkspaceStore()
  if (/const\s+\{([^}]+)\}\s*=\s*useWorkspaceStore\(\)/.test(newContent)) {
     // This is too complex for regex, we will let typescript flag it and fix manually
  }
  
  if (storeUsages.size > 0) {
    const imports = Array.from(storeUsages).map(s => {
      if (s === 'useWorkspaceActions') return `import { ${s} } from "@/store";`;
      return `import { ${s} } from "@/store/${s}";`;
    }).join('\n');
    
    // Replace the import
    newContent = newContent.replace(/import\s+\{\s*useWorkspaceStore\s*(?:,\s*FileLayer\s*)?\}\s+from\s+"@\/store\/useWorkspaceStore";/, imports);
    newContent = newContent.replace(/import\s+\{\s*FileLayer\s*,\s*useWorkspaceStore\s*\}\s+from\s+"@\/store\/useWorkspaceStore";/, `import { FileLayer } from "@/types/layer";\n${imports}`);
    newContent = newContent.replace(/import\s+\{\s*useWorkspaceStore\s*\}\s+from\s+"@\/store";/, imports);
  }

  fs.writeFileSync(filePath, newContent);
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
