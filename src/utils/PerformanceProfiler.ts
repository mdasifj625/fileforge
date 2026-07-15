/* eslint-disable @typescript-eslint/no-explicit-any */
export class PerformanceProfiler {
  private readonly name: string;
  private readonly timings: Map<
    string,
    { start: number; end?: number; duration?: number }
  > = new Map();
  private metadata: Record<string, any> = {};
  private readonly enabled: boolean = true;

  // Attempt-level tracking for cumulative summary
  private attempts: Array<{
    label: string;
    startMs: number;
    endMs?: number;
    status?: "success" | "failed";
  }> = [];
  private currentAttemptIndex = -1;

  constructor(name: string, enabled: boolean = true) {
    this.name = name;
    this.enabled = enabled;
  }

  // ─── Static Utilities ────────────────────────────────────────────────────

  /** Log a structured browser environment inspection as part of the profiler output */
  static logEnvironment() {
    const ts = () => new Date().toISOString().split("T")[1].replace("Z", "");
    const gpu =
      typeof navigator !== "undefined" && (navigator as any).gpu
        ? "✅ Available"
        : "❌ Not Available";
    const ml =
      typeof navigator !== "undefined" && (navigator as any).ml
        ? "✅ Available"
        : "❌ Not Available";
    const sab = typeof SharedArrayBuffer !== "undefined" ? "✅ Yes" : "❌ No";
    const coi =
      typeof crossOriginIsolated !== "undefined"
        ? String(crossOriginIsolated)
        : "false";
    const threads =
      (globalThis as any).env?.backends?.onnx?.wasm?.numThreads ?? "?";

    console.log(
      `[${ts()}] ════════════════════════════════════════════\n` +
        `[${ts()}] 🌐 BROWSER ENVIRONMENT\n` +
        `[${ts()}] ════════════════════════════════════════════\n` +
        `[${ts()}]   Browser:              ${typeof navigator !== "undefined" ? navigator.userAgent : "Node"}\n` +
        `[${ts()}]   Hardware Concurrency: ${typeof navigator !== "undefined" ? navigator.hardwareConcurrency : "?"}\n` +
        `[${ts()}]   crossOriginIsolated:  ${coi}\n` +
        `[${ts()}]   SharedArrayBuffer:    ${sab}\n` +
        `[${ts()}]   WebGPU:               ${gpu}\n` +
        `[${ts()}]   WebNN:                ${ml}\n` +
        `[${ts()}]   ONNX Threads:         ${threads}\n` +
        `[${ts()}] ════════════════════════════════════════════`,
    );
  }

  /** Log detailed GPU adapter limits and info — critical for diagnosing mobile WebGPU failures */
  static logGPUAdapter(info: {
    vendor: string;
    architecture: string;
    description: string;
    maxBufferSize: number;
    maxStorageBufferBindingSize: number;
    features: string[];
  }) {
    const ts = () => new Date().toISOString().split("T")[1].replace("Z", "");
    const mb = (n: number) => `${(n / 1024 / 1024).toFixed(0)} MB`;
    console.log(
      `[${ts()}] ════════════════════════════════════════════\n` +
        `[${ts()}] 🎮 GPU ADAPTER INFO\n` +
        `[${ts()}] ════════════════════════════════════════════\n` +
        `[${ts()}]   Vendor:                        ${info.vendor}\n` +
        `[${ts()}]   Architecture:                  ${info.architecture}\n` +
        `[${ts()}]   Description:                   ${info.description}\n` +
        `[${ts()}]   maxBufferSize:                 ${mb(info.maxBufferSize)}\n` +
        `[${ts()}]   maxStorageBufferBindingSize:   ${mb(info.maxStorageBufferBindingSize)}\n` +
        `[${ts()}]   Features:                      ${info.features.slice(0, 6).join(", ") || "none"}\n` +
        `[${ts()}] ════════════════════════════════════════════`,
    );
  }

  /** Log a plain informational message with a timestamp */
  static logInfo(message: string) {
    const ts = new Date().toISOString().split("T")[1].replace("Z", "");
    console.log(`[${ts}] ℹ️  ${message}`);
  }

  // ─── Private helpers ────────────────────────────────────────────────────

  private ts(): string {
    return new Date().toISOString().split("T")[1].replace("Z", "");
  }

