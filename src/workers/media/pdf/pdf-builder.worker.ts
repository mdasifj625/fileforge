import * as Comlink from "comlink";
import { PDFDocument, rgb, degrees } from "pdf-lib";

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
    return new Blob([mergedPdfBytes as unknown as BlobPart], {
      type: "application/pdf",
    });
  },

  async splitPdf(fileBlob: Blob, pageOrder?: number[]): Promise<Blob> {
    console.log("Worker: Splitting PDF...");
    const JSZip = (await import("jszip")).default;
    const arrayBuffer = await fileBlob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);

    const pageIndices = pageOrder
      ? pageOrder.map((num) => num - 1)
      : pdf.getPageIndices();

    const zip = new JSZip();

    for (let i = 0; i < pageIndices.length; i++) {
      const pageIndex = pageIndices[i];
      const singlePagePdf = await PDFDocument.create();
      const [copiedPage] = await singlePagePdf.copyPages(pdf, [pageIndex]);
      singlePagePdf.addPage(copiedPage);

      const bytes = await singlePagePdf.save();
      zip.file(`page-${pageIndex + 1}.pdf`, bytes);
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    return zipBlob;
  },

  async imagesToPdf(imageBlobs: Blob[]): Promise<Blob> {
    console.log("Worker: Converting Images to PDF...");
    const pdfDoc = await PDFDocument.create();

    for (const blob of imageBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      let image;

      // Basic check for jpeg/png based on type or magic bytes. pdf-lib supports JPG and PNG.
      if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
        image = await pdfDoc.embedJpg(arrayBuffer);
      } else {
        // Assume PNG for others, might fail if not actually PNG (e.g. webp)
        image = await pdfDoc.embedPng(arrayBuffer);
      }

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as unknown as BlobPart], {
      type: "application/pdf",
    });
  },

  async watermarkPdf(
    fileBlob: Blob,
    watermarkText: string,
    pageOrder?: number[],
  ): Promise<Blob> {
    console.log("Worker: Watermarking PDF...");
    const arrayBuffer = await fileBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const pages = pdfDoc.getPages();
    const pageIndices = pageOrder
      ? pageOrder.map((num) => num - 1)
      : pdfDoc.getPageIndices();

    for (const index of pageIndices) {
      if (index >= 0 && index < pages.length) {
        const page = pages[index];
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 4,
          y: height / 2,
          size: 40,
          color: rgb(0.7, 0.7, 0.7),
          opacity: 0.5,
          rotate: degrees(-45),
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as unknown as BlobPart], {
      type: "application/pdf",
    });
  },
};

export type PdfProcessor = typeof pdfProcessor;
Comlink.expose(pdfProcessor);
