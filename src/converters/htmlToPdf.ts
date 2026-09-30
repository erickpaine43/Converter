import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PaperSize = 'A4' | 'Letter' | 'auto';
export type HtmlToPdfProgress = (done: number, total: number) => void;

const paperDimensions: Record<string, [number, number]> = {
  A4:     [595, 842],
  Letter: [612, 792],
};

// Browser canvas limits: exceeding them does NOT throw. getContext() returns a
// context that draws nothing and toDataURL() returns "data:," (empty canvas).
// Measured in Chrome 153: 65,535 px per side and 268,435,456 px of area
// (16384²). Firefox caps at 32,767 px per side and iOS Safari at 16,777,216 px
// of area (4096²). We use the strictest of each so capture is safe everywhere.
export const MAX_CANVAS_SIDE = 16_384;
export const MAX_CANVAS_AREA = 16_777_216;
const PREFERRED_SCALE = 2;

export interface CapturePlan {
  scale: number;
  /** Height of one PDF page, in the element's CSS px. */
  pageHeightCss: number;
  pageCount: number;
  /** How many pages are captured per html2canvas call. */
  pagesPerChunk: number;
}

/** Largest scale (<= PREFERRED_SCALE) at which a width x height CSS px canvas fits within the limits. */
function fitScale(widthCss: number, heightCss: number): number {
  return Math.min(
    PREFERRED_SCALE,
    MAX_CANVAS_SIDE / widthCss,
    MAX_CANVAS_SIDE / heightCss,
    Math.sqrt(MAX_CANVAS_AREA / (widthCss * heightCss)),
  );
}

/**
 * Plans how to capture a widthCss x heightCss element into pages of the given
 * size without ever creating a canvas over the browser limits. The element is
 * captured in chunks aligned to whole pages (several pages per chunk, so
 * html2canvas doesn't clone the DOM once per page) instead of capturing
 * everything at once and slicing afterwards.
 */
export function planCapture(widthCss: number, heightCss: number, pdfW: number, pdfH: number): CapturePlan {
  const pageHeightCss = Math.max(1, Math.floor(widthCss * pdfH / pdfW));
  // A single page must always fit: for very wide content the scale is lowered
  // (only in that edge case; normally it stays at 2x).
  const scale = fitScale(widthCss, pageHeightCss);
  const canvasWidth = widthCss * scale;
  const maxChunkCanvasHeight = Math.min(MAX_CANVAS_SIDE, MAX_CANVAS_AREA / canvasWidth);
  const pagesPerChunk = Math.max(1, Math.floor(maxChunkCanvasHeight / (pageHeightCss * scale)));
  const pageCount = Math.max(1, Math.ceil(heightCss / pageHeightCss));
  return { scale, pageHeightCss, pageCount, pagesPerChunk };
}

function sliceCanvas(source: HTMLCanvasElement, sourceY: number, sliceHeight: number): HTMLCanvasElement {
  const slice = document.createElement('canvas');
  slice.width = source.width;
  slice.height = sliceHeight;
  const ctx = slice.getContext('2d')!;
  ctx.drawImage(source, 0, sourceY, source.width, sliceHeight, 0, 0, source.width, sliceHeight);
  return slice;
}

function measure(element: HTMLElement): { widthCss: number; heightCss: number } {
  // By default html2canvas only captures the element's box, so anything
  // overflowing it (e.g. a table wider than the preview) was left out of the
  // PDF. scrollWidth/scrollHeight include that overflow, so the full content is
  // captured; planCapture/planAutoCapture scale everything proportionally so
  // that width fits the page. scroll* is measured from the inner edge while the
  // capture starts at the outer one, so the borders (offset* - client*) are
  // added to avoid losing the last row/column of pixels.
  //
  // INTENTIONALLY NOT HANDLED: overflow to the LEFT or TOP of the element (e.g.
  // negative margin-left/top, or positioned with negative left/top).
  // scrollWidth/scrollHeight only measure overflow to the right and bottom, and
  // the capture starts at the element's top-left corner, so anything beyond the
  // preview's padding + border (~17px) is cut off. Verified in Chrome: a -60px
  // margin-left gets clipped, while the margin-left:-5.4pt typical of tables
  // exported from Word fits fine (it falls within the padding).
  // Handling it would mean walking the descendants to find the leftmost/topmost
  // edge and capturing with negative x/y, but that breaks with the
  // text-indent:-9999px accessibility pattern (visually hidden text read by
  // screen readers): ~10,000px of blank space would be captured and the whole
  // document would shrink until unreadable. Left out since it's rare in
  // practice; if it's ever needed, elements hidden that way should be ignored
  // when computing the edge.
  const rect = element.getBoundingClientRect();
  const bordersX = element.offsetWidth - element.clientWidth;
  const bordersY = element.offsetHeight - element.clientHeight;
  return {
    widthCss: Math.max(1, Math.ceil(rect.width), element.scrollWidth + bordersX),
    heightCss: Math.max(1, Math.ceil(rect.height), element.scrollHeight + bordersY),
  };
}

// PDF pages can't exceed 14,400 units per side (jsPDF silently clamps them with
// just a console.warn, dropping whatever doesn't fit).
export const MAX_PDF_PAGE_PT = 14_400;
const PT_PER_CSS_PX = 0.75; // 72 pt per inch / 96 CSS px per inch

