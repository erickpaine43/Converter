import { PDFDocument } from 'pdf-lib';

export type MergeProgress = (done: number, total: number) => void;

export async function mergePdfs(files: File[], onProgress?: MergeProgress): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const buffer = await files[i].arrayBuffer();
    const pdf = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => merged.addPage(page));
    onProgress?.(i + 1, files.length);
  }

  return merged.save();
}
