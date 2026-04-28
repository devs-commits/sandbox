import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type LetterType = "12week" | "24week";

export function buildLetterFileName(
  fullName: string,
  track: string,
  type: LetterType,
): string {
  const label =
    type === "24week" ? "Visa-Letter-of-Reference" : "Work-Letter-of-Reference";
  return `${fullName}-${track}-${label}.pdf`
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-.]/g, "");
}

/**
 * Captures a rendered HTML letter element and downloads it as an A4 PDF.
 */
export async function downloadLetterFromElement(
  element: HTMLElement,
  fileName: string,
) {
  await new Promise(resolve => setTimeout(resolve, 0));
  
  const canvas = await html2canvas(element, {
    // @ts-expect-error: scale is valid in html2canvas but missing in types
    scale: 1.5,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgRatio = canvas.height / canvas.width;
  const imgWidth = pageWidth;
  const imgHeight = imgWidth * imgRatio;

  // Single-page fit: scale down if slightly over to avoid blank trailing page
  if (imgHeight <= pageHeight + 2) {
    const finalHeight = Math.min(imgHeight, pageHeight);
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, finalHeight);
  } else {
    let remaining = imgHeight;
    let position = 0;
    while (remaining > 0.5) {
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      remaining -= pageHeight;
      position -= pageHeight;
      if (remaining > 0.5) pdf.addPage();
    }
  }

  pdf.save(fileName);
  
  canvas.width = 0;
  canvas.height = 0;
}
