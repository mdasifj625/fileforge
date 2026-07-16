"use client";

import React, { useEffect, useState } from "react";
import { useToolStore } from "@/store/useToolStore";
import { useLayerStore } from "@/store/useLayerStore";
import { useExportStore } from "@/store/useExportStore";
import { db } from "@/db";
import { useLayerBlobs } from "@/hooks/useBlobStorage";
import * as Comlink from "comlink";
import type { UtilityProcessor } from "@/workers/utility.worker";

export function UtilityWorkspaceArea() {
  const layers = useLayerStore((s) => s.layers);
  const activeTool = useToolStore((s) => s.activeTool);
  const exportTrigger = useExportStore((s) => s.exportTrigger);
  const addLayer = useLayerStore((s) => s.addLayer);
  const { blobs } = useLayerBlobs(layers);
  const [isProcessing, setIsProcessing] = useState(false);
  const [base64Output, setBase64Output] = useState<string>("");
  const [uuidOutput, setUuidOutput] = useState<string>("");

  const activeLayers = layers.filter((l) => blobs[l.fileId]);

  useEffect(() => {
    if (exportTrigger > 0 && activeTool?.startsWith("utility-")) {
      const handleExport = async () => {
        setIsProcessing(true);
        try {
          const worker = new Worker(
            new URL("@/workers/utility.worker", import.meta.url),
            { type: "module" },
          );
          const api = Comlink.wrap<UtilityProcessor>(worker);

          if (activeTool === "utility-zip" && activeLayers.length > 0) {
            const filesToZip = activeLayers.map((l) => ({
              name: l.name,
              blob: blobs[l.fileId],
            }));
            const zipBlob = await api.zipFiles(filesToZip);

            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `archive-file-forge-${Date.now()}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } else if (
            activeTool === "utility-unzip" &&
            activeLayers.length > 0
          ) {
            const inputBlob = blobs[activeLayers[0].fileId];
            const extracted = await api.unzipFile(inputBlob);

            // Add extracted files to workspace
            for (const file of extracted) {
              const fileId = crypto.randomUUID();
              await db.files.put({
                id: fileId,
                name: file.name,
                blob: file.blob,
                type: file.blob.type || "application/octet-stream",
                size: file.blob.size,
                createdAt: Date.now(),
              });
              addLayer({
                id: crypto.randomUUID(),
                fileId,
                name: file.name,
                visible: true,
                locked: false,
                x: 0,
                y: 0,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                originalWidth: 100,
                originalHeight: 100,
                opacity: 1,
                type: "image",
              });
            }
            alert(`Extracted ${extracted.length} files to your workspace!`);
          } else if (
            activeTool === "utility-base64" &&
            activeLayers.length > 0
          ) {
            const inputBlob = blobs[activeLayers[0].fileId];
            const b64 = await api.encodeBase64(inputBlob);
            setBase64Output(b64);
          } else if (activeTool === "utility-uuid") {
            const uuid = await api.generateUUID();
            setUuidOutput(uuid);
          }

          worker.terminate();
        } catch (e) {
          console.error("Utility Operation Failed:", e);
          alert("Failed to process Utility task.");
        } finally {
          setIsProcessing(false);
        }
      };
      handleExport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportTrigger, activeTool]);

  return (
    <div className="absolute inset-0 z-40 bg-background/95 backdrop-blur-xl overflow-y-auto p-4 md:p-8 pointer-events-auto flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-8 bg-panel border border-panel-border p-8 rounded-2xl shadow-2xl relative">
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 capitalize">
            {activeTool?.replace("utility-", "") || "Utility"} Tool
          </h2>
          <p className="text-muted-foreground text-sm">
            {activeTool === "utility-zip" &&
              "Add files to your workspace, then click Export to download them as a single ZIP."}
            {activeTool === "utility-unzip" &&
              "Add a ZIP file to your workspace and click Export to extract it."}
            {activeTool === "utility-base64" &&
              "Add a file and click Export to encode it to Base64."}
            {activeTool === "utility-uuid" &&
              "Click Export to generate a new random UUID v4."}
          </p>
        </div>

        {activeTool === "utility-base64" && base64Output && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Base64 Output
            </label>
            <textarea
              readOnly
              value={base64Output}
              className="w-full h-40 bg-background border border-panel-border rounded-md p-3 text-xs font-mono break-all"
            />
          </div>
        )}

        {activeTool === "utility-uuid" && uuidOutput && (
          <div className="space-y-2 text-center py-8 bg-background border border-panel-border rounded-lg">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-4">
              Generated UUID
            </label>
            <code className="text-2xl font-bold text-primary select-all">
              {uuidOutput}
            </code>
          </div>
        )}

        {activeLayers.length > 0 && activeTool !== "utility-uuid" && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Selected Files
            </label>
            <ul className="space-y-1">
              {activeLayers.map((l) => (
                <li
                  key={l.id}
                  className="text-sm px-3 py-2 bg-background border border-panel-border rounded-md truncate"
                >
                  {l.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
