import { PDFDocument, PageSizes } from 'pdf-lib';

export type PageSize = 'original' | 'A4' | 'Letter';
export type Orientation = 'portrait' | 'landscape';

function getPageDimensions(size: PageSize, orientation: Orientation, imgWidth: number, imgHeight: number): [number, number] {
  if (size === 'original') {
    return orientation === 'landscape' ? [Math.max(imgWidth, imgHeight), Math.min(imgWidth, imgHeight)]
                                       : [imgWidth, imgHeight];
  }
  const dims = size === 'A4' ? PageSizes.A4 : PageSizes.Letter;
  return orientation === 'landscape' ? [dims[1], dims[0]] : dims;
}

export async function convertImagesToPdf(
  files: File[],
  pageSize: PageSize = 'original',
  orientation: Orientation = 'portrait'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    const mimeType = file.type;

    let image;
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      image = await pdfDoc.embedJpg(buffer);
    } else if (mimeType === 'image/png') {
      image = await pdfDoc.embedPng(buffer);
    } else {
      throw new Error(`Formato no soportado: ${mimeType}. Usa JPG o PNG.`);
    }

    const [w, h] = getPageDimensions(pageSize, orientation, image.width, image.height);
    const page = pdfDoc.addPage([w, h]);

    // escalar imagen para que quepa en la página
    const scale = Math.min(w / image.width, h / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const x = (w - drawW) / 2;
    const y = (h - drawH) / 2;

    page.drawImage(image, { x, y, width: drawW, height: drawH });
  }

  return pdfDoc.save();
}
