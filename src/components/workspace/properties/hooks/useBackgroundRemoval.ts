/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import type { AIProcessor } from "@/workers/rmbg.worker";
import { FileLayer } from "@/store/useWorkspaceStore";
import { PerformanceProfiler } from "@/utils/PerformanceProfiler";

// Tracks backends that have permanently failed (deadlocked) on this device.
// Once blacklisted, a backend is never retried — we go straight to the next one.
const BLACKLIST_KEY = "fileforge:ai_backend_blacklist";

function getBlacklist(): Set<string> {
  try {
    const raw = localStorage.getItem(BLACKLIST_KEY);
    const list = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    // Self-heal: remove wasm if it was accidentally blacklisted before this guard was added
    if (list.has("wasm")) {
      list.delete("wasm");
      localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...list]));
    }
    return list;
  } catch {
    return new Set();
  }
}

function blacklistBackend(backend: string) {
  // WASM is the CPU fallback — it always works, just slowly. Never blacklist it.
  if (backend === "wasm") return;
  try {
    const list = getBlacklist();
    list.add(backend);
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...list]));
  } catch {
    // ignore
  }
}

// localStorage key for persisting the last known-good backend.
const BACKEND_CACHE_KEY = "fileforge:preferred_ai_backend";

function getPreferredBackends(): string[] {
  const blacklist = getBlacklist();
  // GPU backends can be blacklisted; WASM is always the guaranteed final fallback
  const gpuBackends = ["webgpu"].filter((b) => !blacklist.has(b));
  try {
    const cached = localStorage.getItem(BACKEND_CACHE_KEY);
    if (cached && !blacklist.has(cached) && cached !== "wasm") {
      // Bubble the last GPU winner to the front, always end with wasm
      return [cached, ...gpuBackends.filter((b) => b !== cached), "wasm"];
    }
  } catch {
    // localStorage unavailable
  }
  // Always end with wasm — even if the list is otherwise empty
  return [...gpuBackends, "wasm"];
}

function cacheSuccessfulBackend(backend: string) {
  try {
    localStorage.setItem(BACKEND_CACHE_KEY, backend);
  } catch {
    // ignore
  }
}

export function useBackgroundRemoval(
  activeLayer: FileLayer | undefined,
  updateLayerTransform: (id: string, updates: Partial<FileLayer>) => void,
) {
  const [isFiltering, setIsFiltering] = useState(false);
  const [aiProgress, setAiProgress] = useState<number | null>(null);

  const applyAIBackgroundRemoval = useCallback(async () => {
    if (!activeLayer || isFiltering) return;

    setIsFiltering(true);
    setAiProgress(0);
    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const profiler = new PerformanceProfiler("AI Background Removal");
      const backends = getPreferredBackends();
      let maskBlob: Blob | null = null;
      let lastError: any = null;

      for (let i = 0; i < backends.length; i++) {
        const backend = backends[i];
        const nextBackend = backends[i + 1];

        profiler.attempt(
          i,
          backends.length,
          `Backend = ${backend.toUpperCase()}`,
        );

        const worker = new Worker(
          new URL("@/workers/rmbg.worker.entry", import.meta.url),
          { type: "module" },
        );
        const api = Comlink.wrap<AIProcessor>(worker);

        try {
          await api.loadModel(
            Comlink.proxy((progress: number) => {
              if (progress >= 0) setAiProgress(progress);
            }),
            backend,
          );

          const quality = backend === "wasm" ? "fast" : "balanced";

          maskBlob = await api.removeBackgroundGetMask(
            fileRecord.blob,
            undefined,
            quality,
            Comlink.proxy((report: string) => {
              console.log(report);
            }),
          );

          cacheSuccessfulBackend(backend);
          profiler.succeed(`Backend ${backend.toUpperCase()}`);
          worker.terminate();
          break;
        } catch (e: any) {
          // If this backend stalled/deadlocked, blacklist it permanently for this device.
          // Next run will skip it entirely and go straight to the next backend.
          const isDeadlock =
            typeof e?.message === "string" && e.message.includes("stalled");
          if (isDeadlock) {
            blacklistBackend(backend);
            PerformanceProfiler.logInfo(
              `${backend.toUpperCase()} permanently blacklisted on this device — will be skipped on all future runs`,
            );
          }
          profiler.fail(
            `Backend ${backend.toUpperCase()}`,
            e,
            nextBackend?.toUpperCase(),
          );
          lastError = e;
          worker.terminate();
        }
      }

      profiler.summary();

      if (!maskBlob) throw lastError || new Error("All AI backends failed.");

      const maskFileId = crypto.randomUUID();
      await db.files.put({
        id: maskFileId,
        blob: maskBlob,
        name: `mask-${fileRecord.name}`,
        type: "image/png",
        size: maskBlob.size,
        createdAt: Date.now(),
      });

      updateLayerTransform(activeLayer.id, { maskFileId });
    } catch (e) {
      console.error(e);
      alert("Failed to remove background.");
    } finally {
      setIsFiltering(false);
      setAiProgress(null);
    }
  }, [activeLayer, isFiltering, updateLayerTransform]);

  return { applyAIBackgroundRemoval, isFiltering, aiProgress };
}
