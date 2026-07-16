import React from "react";
import { useToolStore } from "@/store/useToolStore";

export function CompressSettings() {
  const activeTool = useToolStore((s) => s.activeTool);

  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Ready to Compress
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        All output settings (format, quality, resolution) are configured during
        the final step.
      </p>
      <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
        Click the{" "}
        <strong>{activeTool === "compress" ? "Compress" : "Export"}</strong>{" "}
        button in the top bar to adjust quality and save your file.
      </div>
    </div>
  );
}
