"use client";

import React, { useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import * as Comlink from "comlink";
import { FilterType, ImageProcessor } from "@/workers/image.worker";

export function PropertiesPanel() {
  const {
    activeLayerId,
    layers,
    updateLayerTransform,
    replaceLayer,
    activeTool,
  } = useWorkspaceStore();

  const [isFiltering, setIsFiltering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const activeLayer = layers.find((l) => l.id === activeLayerId);

  const handleTransformChange = (key: string, value: string) => {
    if (!activeLayer) return;
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(activeLayer.id, { [key]: num });
    }
  };

  const applyFilter = async (filterType: FilterType) => {
    if (!activeLayer || isFiltering) return;

    setIsFiltering(true);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const worker = new Worker(
        new URL("@/workers/image.worker", import.meta.url),
        { type: "module" },
      );
      const api = Comlink.wrap<ImageProcessor>(worker);

      const newBlob = await api.processImage(fileRecord.blob, filterType);

      // Save new blob
      const newFileId = crypto.randomUUID();
      await db.files.put({
        id: newFileId,
        blob: newBlob,
        name: `${filterType}-${fileRecord.name}`,
        type: fileRecord.type,
        size: newBlob.size,

        createdAt: Date.now(),
      });

      // Replace layer to force Canvas to re-init texture
      const newLayerId = crypto.randomUUID();
      replaceLayer(activeLayer.id, {
        ...activeLayer,
        id: newLayerId,
        fileId: newFileId,
      });

      worker.terminate();
    } catch (e) {
      console.error(e);
      alert("Failed to apply filter.");
    } finally {
      setIsFiltering(false);
    }
  };

  const restoreOriginal = () => {
    if (!activeLayer || !activeLayer.originalFileId) return;
    if (activeLayer.fileId === activeLayer.originalFileId) return; // Already original

    const newLayerId = crypto.randomUUID();
    replaceLayer(activeLayer.id, {
      ...activeLayer,
      id: newLayerId,
      fileId: activeLayer.originalFileId,
    });
  };

  return (
    <aside
      className={`w-full ${isExpanded ? "h-1/2" : "h-14"} md:h-auto md:w-80 shrink-0 bg-background flex flex-col z-20 md:border-l border-t md:border-t-0 border-panel-border shadow-2xl transition-all duration-300`}
    >
      <div
        className="h-14 shrink-0 border-b border-panel-border flex items-center justify-between px-5 bg-background/50 backdrop-blur-md cursor-pointer md:cursor-default select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">
          Properties
        </h2>
        <div className="md:hidden text-muted-foreground flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <div
        className={`p-5 flex-1 overflow-y-auto ${!isExpanded ? "hidden md:block" : "block"}`}
      >
        {activeLayer ? (
          <div className="space-y-8">
            {/* Transform Settings */}
            {(activeTool === "select" || !activeTool) && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                    Transform
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* X Position */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        X
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={Math.round(activeLayer.x)}
                          onChange={(e) =>
                            handleTransformChange("x", e.target.value)
                          }
                          className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                        />
                      </div>
                    </div>

                    {/* Y Position */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Y
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeLayer.y)}
                        onChange={(e) =>
                          handleTransformChange("y", e.target.value)
                        }
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    {/* Scale X */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Width (%)
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeLayer.scaleX * 100)}
                        onChange={(e) =>
                          handleTransformChange(
                            "scaleX",
                            (parseFloat(e.target.value) / 100).toString(),
                          )
                        }
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    {/* Scale Y */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Height (%)
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeLayer.scaleY * 100)}
                        onChange={(e) =>
                          handleTransformChange(
                            "scaleY",
                            (parseFloat(e.target.value) / 100).toString(),
                          )
                        }
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Crop Settings */}
            {activeTool === "crop" && activeLayer.originalWidth > 0 && (
              <>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                    Crop
                  </h3>

                  <div className="mb-4">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                      Constraint
                    </label>
                    <select
                      value={activeLayer.cropAspectRatio || "free"}
                      onChange={(e) => {
                        const val = e.target.value;
                        let ratio: number | "original" | "free" | null = null;
                        if (val === "free") ratio = "free";
                        else if (val === "original") ratio = "original";
                        else ratio = parseFloat(val);

                        let newCropRect = activeLayer.cropRect || {
                          x: 0,
                          y: 0,
                          width: activeLayer.originalWidth,
                          height: activeLayer.originalHeight,
                        };

                        if (ratio !== "free" && ratio !== null) {
                          const targetRatio =
                            ratio === "original"
                              ? activeLayer.originalWidth /
                                activeLayer.originalHeight
                              : ratio;

                          let newW = newCropRect.width;
                          let newH = newCropRect.height;

                          if (newW / newH > targetRatio) {
                            newW = newH * targetRatio;
                          } else {
                            newH = newW / targetRatio;
                          }

                          const cx = newCropRect.x + newCropRect.width / 2;
                          const cy = newCropRect.y + newCropRect.height / 2;

                          newCropRect = {
                            x: cx - newW / 2,
                            y: cy - newH / 2,
                            width: newW,
                            height: newH,
                          };
                        }

                        updateLayerTransform(activeLayer.id, {
                          cropAspectRatio: ratio,
                          cropRect: newCropRect,
                        });
                      }}
                      className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    >
                      <option value="free">Free</option>
                      <option value="original">Original Image</option>
                      <option value="1">1:1 Square</option>
                      <option value="1.7777777777777777">16:9 Landscape</option>
                      <option value="1.3333333333333333">4:3 Landscape</option>
                      <option value="0.75">3:4 Portrait</option>
                      <option value="0.5625">9:16 Portrait</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Crop X */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Offset X
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeLayer.cropRect?.x || 0)}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num)) {
                            updateLayerTransform(activeLayer.id, {
                              cropRect: {
                                ...(activeLayer.cropRect || {
                                  x: 0,
                                  y: 0,
                                  width: activeLayer.originalWidth,
                                  height: activeLayer.originalHeight,
                                }),
                                x: num,
                              },
                            });
                          }
                        }}
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    {/* Crop Y */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Offset Y
                      </label>
                      <input
                        type="number"
                        value={Math.round(activeLayer.cropRect?.y || 0)}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num)) {
                            updateLayerTransform(activeLayer.id, {
                              cropRect: {
                                ...(activeLayer.cropRect || {
                                  x: 0,
                                  y: 0,
                                  width: activeLayer.originalWidth,
                                  height: activeLayer.originalHeight,
                                }),
                                y: num,
                              },
                            });
                          }
                        }}
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    {/* Crop Width */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Width
                      </label>
                      <input
                        type="number"
                        value={Math.round(
                          activeLayer.cropRect?.width ??
                            activeLayer.originalWidth,
                        )}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num)) {
                            updateLayerTransform(activeLayer.id, {
                              cropRect: {
                                ...(activeLayer.cropRect || {
                                  x: 0,
                                  y: 0,
                                  width: activeLayer.originalWidth,
                                  height: activeLayer.originalHeight,
                                }),
                                width: num,
                              },
                            });
                          }
                        }}
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>

                    {/* Crop Height */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Height
                      </label>
                      <input
                        type="number"
                        value={Math.round(
                          activeLayer.cropRect?.height ??
                            activeLayer.originalHeight,
                        )}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          if (!isNaN(num)) {
                            updateLayerTransform(activeLayer.id, {
                              cropRect: {
                                ...(activeLayer.cropRect || {
                                  x: 0,
                                  y: 0,
                                  width: activeLayer.originalWidth,
                                  height: activeLayer.originalHeight,
                                }),
                                height: num,
                              },
                            });
                          }
                        }}
                        className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-panel-border" />
              </>
            )}

            {/* Compress Settings */}
            {activeTool === "compress" && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  Compression Settings
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Adjust format and quality settings before exporting. Click
                  Export in the top bar to apply.
                </p>
                {/* Note: The actual format/quality settings are handled by the ExportModal when Export is clicked. */}
                <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
                  Click the <strong>Export</strong> button in the top bar to
                  compress and save this image.
                </div>
              </div>
            )}

            {/* Remove Background */}
            {activeTool === "remove-background" && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
                  <span>Background</span>
                  {isFiltering && (
                    <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  )}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() =>
                      alert(
                        "Background removal is an advanced feature coming soon!",
                      )
                    }
                    disabled={isFiltering}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
                  >
                    Remove Background (AI)
                  </button>
                  <p className="text-xs text-muted-foreground text-center">
                    Uses local AI models to segment and remove the image
                    background.
                  </p>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTool === "layers" && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
                  Appearance
                </h3>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Opacity
                      </label>
                      <span className="text-xs font-mono text-foreground">
                        {Math.round((activeLayer.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={activeLayer.opacity ?? 1}
                      onChange={(e) =>
                        handleTransformChange("opacity", e.target.value)
                      }
                      className="w-full accent-primary"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Blend Mode
                    </label>
                    <select
                      value={activeLayer.blendMode || "normal"}
                      onChange={(e) =>
                        updateLayerTransform(activeLayer.id, {
                          blendMode: e.target
                            .value as import("@/store/useWorkspaceStore").FileLayer["blendMode"],
                        })
                      }
                      className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    >
                      <option value="normal">Normal</option>
                      <option value="multiply">Multiply</option>
                      <option value="screen">Screen</option>
                      <option value="overlay">Overlay</option>
                      <option value="darken">Darken</option>
                      <option value="lighten">Lighten</option>
                    </select>
                  </div>
                </div>
              </div>
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
