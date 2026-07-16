"use client";

import React from "react";
import { useLayerStore, useToolStore, useExportStore, useWorkspaceActions } from "@/store";
import { LayerTransformSettings } from "./properties/components/LayerTransformSettings";
import { DynamicPropertiesPanel } from "@/features/DynamicTools/DynamicPropertiesPanel";
import { toolRegistry } from "@/lib/toolRegistry";
import { Undo2, Redo2 } from "lucide-react";

export function PropertiesPanel() {
  const activeLayerId = useLayerStore((state) => state.activeLayerId);
  const layers = useLayerStore((state) => state.layers);
  const activeTool = useToolStore((state) => state.activeTool);
  const updateLayerTransform = useLayerStore(
    (state) => state.updateLayerTransform,
  );
  const replaceLayer = useLayerStore((state) => state.replaceLayer);

  const pastCount = useLayerStore((s) => s.past?.length || 0);
  const futureCount = useLayerStore((s) => s.future?.length || 0);
  const undo = useLayerStore((s) => s.undo);
  const redo = useLayerStore((s) => s.redo);
  const triggerExport = useExportStore((s) => s.triggerExport);
  const hasLayers = useLayerStore((s) => s.layers.length > 0);
  const { startOver } = useWorkspaceActions();

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const handleTransformChange = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num }, false);
    }
  };

  const handleTransformCommit = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num }, true);
    }
  };

  const isFiltering = false;

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

            {/* Legacy Features still unmigrated below */}

            {/* Compress/Convert Settings */}
            {(activeTool === "compress" ||
              activeTool === "convert" ||
              activeTool === "video-compress" ||
              activeTool === "video-convert") && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  Ready to{" "}
                  {activeTool === "compress" || activeTool === "video-compress"
                    ? "Compress"
                    : "Convert"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  All output settings (format, quality, resolution) are
                  configured during the final step.
                </p>
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
                  Click the{" "}
                  <strong>
                    {activeTool === "compress" ? "Compress" : "Export"}
                  </strong>{" "}
                  button in the top bar to adjust quality and save your file.
                </div>
              </div>
            )}

            {/* Video Trim Settings */}
            {activeTool === "video-trim" && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  Trim Settings
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Click Export in the top bar to apply trim. Note: For the demo,
                  trim cuts exactly from 0s to 5s. Full interactive timeline
                  coming soon!
                </p>
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
                  Click the <strong>Export</strong> button in the top bar to
                  save this video.
                </div>
              </div>
            )}

            {/* Audio Tools Settings */}
            {activeTool?.startsWith("audio-") && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  Audio Settings
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adjust your audio options. Audio processing is completely
                  local via WASM.
                </p>
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
                  Click the <strong>Export</strong> button in the top bar to
                  process and save this audio file.
                </div>
              </div>
            )}

            {/* Dynamically Injected Tool UI via Registry */}
            {ActivePropertiesComponent && (
              <ActivePropertiesComponent layer={activeLayer} />
            )}

            {/* Dynamic Tools (Vintage, Sepia, etc) */}
            {dynamicTool && (
              <DynamicPropertiesPanel
                tool={dynamicTool}
              />
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
