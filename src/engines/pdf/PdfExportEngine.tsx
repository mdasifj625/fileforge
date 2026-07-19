import React from "react";
import { IExportEngine } from "../types";
import { Download } from "lucide-react";

function PdfExportUI({ onClose }: { onClose: () => void }) {
  const handleDownload = () => {
    // PDF Export Logic will go here using pdf-lib inside a background worker
    alert("PDF Export initiated!");
    onClose();
  };

  return (
    <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[300px] w-full max-w-lg mx-auto gap-6 bg-panel">
      <h2 className="text-xl font-bold text-foreground">Export PDF Document</h2>

      <p className="text-sm text-muted-foreground text-center">
        Your document will be compiled and exported directly in your browser. No
        files are uploaded to any server.
      </p>

      <button
        onClick={handleDownload}
        className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 group"
      >
        <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
        Compile & Download PDF
      </button>

      <button
        onClick={onClose}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

export class PdfExportEngine implements IExportEngine {
  id = "pdf";

  getUI(onClose: () => void): React.ReactNode {
    return <PdfExportUI onClose={onClose} />;
  }
}

export const pdfExportEngine = new PdfExportEngine();
