"use client";

import React from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { BackgroundRemovalSettings } from "./tools/BackgroundRemovalSettings";
import { useBackgroundRemoval } from "./properties/hooks/useBackgroundRemoval";
import { useOCR } from "./properties/hooks/useOCR";
import { useSmartCrop } from "./properties/hooks/useSmartCrop";
import { LayerTransformSettings } from "./properties/components/LayerTransformSettings";
import { LayerCropSettings } from "./properties/components/LayerCropSettings";
import { LayerAppearanceSettings } from "./properties/components/LayerAppearanceSettings";
import { LayerResizeSettings } from "./properties/components/LayerResizeSettings";
import { OCRSettings } from "./properties/components/OCRSettings";
import { SmartCropSettings } from "./properties/components/SmartCropSettings";
import { WatermarkSettings } from "./properties/components/WatermarkSettings";

export function PropertiesPanel() {
  const {
    activeLayerId,
    layers,
    updateLayerTransform,
    replaceLayer,
    activeTool,
  } = useWorkspaceStore();

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const handleTransformChange = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num });
    }
  };

  const {
    applyAIBackgroundRemoval,
    isFiltering: isRmbgFiltering,
    aiProgress: rmbgProgress,
  } = useBackgroundRemoval(activeLayer, updateLayerTransform);
  const {
    applyOCR,
    isFiltering: isOcrFiltering,
    aiProgress: ocrProgress,
    ocrText,
  } = useOCR(activeLayer);
  const { applySmartCrop, isFiltering: isSmartCropFiltering } = useSmartCrop(
    activeLayer,
    replaceLayer,
  );

  const isFiltering = isRmbgFiltering || isOcrFiltering || isSmartCropFiltering;
  const aiProgress = rmbgProgress ?? ocrProgress;

  return (
    <aside className="w-full h-auto md:h-full md:w-80 shrink-0 bg-background flex flex-col z-20 border-t md:border-t-0 md:border-l border-panel-border transition-all duration-300">
      <div className="h-14 shrink-0 border-b border-panel-border flex items-center px-5 bg-background/50 backdrop-blur-md select-none">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
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
              />
            )}

            {/* Crop Settings */}
            {activeTool === "crop" && activeLayer.originalWidth > 0 && (
              <LayerCropSettings
                activeLayer={activeLayer}
                updateLayerTransform={updateLayerTransform}
              />
            )}

            {/* Resize Settings */}
            {activeTool === "resize" && activeLayer.originalWidth > 0 && (
              <LayerResizeSettings
                activeLayer={activeLayer}
                updateLayerTransform={updateLayerTransform}
              />
            )}

            {/* Compress/Convert Settings */}
            {(activeTool === "compress" ||
              activeTool === "convert" ||
              activeTool === "video-compress" ||
              activeTool === "video-convert") && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  {activeTool === "compress" || activeTool === "video-compress"
                    ? "Compression"
                    : "Format"}{" "}
                  Settings
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adjust format and quality settings before exporting. Click
                  Export in the top bar to apply.
                </p>
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
                  Click the <strong>Export</strong> button in the top bar to
                  {activeTool === "compress" || activeTool === "video-compress"
                    ? " compress"
                    : " convert"}{" "}
                  and save this file.
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

            {/* Remove Background */}
            {activeTool === "ai-remove-background" && (
              <BackgroundRemovalSettings
                isFiltering={isFiltering}
                aiProgress={aiProgress}
                onApply={applyAIBackgroundRemoval}
              />
            )}

            {/* OCR */}
            {activeTool === "ai-ocr" && (
              <OCRSettings
                applyOCR={applyOCR}
                isFiltering={isFiltering}
                aiProgress={aiProgress}
                ocrText={ocrText}
              />
            )}

            {/* Smart Crop */}
            {activeTool === "smart-crop" && (
              <SmartCropSettings
                applySmartCrop={applySmartCrop}
                isFiltering={isFiltering}
              />
            )}

            {/* Watermark Settings */}
            {activeTool === "pdf-watermark" && (
              <WatermarkSettings
                activeLayer={activeLayer}
                updateLayerTransform={updateLayerTransform}
              />
            )}

            {/* Appearance Settings */}
            {activeTool === "layers" && (
              <LayerAppearanceSettings
                activeLayer={activeLayer}
                handleTransformChange={handleTransformChange}
                updateLayerTransform={updateLayerTransform}
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
