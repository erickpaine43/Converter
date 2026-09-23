import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export type ImageFormat = 'png' | 'jpeg';
export type ImageQuality = 1 | 2 | 3; // escala: baja, media, alta
export type PageProgress = (done: number, total: number) => void;

export async function convertPdfToImages(
  file: File,
  format: ImageFormat = 'png',
  quality: ImageQuality = 2,
  onProgress?: PageProgress
): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: quality });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    images.push(canvas.toDataURL(mimeType, 0.92));
    onProgress?.(i, pdf.numPages);
  }

  return images;
}
