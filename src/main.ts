import { GlobalWorkerOptions, PDFDocumentProxy, getDocument } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import "./index.css";

// Set the worker source
GlobalWorkerOptions.workerSrc = pdfjsWorker;

// async function adjustContent(pdfDoc: PDFDocument, pdf: PDFDocumentProxy) {
//   const pages = pdfDoc.getPages();
//
//   const page = pages[0]; // Assuming single-page PDF
//   const { height } = page.getSize();
//
//   const content = await pdf.getPage(1).then((page) => page.getTextContent());
//
//   // Find the "ACTIVITY" header
//   let activityY = 0;
//   for (const item of content.items) {
//     if ((item as any).str === "ACTIVITY") {
//       activityY = (item as any).transform[5];
//       break;
//     }
//   }
//
//   if (activityY === 0) {
//     throw new Error('"ACTIVITY" header not found');
//   }
//
//   // Shift all elements below "ACTIVITY"
//   const shiftAmount = 32;
//   for (const item of content.items) {
//     const y = (item as any).transform[5];
//     if (y < activityY) {
//       continue; // Skip elements above "ACTIVITY"
//     }
//
//     // Adjust position for items below "ACTIVITY"
//     page.drawText((item as any).str, {
//       x: (item as any).transform[4], // X-coordinate
//       y: y - shiftAmount,
//       size: 12,
//       color: rgb(0, 0, 0),
//     });
//   }
// }

async function addQRCodesToPDF(
  pdfDocument: PDFDocument,
  pdf: PDFDocumentProxy,
) {
  for (let pageNum = 0; pageNum < pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum + 1);
    const annotations = await page.getAnnotations();

    for (const annotation of annotations) {
      if (
        annotation.subtype === "Link" &&
        annotation.url &&
        annotation.url.startsWith(
          "https://connect.intuit.com/portal/app/CommerceNetwork/view/",
        )
      ) {
        const qrCodeB64 = await QRCode.toDataURL(annotation.url, {
          rendererOpts: {
            quality: 1,
          },
          scale: 4,
          margin: 0,
        });

        const documentPage = pdfDocument.getPage(pageNum);

        const qrImage = await pdfDocument.embedPng(qrCodeB64);
        const qrImageDims = qrImage.scale(0.6);
        const x = 50; // 10 units from the right edge
        const y = 30;

        documentPage.drawImage(qrImage, {
          x,
          y,
          width: qrImageDims.width,
          height: qrImageDims.height,
        });
      }
    }
  }

  return pdfDocument.save();
}

document
  .querySelector<HTMLFormElement>("#form")!
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const pledgesInput = document.getElementById("pledges") as HTMLInputElement;

    const pdfContent = await pledgesInput.files!.item(0)!.arrayBuffer();

    const pdfDocument = await PDFDocument.load(pdfContent);
    const loadingTask = getDocument(pdfContent);
    const pdf = await loadingTask.promise;

    // await adjustContent(pdfDocument, pdf);
    const result = await addQRCodesToPDF(pdfDocument, pdf);

    const blob = new Blob([result], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
  });
