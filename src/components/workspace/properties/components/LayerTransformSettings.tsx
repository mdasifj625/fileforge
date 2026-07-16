import React, { useState } from "react";
import { Layer as FileLayer } from "@/types/layer";
import { Link, Unlock } from "lucide-react";

interface Props {
  activeLayer: FileLayer;
  handleTransformChange: (key: string, value: string) => void;
  updateLayerTransform?: (id: string, updates: Partial<FileLayer>) => void;
}

export function LayerTransformSettings({
  activeLayer,
  handleTransformChange,
  updateLayerTransform,
}: Props) {
  const [lockAspect, setLockAspect] = useState(true);

  const handleWidthChange = (val: string) => {
    const scaleX = parseFloat(val) / 100;
    if (!isNaN(scaleX)) {
      if (lockAspect && updateLayerTransform) {
        updateLayerTransform(activeLayer.id, { scaleX, scaleY: scaleX });
      } else {
        handleTransformChange("scaleX", scaleX.toString());
      }
    }
  };

  const handleHeightChange = (val: string) => {
    const scaleY = parseFloat(val) / 100;
    if (!isNaN(scaleY)) {
      if (lockAspect && updateLayerTransform) {
        updateLayerTransform(activeLayer.id, { scaleX: scaleY, scaleY });
      } else {
        handleTransformChange("scaleY", scaleY.toString());
      }
    }
  };

  const handleUniformScale = (val: string) => {
    const scale = parseFloat(val) / 100;
    if (!isNaN(scale) && updateLayerTransform) {
      updateLayerTransform(activeLayer.id, { scaleX: scale, scaleY: scale });
    } else {
      handleTransformChange("scaleX", scale.toString());
      handleTransformChange("scaleY", scale.toString());
    }
  };

  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Transform
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* X Position */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              X
            </label>
            <div className="relative">
              <input
                type="number"
                value={Math.round(activeLayer.x)}
                onChange={(e) => handleTransformChange("x", e.target.value)}
                className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Y Position */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Y
            </label>
            <input
              type="number"
              value={Math.round(activeLayer.y)}
              onChange={(e) => handleTransformChange("y", e.target.value)}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          {/* Scale X */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Width (%)
            </label>
            <input
              type="number"
              value={Math.round(activeLayer.scaleX * 100)}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>

          {/* Aspect Lock */}
          <button
            onClick={() => setLockAspect(!lockAspect)}
            className={`p-2 rounded-lg mt-5 transition-colors ${lockAspect ? "bg-primary text-primary-foreground" : "bg-panel border border-panel-border text-muted-foreground"}`}
            title={lockAspect ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
          >
            {lockAspect ? <Link size={14} /> : <Unlock size={14} />}
          </button>

          {/* Scale Y */}
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Height (%)
            </label>
            <input
              type="number"
              value={Math.round(activeLayer.scaleY * 100)}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary font-mono"
            />
          </div>
        </div>

        {/* Uniform Size Slider */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Size
            </label>
            <span className="text-xs font-mono">
              {Math.round(activeLayer.scaleX * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={10}
            max={500}
            value={Math.round(activeLayer.scaleX * 100)}
            onChange={(e) => handleUniformScale(e.target.value)}
            className="w-full accent-primary h-2 bg-panel-border rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