  private formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)} s`;
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    return `${minutes}m ${remSeconds.toFixed(2)}s`;
  }

  // ─── Metadata ────────────────────────────────────────────────────────────

  setMetadata(key: string, value: any) {
    if (!this.enabled) return;
    this.metadata[key] = value;
  }

  // ─── Attempt-level logging ───────────────────────────────────────────────

  /** Log a clear attempt banner and start tracking its duration */
  attempt(index: number, total: number, label: string) {
    if (!this.enabled) return;
    this.currentAttemptIndex = index;
    this.attempts[index] = { label, startMs: Date.now() };
    console.log(
      `[${this.ts()}] ════════════════════════════════════\n` +
        `[${this.ts()}] 🚀 ATTEMPT ${index + 1}/${total}: ${label}\n` +
        `[${this.ts()}] ════════════════════════════════════`,
    );
  }

  /** Mark the current attempt as succeeded */
  succeed(label: string) {
    if (!this.enabled) return;
    if (
      this.currentAttemptIndex >= 0 &&
      this.attempts[this.currentAttemptIndex]
    ) {
      this.attempts[this.currentAttemptIndex].endMs = Date.now();
      this.attempts[this.currentAttemptIndex].status = "success";
    }
    console.log(`[${this.ts()}] ✅ ${label} — SUCCESS`);
  }

  /** Mark the current attempt as failed and log a clean one-line reason */
  fail(label: string, error: any, fallbackLabel?: string) {
    if (!this.enabled) return;
    if (
      this.currentAttemptIndex >= 0 &&
      this.attempts[this.currentAttemptIndex]
    ) {
      this.attempts[this.currentAttemptIndex].endMs = Date.now();
      this.attempts[this.currentAttemptIndex].status = "failed";
    }
    const raw = error?.message ?? String(error);
    const shortReason = raw.split("\n")[0].substring(0, 200);
    const fallback = fallbackLabel
      ? `\n[${this.ts()}]    ⚠️  Falling back to ${fallbackLabel}...`
      : `\n[${this.ts()}]    💀 No more fallbacks available.`;
    console.log(
      `[${this.ts()}] ❌ ${label} — FAILED\n` +
        `[${this.ts()}]    Reason: ${shortReason}` +
        fallback,
    );
  }

  // ─── Step-level logging ───────────────────────────────────────────────────

  start(step: string) {
    if (!this.enabled) return;
    console.log(`[${this.ts()}] ▶ [${this.name}] Starting: ${step}...`);
    this.timings.set(step, { start: performance.now() });
  }

  end(step: string) {
    if (!this.enabled) return;
    const timing = this.timings.get(step);
    if (timing && !timing.end) {
      timing.end = performance.now();
      timing.duration = timing.end - timing.start;
      console.log(
        `[${this.ts()}] ✔ [${this.name}] Finished: ${step} in ${this.formatTime(timing.duration)}`,
      );
    }
  }

  // ─── Summary & Report ────────────────────────────────────────────────────

  /** Print a cumulative table of all attempts with their durations and final total */
  summary() {
    if (!this.enabled || this.attempts.length === 0) return;

    let totalMs = 0;
    let out =
      `[${this.ts()}] ════════════════════════════════════════════\n` +
      `[${this.ts()}] 📊 CUMULATIVE ATTEMPT SUMMARY\n` +
      `[${this.ts()}] ════════════════════════════════════════════\n`;

    this.attempts.forEach((a, i) => {
      const elapsed = a.endMs ? a.endMs - a.startMs : null;
      if (elapsed !== null) totalMs += elapsed;
      const icon = a.status === "success" ? "✅" : "❌";
      const time = elapsed !== null ? this.formatTime(elapsed) : "N/A";
      out += `[${this.ts()}]   ${icon} Attempt ${i + 1} — ${a.label}\n`;
      out += `[${this.ts()}]      Time taken: ${time}\n`;
    });

    out +=
      `[${this.ts()}] ────────────────────────────────────────────\n` +
      `[${this.ts()}]   🕐 Total time across all attempts: ${this.formatTime(totalMs)}\n` +
      `[${this.ts()}] ════════════════════════════════════════════`;

    console.log(out);
  }

  /** Detailed per-step report for the successful attempt */
  report(): string {
    if (!this.enabled) return "";
    let totalTime = 0;
    let out = "";

    out += `====================================\n`;
    out += `${this.name.toUpperCase()} PROFILING SUMMARY\n`;
    out += `====================================\n`;

    if (Object.keys(this.metadata).length > 0) {
      out += `\nMetadata:\n`;
      out += `-------------\n`;
      for (const [k, v] of Object.entries(this.metadata)) {
        out += `${k}: ${v}\n`;
      }
    }

    out += `\nSteps:\n`;
    out += `-------------\n`;
    let stepCount = 1;
    for (const [step, timing] of this.timings.entries()) {
      if (timing.duration !== undefined) {
        out += `STEP ${stepCount}\n`;
        out += `${step}\n`;
        out += `Time: ${this.formatTime(timing.duration)}\n\n`;
        totalTime += timing.duration;
        stepCount++;
      }
    }

    out += `TOTAL TIME: ${this.formatTime(totalTime)}\n`;
    out += `====================================\n`;

    return out;
  }
}
