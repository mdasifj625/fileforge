"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { db } from "@/db";
import { FileText, GripVertical, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import dynamic from "next/dynamic";

const PDFFileViewer = dynamic(
  () =>
    import("@/components/workspace/PDFFileViewer").then(
      (mod) => mod.PDFFileViewer,
    ),
  { ssr: false },
);

interface PdfFileData {
  id: string;
  name: string;
  size: number;
  blob: Blob;
}

export default function PDFMergePage() {
  const setActiveTool = useWorkspaceStore((state) => state.setActiveTool);
  const layers = useWorkspaceStore((state) => state.layers);
  const removeLayer = useWorkspaceStore((state) => state.removeLayer);

  const [pdfFiles, setPdfFiles] = useState<PdfFileData[]>([]);

  useEffect(() => {
    setActiveTool("pdf-merge");
  }, [setActiveTool]);

  useEffect(() => {
    const loadPdfs = async () => {
      const pdfs: PdfFileData[] = [];
      for (const layer of layers) {
        const fileData = await db.files.get(layer.fileId);
        if (fileData && fileData.type === "application/pdf") {
          pdfs.push({
            id: layer.id,
            name: layer.name,
            size: fileData.size,
            blob: fileData.blob,
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

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "application/pdf": [],
    },
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // We need to reorder the items in the Zustand store layers
    const store = useWorkspaceStore.getState();
    const currentLayers = [...store.layers];

    // Since layers might contain non-PDF layers, we must only swap the PDF layers.
    // To make it easy, we find the absolute indices in the global layers array.
    const sourcePdf = pdfFiles[result.source.index];
    const destPdf = pdfFiles[result.destination.index];

    const sourceIndex = currentLayers.findIndex((l) => l.id === sourcePdf.id);
    const destIndex = currentLayers.findIndex((l) => l.id === destPdf.id);

    if (sourceIndex > -1 && destIndex > -1) {
      const [movedLayer] = currentLayers.splice(sourceIndex, 1);
      currentLayers.splice(destIndex, 0, movedLayer);

      // Update global store directly using an undocumented/hacky way or use a new method
      useWorkspaceStore.setState({ layers: currentLayers });
    }
  };

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
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pdf-list">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-6"
                >
                  {pdfFiles.map((pdf, index) => (
                    <Draggable key={pdf.id} draggableId={pdf.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex flex-col overflow-hidden bg-background border rounded-xl transition-all ${
                            snapshot.isDragging
                              ? "shadow-2xl border-primary/50 rotate-1 scale-[1.02] z-50"
                              : "shadow-sm border-panel-border"
                          }`}
                        >
                          {/* File Header */}
                          <div className="flex items-center gap-4 p-4 bg-muted/30 border-b border-panel-border">
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
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
                                {(pdf.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              onClick={() => removeLayer(pdf.id)}
                              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Remove PDF"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          {/* PDF Page Thumbnails */}
                          <PDFFileViewer blob={pdf.blob} layerId={pdf.id} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {pdfFiles.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={open}
              className="px-6 py-3 bg-panel border border-panel-border text-foreground font-medium rounded-xl hover:bg-muted transition-colors flex items-center gap-2 shadow-sm"
            >
              <FileText size={18} />
              Add More PDFs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
