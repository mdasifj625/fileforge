import React from "react";

export function VideoTrimSettings() {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Trim Settings
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Click Export in the top bar to apply trim. Note: For the demo, trim cuts
        exactly from 0s to 5s. Full interactive timeline coming soon!
      </p>
      <div className="bg-primary/10 border border-primary/20 text-primary text-xs p-3 rounded-lg">
        Click the <strong>Export</strong> button in the top bar to save this
        video.
      </div>
    </div>
  );
}
