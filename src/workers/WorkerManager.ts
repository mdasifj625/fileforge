import * as Comlink from "comlink";
import type { AIProcessor } from "@/workers/ai/rmbg/rmbg.worker";
import { useAIStore } from "@/store";

// A singleton to manage background worker instances and pre-loading
class WorkerManagerClass {
  private rmbgWorker: Worker | null = null;
  private rmbgApi: Comlink.Remote<AIProcessor> | null = null;
  private rmbgPreloading = false;
  private rmbgPreloadPromise: Promise<void> | null = null;

  /**
   * Spun up the worker and begin loading the heavy AI models into VRAM.
   * This should be called the exact moment a user navigates to an AI tool page.
   */
  public preloadRMBGModel(backend: string = "wasm"): Promise<void> {
    if (this.rmbgPreloadPromise) {
      return this.rmbgPreloadPromise;
    }

    if (!this.rmbgWorker) {
      this.rmbgWorker = new Worker(
        new URL("@/workers/ai/rmbg/rmbg.worker", import.meta.url),
        { type: "module" },
      );
      this.rmbgApi = Comlink.wrap<AIProcessor>(this.rmbgWorker);
    }

    const { setAiProgress, setAiProgressPhase } = useAIStore.getState();

    this.rmbgPreloading = true;
    setAiProgressPhase("model");
    setAiProgress(0);

    this.rmbgPreloadPromise = this.rmbgApi!.loadModel(
      Comlink.proxy((progress: number) => {
        if (progress >= 0) {
          // Map 0-100% of model loading to 0-40% of overall progress
          setAiProgress(Math.round(progress * 0.4));
        }
      }),
      backend,
    )
      .then(() => {
        this.rmbgPreloading = false;
        setAiProgress(40); // model load finished
      })
      .catch((e) => {
        this.rmbgPreloading = false;
        this.rmbgPreloadPromise = null;
        throw e;
      });

    return this.rmbgPreloadPromise;
  }

  public getRMBGApi(): {
    api: Comlink.Remote<AIProcessor> | null;
    worker: Worker | null;
  } {
    return { api: this.rmbgApi, worker: this.rmbgWorker };
  }

  public terminateRMBG() {
    if (this.rmbgWorker) {
      this.rmbgWorker.terminate();
      this.rmbgWorker = null;
      this.rmbgApi = null;
      this.rmbgPreloadPromise = null;
      this.rmbgPreloading = false;
    }
  }
}

export const WorkerManager = new WorkerManagerClass();
