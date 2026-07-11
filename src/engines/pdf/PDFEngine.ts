import { PDFDocument } from "pdf-lib";

export class PDFEngine {
  /**
   * Merges multiple PDF blobs into a single PDF blob.
   */
  static async mergePDFs(pdfBlobs: Blob[]): Promise<Blob> {
    const mergedPdf = await PDFDocument.create();

    for (const blob of pdfBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(
        pdfDoc,
        pdfDoc.getPageIndices(),
      );
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([mergedPdfBytes.buffer as ArrayBuffer], {
      type: "application/pdf",
    });
  }

  /**
   * Splits a PDF into multiple single-page PDFs.
   */
  static async splitPDF(pdfBlob: Blob): Promise<Blob[]> {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();

    const splitPdfs: Blob[] = [];

    for (let i = 0; i < pageCount; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);

      const pdfBytes = await newPdf.save();
      splitPdfs.push(
        new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" }),
      );
    }

    return splitPdfs;
  }
}
