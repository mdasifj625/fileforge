/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ImageIcon } from "lucide-react";
import { formatSize } from "@/components/workspace/export/utils";

interface ExportPreviewProps {
  isProcessing: boolean;
  previewBlob: Blob | null;
  fileSize: number | null;
}

export function ExportPreview({
  isProcessing,
  previewBlob,
  fileSize,
}: ExportPreviewProps) {
  return (
    <div className="flex-1 bg-background flex flex-col relative min-h-0">
      <div className="hidden md:flex px-6 border-b border-panel-border justify-between items-center h-15 shrink-0">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base text-foreground">Live Preview</h3>
        </div>
        {fileSize && (
          <span className="text-xs font-mono text-primary-foreground bg-primary px-3 py-1.5 rounded-full shadow-sm">
            {formatSize(fileSize)}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-hidden p-6 md:p-10 bg-muted/10 flex flex-col items-center justify-center relative z-0">
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm transition-all duration-200">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {previewBlob ? (
          <div className="relative max-w-full max-h-full rounded-md overflow-hidden shadow-sm border border-panel-border bg-background flex items-center justify-center">
            <img
              src={URL.createObjectURL(previewBlob)}
              alt="Export Preview"
              className="max-w-full max-h-full object-contain"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: "20px 20px",
                backgroundPosition: "center",
              }}
            />
            {fileSize && (
              <div className="absolute bottom-2 right-2 md:hidden bg-background/80 backdrop-blur-sm text-[10px] font-mono px-2 py-1 rounded shadow-sm border border-panel-border z-10">
                {formatSize(fileSize)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-2">
            <ImageIcon className="w-8 h-8 opacity-50" />
            <p className="text-sm">Preparing preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}
