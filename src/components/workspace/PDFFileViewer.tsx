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
import { Trash2, Eye, X } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFFileViewerProps {
  blob: Blob;
  layerId: string;
}

export function PDFFileViewer({ blob, layerId }: PDFFileViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [previewPageNum, setPreviewPageNum] = useState<number | null>(null);

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

  const removePage = (indexToRemove: number) => {
    const newOrder = [...pageOrder];
    newOrder.splice(indexToRemove, 1);
    updateLayerTransform(layerId, { pageOrder: newOrder });
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
                {pageOrder.length === 0 && numPages && (
                  <div className="h-32 w-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-panel-border rounded-lg px-8">
                    All pages removed
                  </div>
                )}
                {pageOrder.map((pageNum, index) => (
                  <Draggable
                    key={`page_${pageNum}_${index}`}
                    draggableId={`page_${pageNum}_${index}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex-shrink-0 border border-panel-border shadow-sm bg-background rounded-md overflow-hidden relative group cursor-grab active:cursor-grabbing transition-transform ${snapshot.isDragging ? "z-50 scale-105 shadow-xl rotate-2" : ""}`}
                      >
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded z-30 backdrop-blur-sm pointer-events-none">
                          {index + 1}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col items-center justify-center gap-3 backdrop-blur-[1px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewPageNum(pageNum);
                            }}
                            className="p-2 bg-white/20 hover:bg-white text-white hover:text-black rounded-full transition-all shadow-sm backdrop-blur-sm"
                            title="Preview Page"
                          >
                            <Eye size={18} />
                          </button>
                        </div>

                        {/* Top Right Simple Delete */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePage(index);
                          }}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-white hover:text-red-400 bg-black/40 hover:bg-black/80 rounded z-30 transition-all pointer-events-auto"
                          title="Remove Page"
                        >
                          <Trash2 size={12} />
                        </button>

                        <Page
                          pageNumber={pageNum}
                          width={160}
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

      {/* Full Page Preview Modal */}
      {previewPageNum !== null && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setPreviewPageNum(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-y-auto bg-panel rounded-xl shadow-2xl border border-panel-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 right-0 p-4 flex justify-end z-50 pointer-events-none">
              <button
                onClick={() => setPreviewPageNum(null)}
                className="p-2 bg-black/50 text-white rounded-full hover:bg-black/80 backdrop-blur-md pointer-events-auto transition-colors"
                title="Close Preview"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 pt-0 flex justify-center">
              <Document file={fileUrl}>
                <Page
                  pageNumber={previewPageNum}
                  width={
                    typeof window !== "undefined"
                      ? Math.min(window.innerWidth * 0.9, 800)
                      : 800
                  }
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-md"
                />
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
