import React from "react";

interface Props {
  applySmartCrop: () => void;
  isFiltering: boolean;
}

export function SmartCropSettings({ applySmartCrop, isFiltering }: Props) {
  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
        <span>Smart Crop</span>
        {isFiltering && (
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={applySmartCrop}
          disabled={isFiltering}
          className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
        >
          {isFiltering ? "Cropping..." : "Apply Smart Crop"}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Automatically scans the image and trims away empty or transparent
          borders.
        </p>
      </div>
    </div>
  );
}
