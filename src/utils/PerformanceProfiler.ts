/* eslint-disable @typescript-eslint/no-explicit-any */
export class PerformanceProfiler {
  private readonly name: string;
  private readonly timings: Map<
    string,
    { start: number; end?: number; duration?: number }
  > = new Map();
  private metadata: Record<string, any> = {};
  private readonly enabled: boolean = true;

  constructor(name: string, enabled: boolean = true) {
    this.name = name;
    this.enabled = enabled;
  }

  private ts(): string {
    return new Date().toISOString().split("T")[1].replace("Z", "");
  }

  setMetadata(key: string, value: any) {
    if (!this.enabled) return;
    this.metadata[key] = value;
  }

  /** Log a clear attempt banner — use before each retry loop iteration */
  attempt(index: number, total: number, label: string) {
    if (!this.enabled) return;
    console.log(
      `[${this.ts()}] ════════════════════════════════════\n` +
        `[${this.ts()}] 🚀 ATTEMPT ${index + 1}/${total}: ${label}\n` +
        `[${this.ts()}] ════════════════════════════════════`,
    );
  }

  /** Log a clean one-line success banner */
  succeed(label: string) {
    if (!this.enabled) return;
    console.log(`[${this.ts()}] ✅ ${label} — SUCCESS`);
  }

  /** Log a clean failure with just the first line of the error message — no stack dump */
  fail(label: string, error: any, fallbackLabel?: string) {
    if (!this.enabled) return;
    const raw = error?.message ?? String(error);
    // Take only the first line and cap it to keep logs readable
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

  private formatTime(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(2)} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(2)} s`;
    const minutes = Math.floor(seconds / 60);
    const remSeconds = seconds % 60;
    return `${minutes}m ${remSeconds.toFixed(2)}s`;
  }

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
