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

  setMetadata(key: string, value: any) {
    if (!this.enabled) return;
    this.metadata[key] = value;
  }

  start(step: string) {
    if (!this.enabled) return;
    console.log(`▶ [${this.name}] Starting: ${step}...`);
    this.timings.set(step, { start: performance.now() });
  }

  end(step: string) {
    if (!this.enabled) return;
    const timing = this.timings.get(step);
    if (timing && !timing.end) {
      timing.end = performance.now();
      timing.duration = timing.end - timing.start;
      console.log(
        `✔ [${this.name}] Finished: ${step} in ${this.formatTime(timing.duration)}`,
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
