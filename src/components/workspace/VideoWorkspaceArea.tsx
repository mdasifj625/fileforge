"use client";

import React, { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

import { useLayerBlobs } from "@/hooks/useBlobStorage";
import * as Comlink from "comlink";
import type { VideoProcessor } from "@/workers/video.worker";

export function VideoWorkspaceArea() {
  const layers = useWorkspaceStore((state) => state.layers);
  const activeTool = useWorkspaceStore((state) => state.activeTool);
  const exportTrigger = useWorkspaceStore((state) => state.exportTrigger);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const { blobs } = useLayerBlobs(layers);

  const videoLayers = layers.filter((l) => blobs[l.fileId]);

  useEffect(() => {
    if (
      exportTrigger > 0 &&
      activeTool?.startsWith("video-") &&
      videoLayers.length > 0
    ) {
      const handleExport = async () => {
        setIsProcessing(true);
        setProgress(0);
        try {
          const worker = new Worker(
            new URL("@/workers/video.worker", import.meta.url),
            { type: "module" },
          );
          const api = Comlink.wrap<VideoProcessor>(worker);

          let finalBlob: Blob;
          let filename: string;

          // For simplicity, process the first video layer
          const inputBlob = blobs[videoLayers[0].fileId];

          if (activeTool === "video-compress") {
            finalBlob = await api.compressVideo(
              inputBlob,
              "high",
              Comlink.proxy((p: number) => setProgress(p)),
            );
            filename = `compressed-file-forge-${Date.now()}.mp4`;
          } else if (activeTool === "video-trim") {
            finalBlob = await api.trimVideo(
              inputBlob,
              0, // Will be read from layer transform in a real impl
              5,
              Comlink.proxy((p: number) => setProgress(p)),
            );
            filename = `trimmed-file-forge-${Date.now()}.mp4`;
          } else if (activeTool === "video-convert") {
            finalBlob = await api.convertVideo(
              inputBlob,
              "webm", // default to webm for demo
              Comlink.proxy((p: number) => setProgress(p)),
            );
            filename = `converted-file-forge-${Date.now()}.webm`;
          } else {
            worker.terminate();
            setIsProcessing(false);
            setProgress(null);
            return;
          }

          worker.terminate();

          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
          console.error("Video Operation Failed:", e);
          alert("Failed to process Video.");
        } finally {
          setIsProcessing(false);
          setProgress(null);
        }
      };
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger]);

  if (videoLayers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8 pointer-events-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Video Processing
              {isProcessing && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-primary">
                    {progress !== null
                      ? `${Math.round(progress)}%`
                      : "Processing..."}
                  </span>
                </div>
              )}
            </h2>
            <p className="text-muted-foreground text-sm">
              Adjust settings in the properties panel and click Export.
              Processing happens locally via WASM.
            </p>
          </div>
        </div>

        {videoLayers.map((layer) => (
          <div
            key={layer.id}
            className="bg-panel border border-panel-border rounded-2xl shadow-xl overflow-hidden relative"
          >
            <div className="bg-muted px-6 py-3 border-b border-panel-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                {layer.name}
              </h3>
              <button
                onClick={() =>
                  useWorkspaceStore.getState().removeLayer(layer.id)
                }
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                title="Remove Video"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-background/50 flex justify-center">
              <video
                src={URL.createObjectURL(blobs[layer.fileId])}
                controls
                className="max-w-full max-h-[600px] object-contain rounded-md shadow-sm border border-panel-border"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
