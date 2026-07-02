import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PaperSize = 'A4' | 'Letter' | 'auto';

const paperDimensions: Record<string, [number, number]> = {
  A4:     [595, 842],
  Letter: [612, 792],
};

export async function convertHtmlToPdf(element: HTMLElement, paperSize: PaperSize = 'A4'): Promise<void> {
  const canvas = await html2canvas(element, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');

  let pdfW: number, pdfH: number;
  if (paperSize === 'auto') {
    pdfW = canvas.width;
    pdfH = canvas.height;
  } else {
    [pdfW, pdfH] = paperDimensions[paperSize];
  }

  const orientation = pdfW > pdfH ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [pdfW, pdfH] });

  const scale = Math.min(pdfW / canvas.width, pdfH / canvas.height);
  const drawW = canvas.width * scale;
  const drawH = canvas.height * scale;
  const x = (pdfW - drawW) / 2;
  const y = (pdfH - drawH) / 2;

  pdf.addImage(imgData, 'PNG', x, y, drawW, drawH);
  pdf.save('converted.pdf');
}