export interface AutoCapturePlan {
  scale: number;
  /** Height of each captured chunk, in CSS px (the last one may be shorter). */
  chunkHeightCss: number;
  chunkCount: number;
  /** Size of the PDF's single page, in pt. */
  pageWidthPt: number;
  pageHeightPt: number;
  /** Page pt per content CSS px (0.75 unless the page has to be scaled down). */
  ptPerCss: number;
}

/**
 * Plan for "auto" mode: a single page sized to the content. The content is
 * captured in chunks (at scale 2, each within the canvas limits) that are
 * stacked as separate images on that page, never merged into one full-height
 * canvas (which exceeds the limit on long documents and comes out blank).
 *
 * The page is sized 1:1 (1 CSS px = 0.75 pt) as long as it fits the PDF
 * maximum; longer content scales the page down proportionally instead of
 * cropping it. Images keep their scale-2 resolution: only their physical size
 * at 100% zoom changes.
 */
export function planAutoCapture(widthCss: number, heightCss: number): AutoCapturePlan {
  // Always scale 2, except for content wider than 8,192 CSS px, where not even
  // a 1px-tall strip would fit MAX_CANVAS_SIDE at scale 2.
  const scale = Math.min(PREFERRED_SCALE, MAX_CANVAS_SIDE / widthCss);
  const maxChunkCanvasHeight = Math.min(MAX_CANVAS_SIDE, MAX_CANVAS_AREA / (widthCss * scale));
  const chunkHeightCss = Math.max(1, Math.floor(maxChunkCanvasHeight / scale));
  const chunkCount = Math.max(1, Math.ceil(heightCss / chunkHeightCss));
  const ptPerCss = PT_PER_CSS_PX * Math.min(
    1,
    MAX_PDF_PAGE_PT / (widthCss * PT_PER_CSS_PX),
    MAX_PDF_PAGE_PT / (heightCss * PT_PER_CSS_PX),
  );
  return {
    scale,
    chunkHeightCss,
    chunkCount,
    pageWidthPt: Math.min(MAX_PDF_PAGE_PT, widthCss * ptPerCss),
    pageHeightPt: Math.min(MAX_PDF_PAGE_PT, heightCss * ptPerCss),
    ptPerCss,
  };
}

async function convertAutoSize(
  element: HTMLElement,
  widthCss: number,
  heightCss: number,
  onProgress?: HtmlToPdfProgress
): Promise<void> {
  const { scale, chunkHeightCss, chunkCount, pageWidthPt, pageHeightPt, ptPerCss } = planAutoCapture(widthCss, heightCss);
  const pdf = new jsPDF({
    orientation: pageWidthPt > pageHeightPt ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pageWidthPt, pageHeightPt],
  });

  for (let i = 0; i < chunkCount; i++) {
    const chunkY = i * chunkHeightCss;
    const height = Math.min(chunkHeightCss, heightCss - chunkY);
    const canvas = await html2canvas(element, { scale, useCORS: true, x: 0, y: chunkY, width: widthCss, height });
    // each chunk goes right below the previous one, on the same page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, chunkY * ptPerCss, pageWidthPt, height * ptPerCss, undefined, 'FAST');
    onProgress?.(i + 1, chunkCount);
  }

  pdf.save('converted.pdf');
}

export async function convertHtmlToPdf(
  element: HTMLElement,
  paperSize: PaperSize = 'A4',
  onProgress?: HtmlToPdfProgress
): Promise<void> {
  const { widthCss, heightCss } = measure(element);

  if (paperSize === 'auto') {
    await convertAutoSize(element, widthCss, heightCss, onProgress);
    return;
  }

  const [pdfW, pdfH] = paperDimensions[paperSize];
  const { scale, pageHeightCss, pageCount, pagesPerChunk } = planCapture(widthCss, heightCss, pdfW, pdfH);

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [pdfW, pdfH] });
  let pageIndex = 0;

  for (let firstPage = 0; firstPage < pageCount; firstPage += pagesPerChunk) {
    const pagesInChunk = Math.min(pagesPerChunk, pageCount - firstPage);
    const chunkY = firstPage * pageHeightCss;
    const chunkHeightCss = Math.min(pagesInChunk * pageHeightCss, heightCss - chunkY);

    // html2canvas x/y/width/height crop the capture (relative to the element):
    // the resulting canvas only covers this chunk, never the whole document.
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      x: 0,
      y: chunkY,
      width: widthCss,
      height: chunkHeightCss,
    });

    // Slice the chunk into pages; edges are rounded from the same ratio so the
    // strips stay contiguous (no gaps or overlaps).
    const canvasPxPerCss = canvas.height / chunkHeightCss;
    for (let j = 0; j < pagesInChunk; j++) {
      const sourceY = Math.round(j * pageHeightCss * canvasPxPerCss);
      const sourceEnd = Math.min(canvas.height, Math.round((j + 1) * pageHeightCss * canvasPxPerCss));
      const sliceHeight = Math.max(1, sourceEnd - sourceY);
      const slice = sliceCanvas(canvas, sourceY, sliceHeight);

      if (pageIndex > 0) pdf.addPage();
      // canvas width -> page width; height is scaled by the same ratio.
      // 'FAST' = lossless deflate compression; without it jsPDF stores raw
      // pixels (~9 MB per page at scale 2).
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceHeight * pdfW / canvas.width, undefined, 'FAST');
      pageIndex++;
      onProgress?.(pageIndex, pageCount);
    }
  }

  pdf.save('converted.pdf');
}
