import React, { useState } from "react";
import { ImageLayer, Layer } from "@/types/layer";
import { useLayerStore } from "@/store";
import { Link2, Link2Off } from "lucide-react";

interface Props {
  layer?: Layer;
}

export function ResizeSettings({ layer }: Props) {
  if (!layer || layer.type !== "image") return null;
  return <ResizeSettingsInner layer={layer as ImageLayer} />;
}

function ResizeSettingsInner({ layer }: { layer: ImageLayer }) {
  const updateLayerTransform = useLayerStore((s) => s.updateLayerTransform);
  const [lockRatio, setLockRatio] = useState(true);
  const [doNotEnlarge, setDoNotEnlarge] = useState(false);

  const storeWidth = Math.round(layer.originalWidth * Math.abs(layer.scaleX));
  const storeHeight = Math.round(layer.originalHeight * Math.abs(layer.scaleY));
  const storeScale = Math.round(Math.abs(layer.scaleX) * 100);

  const [inputWidth, setInputWidth] = useState(storeWidth.toString());
  const [prevStoreWidth, setPrevStoreWidth] = useState(storeWidth);

  if (storeWidth !== prevStoreWidth) {
    setPrevStoreWidth(storeWidth);
    if (parseFloat(inputWidth) !== storeWidth && inputWidth !== "") {
      setInputWidth(storeWidth.toString());
    }
  }

  const [inputHeight, setInputHeight] = useState(storeHeight.toString());
  const [prevStoreHeight, setPrevStoreHeight] = useState(storeHeight);

  if (storeHeight !== prevStoreHeight) {
    setPrevStoreHeight(storeHeight);
    if (parseFloat(inputHeight) !== storeHeight && inputHeight !== "") {
      setInputHeight(storeHeight.toString());
    }
  }

  const [inputScale, setInputScale] = useState(storeScale.toString());
  const [prevStoreScale, setPrevStoreScale] = useState(storeScale);

  if (storeScale !== prevStoreScale) {
    setPrevStoreScale(storeScale);
    if (parseFloat(inputScale) !== storeScale && inputScale !== "") {
      setInputScale(storeScale.toString());
    }
  }

  const handleWidthChange = (valStr: string) => {
    setInputWidth(valStr);
    const val = parseFloat(valStr);
    if (isNaN(val) || val <= 0) return;

    let newScaleX = val / layer.originalWidth;
    if (doNotEnlarge && newScaleX > 1) newScaleX = 1;

    const signX = layer.scaleX < 0 ? -1 : 1;

    if (lockRatio) {
      const signY = layer.scaleY < 0 ? -1 : 1;
      updateLayerTransform(layer.id, {
        scaleX: newScaleX * signX,
        scaleY: newScaleX * signY,
      });
    } else {
      updateLayerTransform(layer.id, {
        scaleX: newScaleX * signX,
      });
    }
  };

  const handleHeightChange = (valStr: string) => {
    setInputHeight(valStr);
    const val = Number.parseFloat(valStr);
    if (Number.isNaN(val) || val <= 0) return;

    let newScaleY = val / layer.originalHeight;
    if (doNotEnlarge && newScaleY > 1) newScaleY = 1;

    const signY = layer.scaleY < 0 ? -1 : 1;

    if (lockRatio) {
      const signX = layer.scaleX < 0 ? -1 : 1;
      updateLayerTransform(layer.id, {
        scaleX: newScaleY * signX,
        scaleY: newScaleY * signY,
      });
    } else {
      updateLayerTransform(layer.id, {
        scaleY: newScaleY * signY,
      });
    }
  };

  const handleScaleChange = (valStr: string | number) => {
    const isStr = typeof valStr === "string";
    if (isStr) setInputScale(valStr);

    const val = typeof valStr === "string" ? Number.parseFloat(valStr) : valStr;
    if (Number.isNaN(val) || val <= 0) return;

    let newScale = val / 100;
    if (doNotEnlarge && newScale > 1) newScale = 1;

    const signX = layer.scaleX < 0 ? -1 : 1;
    const signY = layer.scaleY < 0 ? -1 : 1;

    updateLayerTransform(layer.id, {
      scaleX: newScale * signX,
      scaleY: newScale * signY,
    });
  };

  React.useEffect(() => {
    if (doNotEnlarge && storeScale > 100) {
      const signX = layer.scaleX < 0 ? -1 : 1;
      const signY = layer.scaleY < 0 ? -1 : 1;

      updateLayerTransform(layer.id, {
        scaleX: 1 * signX,
        scaleY: 1 * signY,
      });
    }
  }, [
    storeScale,
    doNotEnlarge,
    layer.id,
    layer.scaleX,
    layer.scaleY,
    updateLayerTransform,
  ]);

  const presets = [
    { label: "25%", value: 25 },
    { label: "50%", value: 50 },
    { label: "1x", value: 100 },
    { label: "2x", value: 200 },
    { label: "4x", value: 400 },
  ];

  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
        Resize Image
      </h3>

      <div className="flex flex-col gap-4">
        {/* Dimensions Inputs */}
        <div className="flex items-end gap-2">
          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Width (px)
            </label>
            <input
              type="number"
              value={inputWidth}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] text-left"
            />
          </div>

          <button
            onClick={() => setLockRatio(!lockRatio)}
            className={`p-2 rounded-lg border transition-colors flex-shrink-0 h-[34px] flex items-center justify-center ${
              lockRatio
                ? "bg-primary/10 border-primary text-primary"
                : "bg-panel border-panel-border text-muted-foreground hover:bg-muted"
            }`}
            title={lockRatio ? "Unlock Aspect Ratio" : "Lock Aspect Ratio"}
          >
            {lockRatio ? <Link2 size={16} /> : <Link2Off size={16} />}
          </button>

          <div className="flex-1 flex flex-col gap-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Height (px)
            </label>
            <input
              type="number"
              value={inputHeight}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full bg-panel border border-panel-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield] text-left"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="doNotEnlarge"
            className="accent-primary"
            checked={doNotEnlarge}
            onChange={(e) => {
              const checked = e.target.checked;
              setDoNotEnlarge(checked);
              if (checked) {
                handleScaleChange(100);
              }
            }}
          />
          <label
            htmlFor="doNotEnlarge"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Do not enlarge if smaller
          </label>
        </div>

        {/* Scale Slider */}
        <div className="flex flex-col gap-2 pt-2 border-t border-panel-border">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Scale (%)
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={inputScale}
                onChange={(e) => handleScaleChange(e.target.value)}
                className="w-14 bg-panel border border-panel-border rounded p-1 text-[10px] text-left text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <input
            type="range"
            min="10"
            max={Math.max(doNotEnlarge ? 100 : 400, storeScale)}
            step="1"
            value={storeScale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="w-full accent-primary"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-5 gap-1 mt-1">
            {presets.map((preset) => {
              const isDisabled = doNotEnlarge && preset.value > 100;
              return (
                <button
                  key={preset.value}
                  onClick={() => handleScaleChange(preset.value)}
                  disabled={isDisabled}
                  className={`py-1 text-[10px] font-bold rounded-md transition-colors ${
                    storeScale === preset.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-panel border border-panel-border text-foreground hover:border-primary/50"
                  } ${isDisabled ? "opacity-30 cursor-not-allowed" : ""}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
