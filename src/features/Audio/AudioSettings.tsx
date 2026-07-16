import React from "react";

export function AudioSettings() {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Audio Settings
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Adjust your audio options. Audio processing is completely local via
        WASM.
      </p>
      <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
        Click the <strong>Export</strong> button in the top bar to process and
        save this audio file.
      </div>
    </div>
  );
}
