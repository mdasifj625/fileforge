/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { db } from "@/db";
import * as Comlink from "comlink";
import type { AIProcessor } from "@/workers/rmbg.worker";
import { Layer } from "@/types/layer";
import { PerformanceProfiler } from "@/utils/PerformanceProfiler";
import { useAIStore } from "@/store";

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

const LIMITS_CHECK_KEY = "fileforge:ai_webgpu_limits_failed";

function isWebGPULimitsFailed(): boolean {
  try {
    return localStorage.getItem(LIMITS_CHECK_KEY) === "true";
  } catch {
    return false;
  }
}

export function cacheWebGPULimitsFailed() {
  try {
    localStorage.setItem(LIMITS_CHECK_KEY, "true");
  } catch {
    // ignore
  }
}

function getPreferredBackends(): string[] {
  const blacklist = getBlacklist();
  const limitsFailed = isWebGPULimitsFailed();

  // Filter out webgpu if it is blacklisted OR if hardware limits are insufficient
  const gpuBackends = ["webgpu"].filter(
    (b) => !blacklist.has(b) && !limitsFailed,
  );
  try {
    const cached = localStorage.getItem(BACKEND_CACHE_KEY);
    if (
      cached &&
      !blacklist.has(cached) &&
      cached !== "wasm" &&
      !limitsFailed
    ) {
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
  activeLayer: Layer | undefined,
  updateLayerTransform: (id: string, updates: Partial<Layer>) => void,
) {
  const isFiltering = useAIStore((state) => state.isRemovingBackground);
  const aiProgress = useAIStore((state) => state.aiProgress);
  const {
    setIsRemovingBackground,
    setAiProgress,
    setAiProgressPhase,
    setAiProgressBackend,
    triggerBgRemovalSuccess,
    setBgRemovalDuration,
  } = useAIStore();

  const applyAIBackgroundRemoval = useCallback(async () => {
    if (!activeLayer || isFiltering) return;

    setIsRemovingBackground(true);
    setAiProgressPhase("model");
    setAiProgress(0);
    setBgRemovalDuration(null);

    const overallStart = Date.now();
    let activeInterval: NodeJS.Timeout | null = null;

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

        setAiProgressBackend(backend);
        setAiProgressPhase("model");
        setAiProgress(0);

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
              if (progress >= 0) {
                // Map Phase 1 model download to 0% - 40%
                setAiProgress(Math.round(progress * 0.4));
              }
            }),
            backend,
          );

          // Phase 2: Inference (Actual image segmentation)
          setAiProgressPhase("inference");
          setAiProgress(40);

          const cores =
            typeof navigator !== "undefined"
              ? navigator.hardwareConcurrency || 4
              : 4;
          const estDuration =
            backend === "webgpu"
              ? Math.max(20000, Math.round(25 * (16 / cores)) * 1000)
              : Math.max(25000, Math.round(30 * (16 / cores)) * 1000);

          const startProgress = 40;
          const targetProgress = 95;
          let currentProgress = startProgress;
          // Dynamically scale decayFactor so visual progress bar speed matches hardware-scaled duration
          const decayFactor = Math.min(
            0.25,
            Math.max(0.02, 0.3 / (estDuration / 1000)),
          );

          activeInterval = setInterval(() => {
            currentProgress += (targetProgress - currentProgress) * decayFactor;
            setAiProgress(Math.round(currentProgress));
          }, 150);

          const quality = backend === "wasm" ? "fast" : "balanced";

          maskBlob = await api.removeBackgroundGetMask(
            fileRecord.blob,
            undefined,
            quality,
          );

          if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
          }
          setAiProgress(100);

          cacheSuccessfulBackend(backend);
          profiler.succeed(`Backend ${backend.toUpperCase()}`);
          worker.terminate();
          break;
        } catch (e: any) {
          if (activeInterval) {
            clearInterval(activeInterval);
            activeInterval = null;
          }
          const errMsg = e?.message ?? String(e);
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

          // If the worker rejected this backend due to hardware limits checks, cache it
          // so we skip spawning workers for WebGPU entirely on subsequent runs.
          const isLimitsFailed = errMsg.includes(
            "rejected by the GPU adapter probe",
          );
          if (isLimitsFailed && backend === "webgpu") {
            cacheWebGPULimitsFailed();
            PerformanceProfiler.logInfo(
              `WebGPU hardware limits check failed — skipped for all future runs on this device`,
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

      updateLayerTransform(activeLayer.id, {
        maskFileId,
        isAiBackgroundRemoved: true,
      });
      const durationMs = Date.now() - overallStart;
      setBgRemovalDuration(durationMs);
      // Trigger achievement confetti
      triggerBgRemovalSuccess();
    } catch (e) {
      if (activeInterval) clearInterval(activeInterval);
      console.error(e);
      alert("Failed to remove background.");
    } finally {
      setIsRemovingBackground(false);
      setAiProgress(null);
      setAiProgressPhase(null);
      setAiProgressBackend(null);
    }
  }, [
    activeLayer,
    isFiltering,
    updateLayerTransform,
    setIsRemovingBackground,
    setAiProgress,
    setAiProgressPhase,
    setAiProgressBackend,
    triggerBgRemovalSuccess,
    setBgRemovalDuration,
  ]);

  return { applyAIBackgroundRemoval, isFiltering, aiProgress };
}
