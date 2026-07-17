"use client";

import React from "react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { useExportStore } from "@/store/useExportStore";
import { useWorkspaceActions } from "@/store";
import { LayerTransformSettings } from "./properties/components/LayerTransformSettings";
import { DynamicPropertiesPanel } from "@/features/DynamicTools/DynamicPropertiesPanel";
import { toolRegistry } from "@/lib/toolRegistry";
import { FeatureErrorBoundary } from "@/components/FeatureErrorBoundary";
import { Undo2, Redo2 } from "lucide-react";

export function PropertiesPanel() {
  const activeLayer = useLayerStore((s) =>
    s.layers.find((l) => l.id === s.activeLayerId),
  );
  const activeTool = useToolStore((s) => s.activeTool);
  const updateLayerTransform = useLayerStore(
    (state) => state.updateLayerTransform,
  );

  const pastCount = useLayerStore((s) => s.past?.length || 0);
  const futureCount = useLayerStore((s) => s.future?.length || 0);
  const undo = useLayerStore((s) => s.undo);
  const redo = useLayerStore((s) => s.redo);
  const triggerExport = useExportStore((s) => s.triggerExport);
  const hasLayers = useLayerStore((s) => s.layers.length > 0);
  const { startOver } = useWorkspaceActions();

  const handleTransformChange = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num }, false);
    }
  };

  // Check if current tool is a dynamically registered tool
  const activeToolDef = activeTool ? toolRegistry[activeTool] : undefined;
  const dynamicTool =
    activeTool && activeTool !== "resize"
      ? toolRegistry[activeTool]
      : undefined;

  const ActivePropertiesComponent = activeToolDef?.PropertiesComponent;

  return (
    <aside className="w-full h-auto md:h-full md:w-80 shrink-0 bg-background flex flex-col z-20 border-t md:border-t-0 md:border-l border-panel-border transition-all duration-300">
      {/* Header — mobile: action buttons row; desktop: 'Properties' label */}
      <div className="h-14 shrink-0 border-b border-panel-border flex items-center px-3 md:px-5 bg-background/50 backdrop-blur-md select-none">
        {/* Mobile-only: Undo/Redo left, Start Over + Export right */}
        <div className="flex md:hidden items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={pastCount === 0}
              className="p-2 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={redo}
              disabled={futureCount === 0}
              className="p-2 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo"
            >
              <Redo2 size={16} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startOver}
              disabled={!hasLayers}
              className="px-3 py-1.5 text-xs font-semibold bg-panel border border-panel-border hover:border-primary/50 text-foreground rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-panel-border"
            >
              Start Over
            </button>
            <button
              onClick={triggerExport}
              disabled={!hasLayers}
              className="px-4 py-1.5 text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-all shadow-sm shadow-primary/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              {activeTool === "compress" ? "Compress" : "Export"}
            </button>
          </div>
        </div>
        {/* Desktop-only: Properties label */}
        <h2 className="hidden md:block text-sm font-bold text-foreground uppercase tracking-widest">
          Properties
        </h2>
      </div>

      <div className="p-5 flex-1 overflow-y-auto block">
        {activeLayer ? (
          <div className="space-y-8">
            {/* Transform Settings */}
            {(activeTool === "select" || !activeTool) && (
              <LayerTransformSettings
                activeLayer={activeLayer}
                handleTransformChange={handleTransformChange}
                updateLayerTransform={updateLayerTransform}
              />
            )}

            {/* Dynamically Injected Tool UI via Registry */}
            {ActivePropertiesComponent && (
              <FeatureErrorBoundary toolName={activeToolDef?.name}>
                <ActivePropertiesComponent layer={activeLayer} />
              </FeatureErrorBoundary>
            )}

            {/* Dynamic Tools (Vintage, Sepia, etc) without custom UI */}
            {!ActivePropertiesComponent &&
              dynamicTool &&
              dynamicTool.params &&
              dynamicTool.params.length > 0 && (
                <FeatureErrorBoundary toolName={dynamicTool.name}>
                  <DynamicPropertiesPanel
                    key={dynamicTool.id}
                    tool={dynamicTool}
                  />
                </FeatureErrorBoundary>
              )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground text-center px-4 font-medium">
            Select a layer to view and edit its properties
          </div>
        )}
      </div>
    </aside>
  );
}
