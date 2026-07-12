import * as Comlink from "comlink";
import { PDFDocument } from "pdf-lib";

const pdfProcessor = {
  async ping() {
    return "pong from pdf worker";
  },

  async mergePdfs(
    files: { blob: Blob; pageOrder?: number[] }[],
  ): Promise<Blob> {
    console.log("Worker: Merging PDFs...");

    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const arrayBuffer = await file.blob.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);

      const pageIndices = file.pageOrder
        ? file.pageOrder.map((num) => num - 1) // Convert 1-indexed to 0-indexed
        : pdf.getPageIndices();

      if (pageIndices.length === 0) continue;

      const copiedPages = await mergedPdf.copyPages(pdf, pageIndices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    const mergedPdfBytes = await mergedPdf.save();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Blob([mergedPdfBytes as any], { type: "application/pdf" });
  },
};

export type PdfProcessor = typeof pdfProcessor;
Comlink.expose(pdfProcessor);
