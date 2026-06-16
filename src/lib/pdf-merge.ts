import { PDFDocument } from "pdf-lib";

/**
 * Merges multiple PDF blobs into a single PDF blob.
 * Each input PDF becomes consecutive pages in the output.
 */
export async function mergePDFs(pdfBlobs: Blob[]): Promise<Blob> {
  const merged = await PDFDocument.create();

  for (const blob of pdfBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const mergedBytes = await merged.save();
  const buffer = new ArrayBuffer(mergedBytes.byteLength);
  new Uint8Array(buffer).set(mergedBytes);
  return new Blob([buffer], { type: "application/pdf" });
}

/**
 * Opens a PDF blob in a new browser tab for printing.
 * The tab auto-triggers the print dialog after the PDF loads.
 */
export function openPDFForPrinting(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      win.print();
      // Revoke object URL after a delay to allow the print dialog to load
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });
  } else {
    // Fallback: if popup blocked, download the PDF instead
    const a = document.createElement("a");
    a.href = url;
    a.download = `bordereaux-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5_000);
  }
}
