import React from "react";
import { Layer } from "@/types/layer";
import { useLayerStore } from "@/store/useLayerStore";

interface Props {
  layer?: Layer;
}

export function AppearanceSettings({ layer }: Readonly<Props>) {
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);

  if (!layer) return null;

  const handleTransformChange = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(layer.id, { [key]: num }, false);
    }
  };

  const handleTransformCommit = (key: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      updateLayerTransform(layer.id, { [key]: num }, true);
    }
  };
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Appearance
      </h3>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Opacity
            </label>
            <span className="text-xs font-mono text-foreground">
              {Math.round((layer.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={layer.opacity ?? 1}
            onChange={(e) => handleTransformChange("opacity", e.target.value)}
            onPointerUp={(e) =>
              handleTransformCommit(
                "opacity",
                (e.target as HTMLInputElement).value,
              )
            }
            className="w-full accent-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Blend Mode
          </label>
          <select
            value={layer.blendMode || "normal"}
            onChange={(e) =>
              updateLayerTransform(layer.id, {
                blendMode: e.target.value as Layer["blendMode"],
              })
            }
            className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          >
            <option value="normal">Normal</option>
            <option value="multiply">Multiply</option>
            <option value="screen">Screen</option>
            <option value="overlay">Overlay</option>
            <option value="darken">Darken</option>
            <option value="lighten">Lighten</option>
          </select>
        </div>
      </div>
    </div>
  );
}
