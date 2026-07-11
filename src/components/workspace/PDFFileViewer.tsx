import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFFileViewerProps {
  blob: Blob;
  layerId: string;
}

export function PDFFileViewer({ blob, layerId }: PDFFileViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const layer = useWorkspaceStore((state) =>
    state.layers.find((l) => l.id === layerId),
  );
  const updateLayerTransform = useWorkspaceStore(
    (state) => state.updateLayerTransform,
  );

  // The pages as an array of page numbers (1-indexed)
  const pageOrder =
    layer?.pageOrder ||
    (numPages ? Array.from({ length: numPages }, (_, i) => i + 1) : []);

  function onDocumentLoadSuccess({
    numPages: loadedNumPages,
  }: {
    numPages: number;
  }) {
    setNumPages(loadedNumPages);
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(pageOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateLayerTransform(layerId, { pageOrder: items });
  };

  if (!fileUrl) return null;

  return (
    <div className="w-full overflow-x-auto py-4 px-2 no-scrollbar">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="h-32 w-24 bg-muted animate-pulse rounded-lg"></div>
        }
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId={`pdf-pages-${layerId}`}
            direction="horizontal"
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex gap-4 w-max min-h-[160px]"
              >
                {pageOrder.map((pageNum, index) => (
                  <Draggable
                    key={`page_${pageNum}`}
                    draggableId={`page_${pageNum}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex-shrink-0 border border-panel-border shadow-sm bg-white rounded-md overflow-hidden relative group cursor-grab active:cursor-grabbing transition-transform ${snapshot.isDragging ? "z-50 scale-105 shadow-xl rotate-2" : ""}`}
                      >
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-10 backdrop-blur-sm pointer-events-none">
                          {index + 1}
                        </div>
                        <Page
                          pageNumber={pageNum}
                          width={120}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Document>
    </div>
  );
}
