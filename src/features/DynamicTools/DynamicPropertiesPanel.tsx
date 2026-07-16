import React, { useState } from "react";
import { ToolDefinition } from "@/lib/toolRegistry";
import { useDynamicTool } from "./useDynamicTool";
import { useLayerStore } from "@/store/useLayerStore";

interface DynamicPropertiesPanelProps {
  tool: ToolDefinition;
}

export function DynamicPropertiesPanel({ tool }: DynamicPropertiesPanelProps) {
  const activeLayerId = useLayerStore((s) => s.activeLayerId);
  const layers = useLayerStore((s) => s.layers);
  const activeLayer = layers.find((l) => l.id === activeLayerId);
  const replaceLayer = useLayerStore((s) => s.replaceLayer);

  const { applyDynamicTool, isProcessing } = useDynamicTool(
    activeLayer,
    replaceLayer,
  );
  // Initialize state with default values from registry
  const [paramsState, setParamsState] = useState<Record<string, unknown>>(
    () => {
      const defaultState: Record<string, unknown> = {};
      tool.params.forEach((param) => {
        defaultState[param.key] = param.defaultValue ?? 0;
      });
      return defaultState;
    },
  );

  const handleParamChange = (key: string, value: unknown) => {
    setParamsState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center gap-2">
          {tool.name} Settings
        </h3>
        {tool.description && (
          <p className="text-xs text-muted-foreground mb-4">
            {tool.description}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {tool.params.map((param) => {
          if (param.type === "slider") {
            return (
              <div key={param.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {param.label}
                  </label>
                  <span className="text-xs font-mono text-foreground">
                    {String(paramsState[param.key])}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min || 0}
                  max={param.max || 100}
                  step={param.step || 1}
                  value={Number(paramsState[param.key])}
                  onChange={(e) =>
                    handleParamChange(param.key, parseFloat(e.target.value))
                  }
                  className="w-full accent-primary"
                  disabled={isProcessing}
                />
              </div>
            );
          }
          // Note: Add 'select' and 'toggle' here as we expand the registry
          return null;
        })}
      </div>

      <button
        className="w-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
        onClick={() => applyDynamicTool(tool.id, paramsState)}
        disabled={isProcessing}
      >
        {isProcessing ? "Processing..." : "Apply " + tool.name}
      </button>
    </div>
  );
}
