import React from "react";
import { Layer } from "@/types/layer";
import { useOCR } from "./useOCR";

interface Props {
  layer?: Layer;
}

export function OCRSettings({ layer }: Props) {
  const { applyOCR, isFiltering, aiProgress, ocrText } = useOCR(layer);

  return (
    <div>
      <h3 className="text-xs font-bold text-muted-foreground mb-4 uppercase tracking-widest flex items-center justify-between gap-2">
        <span>Extract Text (OCR)</span>
        {isFiltering && (
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        )}
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={applyOCR}
          disabled={isFiltering}
          className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs py-3 rounded-lg transition-all disabled:opacity-50 font-bold"
        >
          {isFiltering
            ? aiProgress !== null
              ? `Extracting... ${Math.round(aiProgress)}%`
              : "Extracting Text..."
            : "Extract Text"}
        </button>
        <p className="text-xs text-muted-foreground text-center">
          Uses local Tesseract.js model to extract text.
        </p>
      </div>

      {ocrText && (
        <div className="mt-6 flex flex-col gap-2 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Extracted Text
            </label>
            <button
              onClick={() => {
                navigator.clipboard.writeText(ocrText);
                alert("Copied to clipboard!");
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              Copy
            </button>
          </div>
          <textarea
            readOnly
            value={ocrText}
            className="w-full h-40 bg-panel border border-panel-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:border-primary transition-all font-mono resize-none"
          />
        </div>
      )}
    </div>
  );
}
