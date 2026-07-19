import { useCallback } from "react";
import { db } from "@/db";
import { Layer } from "@/types/layer";
import { PerformanceProfiler } from "@/utils/PerformanceProfiler";
import { useAIStore } from "@/store";
import { WorkerManager } from "@/workers/WorkerManager";

const BLACKLIST_KEY = "fileforge:ai_backend_blacklist";

function getBlacklist(): Set<string> {
  try {
    const raw = localStorage.getItem(BLACKLIST_KEY);
    const list = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
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
  if (backend === "wasm") return;
  try {
    const list = getBlacklist();
    list.add(backend);
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...list]));
  } catch {
    // ignore
  }
}

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
      return [cached, ...gpuBackends.filter((b) => b !== cached), "wasm"];
    }
  } catch {
    // ignore
  }
  return [...gpuBackends, "wasm"];
}

function cacheSuccessfulBackend(backend: string) {
  try {
    localStorage.setItem(BACKEND_CACHE_KEY, backend);
  } catch {
    // ignore
  }
}

async function attemptBackend(
  backend: string,
  fileBlob: Blob,
  setAiProgress: (p: number) => void,
  setAiProgressPhase: (phase: "model" | "inference" | null) => void,
): Promise<Blob> {
  // Wait for preload if it's running, or start it
  await WorkerManager.preloadRMBGModel(backend);
  const { api, worker } = WorkerManager.getRMBGApi();

  if (!api || !worker) {
    throw new Error("Worker failed to initialize");
  }

  let activeInterval: NodeJS.Timeout | null = null;
  try {
    setAiProgressPhase("inference");
    setAiProgress(40);

    const cores =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const estDuration =
      backend === "webgpu"
        ? Math.max(20000, Math.round(25 * (16 / cores)) * 1000)
        : Math.max(25000, Math.round(30 * (16 / cores)) * 1000);

    const targetProgress = 95;
    let currentProgress = 40;
    const decayFactor = Math.min(
      0.25,
      Math.max(0.02, 0.3 / (estDuration / 1000)),
    );

    activeInterval = setInterval(() => {
      currentProgress += (targetProgress - currentProgress) * decayFactor;
      setAiProgress(Math.round(currentProgress));
    }, 150);

    const quality = backend === "wasm" ? "fast" : "balanced";
    const maskBlob = await api.removeBackgroundGetMask(
      fileBlob,
      undefined,
      quality,
    );

    if (activeInterval) clearInterval(activeInterval);
    setAiProgress(100);
    return maskBlob;
  } catch (e) {
    if (activeInterval) clearInterval(activeInterval);
    // Don't terminate, let the WorkerManager keep it alive for next attempt,
    // unless it's completely crashed, but we handle blacklisting at a higher level.
    throw e;
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  const applyAIBackgroundRemoval = useCallback(async () => {
    if (!activeLayer || isFiltering) return;

    setIsRemovingBackground(true);
    setAiProgressPhase("model");
    setAiProgress(0);
    setBgRemovalDuration(null);

    const overallStart = Date.now();

    try {
      const fileRecord = await db.files.get(activeLayer.fileId);
      if (!fileRecord) throw new Error("File not found in DB");

      const profiler = new PerformanceProfiler("AI Background Removal");
      const backends = getPreferredBackends();
      let maskBlob: Blob | null = null;
      let lastError: unknown = null;

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

        try {
          maskBlob = await attemptBackend(
            backend,
            fileRecord.blob,
            setAiProgress,
            setAiProgressPhase,
          );
          cacheSuccessfulBackend(backend);
          profiler.succeed(`Backend ${backend.toUpperCase()}`);
          break;
        } catch (e: unknown) {
          const errMsg = e instanceof Error ? e.message : String(e);
          const isDeadlock = errMsg.includes("stalled");
          if (isDeadlock) {
            blacklistBackend(backend);
            PerformanceProfiler.logInfo(
              `${backend.toUpperCase()} permanently blacklisted on this device`,
            );
          }

          const isLimitsFailed = errMsg.includes(
            "rejected by the GPU adapter probe",
          );
          if (isLimitsFailed && backend === "webgpu") {
            cacheWebGPULimitsFailed();
            PerformanceProfiler.logInfo(
              `WebGPU hardware limits check failed — skipped for all future runs`,
            );
          }

          profiler.fail(
            `Backend ${backend.toUpperCase()}`,
            e,
            nextBackend?.toUpperCase(),
          );
          lastError = e;
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
      triggerBgRemovalSuccess();
    } catch (e) {
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
