"use client";

import React, { useEffect, useState } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { useExportStore } from "@/store/useExportStore";

import * as Comlink from "comlink";
import type { AudioProcessor } from "@/workers/media/audio/ffmpeg-audio.worker";
import { useLayerBlobs } from "@/hooks/useBlobStorage";

export function AudioWorkspaceArea() {
  const layers = useLayerStore((s) => s.layers);
  const activeTool = useToolStore((s) => s.activeTool);
  const exportTrigger = useExportStore((s) => s.exportTrigger);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const { blobs } = useLayerBlobs(layers);

  const audioLayers = layers.filter((l) => blobs[l.fileId]);

  useEffect(() => {
    if (
      exportTrigger > 0 &&
      activeTool?.startsWith("audio-") &&
      audioLayers.length > 0
    ) {
      const handleExport = async () => {
        setIsProcessing(true);
        setProgress(0);
        try {
          const worker = new Worker(
            new URL(
              "@/workers/media/audio/ffmpeg-audio.worker",
              import.meta.url,
            ),
            { type: "module" },
          );
          const api = Comlink.wrap<AudioProcessor>(worker);

          let finalBlob: Blob;
          let filename: string;

          if (activeTool === "audio-merge") {
            const inputBlobs = audioLayers.map((l) => blobs[l.fileId]);
            finalBlob = await api.mergeAudio(
              inputBlobs,
              Comlink.proxy((p: number) => setProgress(p)),
            );
            filename = `merged-file-forge-${Date.now()}.mp3`;
          } else {
            const inputBlob = blobs[audioLayers[0].fileId];

            if (activeTool === "audio-trim") {
              finalBlob = await api.trimAudio(
                inputBlob,
                0,
                5, // demo logic
                Comlink.proxy((p: number) => setProgress(p)),
              );
              filename = `trimmed-file-forge-${Date.now()}.mp3`;
            } else if (activeTool === "audio-convert") {
              finalBlob = await api.convertAudio(
                inputBlob,
                "wav", // demo logic
                Comlink.proxy((p: number) => setProgress(p)),
              );
              filename = `converted-file-forge-${Date.now()}.wav`;
            } else if (activeTool === "audio-normalize") {
              finalBlob = await api.normalizeAudio(
                inputBlob,
                Comlink.proxy((p: number) => setProgress(p)),
              );
              filename = `normalized-file-forge-${Date.now()}.mp3`;
            } else {
              worker.terminate();
              setIsProcessing(false);
              setProgress(null);
              return;
            }
          }

          worker.terminate();

          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();

          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
          console.error("Audio Operation Failed:", e);
          alert("Failed to process Audio.");
        } finally {
          setIsProcessing(false);
          setProgress(null);
        }
      };
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger, activeTool]);

  if (audioLayers.length === 0) return null;

  return (
    <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8 pointer-events-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Audio Processing
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

        {audioLayers.map((layer) => (
          <div
            key={layer.id}
            className="bg-panel border border-panel-border rounded-2xl shadow-xl overflow-hidden relative"
          >
            <div className="bg-muted px-6 py-3 border-b border-panel-border flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                {layer.name}
              </h3>
              <button
                onClick={() => useLayerStore.getState().removeLayer(layer.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                title="Remove Audio"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-background/50 flex justify-center w-full">
              <audio
                src={URL.createObjectURL(blobs[layer.fileId])}
                controls
                className="w-full max-w-2xl"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
