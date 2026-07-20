import { useState, useEffect, useRef } from "react";
export function useTimer(
  isFiltering: boolean,
  aiProgressBackend: string | null,
) {
  const [elapsed, setElapsed] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(15);
  const [bufferAdded, setBufferAdded] = useState(false);
  const phase2StartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isFiltering) {
      setTimeout(() => {
        setElapsed(0);
        setBufferAdded(false);
      }, 0);
      phase2StartRef.current = null;
      return;
    }
    const start = Date.now();
    const cores =
      typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const initialTarget =
      aiProgressBackend === "webgpu"
        ? Math.max(20, Math.round(25 * (16 / cores)))
        : Math.max(25, Math.round(30 * (16 / cores)));
    setTimeout(() => {
      setTargetSeconds(initialTarget);
    }, 0);

    const interval = setInterval(() => {
      const currentElapsedMs = Date.now() - start;
      setElapsed(currentElapsedMs);

      const elapsedSecs = currentElapsedMs / 1000;
      setTargetSeconds((prev) => {
        if (elapsedSecs >= prev - 1.5) {
          setBufferAdded(true);
          return prev + 10;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isFiltering, aiProgressBackend]);

  return { elapsed, targetSeconds, bufferAdded, phase2StartRef };
}
