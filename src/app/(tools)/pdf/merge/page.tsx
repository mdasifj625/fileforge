"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import { FileText, GripVertical, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function PDFMergePage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);
  const layers = useWorkspaceStore((state) => state.layers);
  const removeLayer = useWorkspaceStore((state) => state.removeLayer);

  // Filter only PDF layers
  const [pdfFiles, setPdfFiles] = useState<
    { id: string; name: string; size: number }[]
  >([]);

  useEffect(() => {
    setActiveTool("pdf-merge");
  }, [setActiveTool]);

  useEffect(() => {
    const loadPdfs = async () => {
      const pdfs = [];
      for (const layer of layers) {
        const fileData = await db.files.get(layer.fileId);
        if (fileData && fileData.type === "application/pdf") {
          pdfs.push({
            id: layer.id,
            name: layer.name,
            size: fileData.size,
          });
        }
      }
      setPdfFiles(pdfs);
    };
    loadPdfs();
  }, [layers]);

  const onDrop = async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if (file.type !== "application/pdf") continue;

      const fileId = crypto.randomUUID();
      const layerId = crypto.randomUUID();

      const buffer = await file.arrayBuffer();
      const normalizedBlob = new Blob([buffer], { type: file.type });

      await db.files.add({
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        blob: normalizedBlob,
        createdAt: Date.now(),
      });

      useWorkspaceStore.getState().addLayer({
        id: layerId,
        fileId: fileId,
        originalFileId: fileId,
        name: file.name,
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        originalWidth: 0,
        originalHeight: 0,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "application/pdf": [],
    },
  });

  return (
    <div
      {...getRootProps()}
      className="absolute inset-0 z-10 bg-panel overflow-y-auto p-8 outline-none"
    >
      <input {...getInputProps()} />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            PDF Merge Studio
          </h1>
          <p className="text-muted-foreground">
            Drop PDF files anywhere on the screen. Drag to reorder, then export
            to merge them into a single document.
          </p>
        </div>

        {pdfFiles.length === 0 ? (
          <div className="border-2 border-dashed border-panel-border hover:border-primary/50 transition-colors rounded-xl h-64 flex flex-col items-center justify-center text-muted-foreground">
            <FileText size={48} className="mb-4 opacity-50" />
            <p>No PDFs uploaded yet.</p>
            <p className="text-sm mt-2">Drag and drop PDF files here, or</p>
            <button
              onClick={open}
              className="mt-4 px-4 py-2 bg-primary/10 text-primary font-medium rounded-lg hover:bg-primary/20 transition-colors"
            >
              Browse Files
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pdfFiles.map((pdf, index) => (
              <div
                key={pdf.id}
                className="flex items-center gap-4 p-4 bg-background border border-panel-border rounded-xl shadow-sm group"
              >
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical size={20} />
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {pdf.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {(pdf.size / 1024 / 1024).toFixed(2)} MB • Document{" "}
                    {index + 1}
                  </p>
                </div>
                <button
                  onClick={() => removeLayer(pdf.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove PDF"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
