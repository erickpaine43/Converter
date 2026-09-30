import { beforeEach, describe, expect, it, vi } from 'vitest';
import html2canvas from 'html2canvas';
import { convertHtmlToPdf, planAutoCapture, planCapture, MAX_CANVAS_AREA, MAX_CANVAS_SIDE, MAX_PDF_PAGE_PT } from './htmlToPdf';

// html2canvas and jsPDF are third-party libraries; testing their rendering and
// PDF byte output isn't our job (and html2canvas can't even run realistically in
// jsdom, which has no layout). Both are mocked so we can test OUR OWN logic in
// convertHtmlToPdf: paperSize -> dimensions/orientation, chunked capture (never
// exceeding canvas limits), pagination, progress, and that the captured content
// actually reaches addImage.
const addImageMock = vi.fn();
const addPageMock = vi.fn();
const saveMock = vi.fn();
let lastJsPdfCtorArgs: { orientation: string; unit: string; format: [number, number] } | null = null;

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function (this: unknown, opts: typeof lastJsPdfCtorArgs) {
    lastJsPdfCtorArgs = opts;
    return { addImage: addImageMock, addPage: addPageMock, save: saveMock };
  }),
}));

interface CaptureOptions { scale: number; x?: number; y?: number; width?: number; height?: number }

vi.mock('html2canvas', () => ({
  // Behaves like the real html2canvas as far as SIZE goes: the canvas is the
  // requested crop (or the whole element if there's none) times scale.
  // It's a real canvas (not a plain object): sliceCanvas() calls drawImage on it,
  // and vitest-canvas-mock needs an actual HTMLCanvasElement to simulate that.
  default: vi.fn(async (el: HTMLElement, opts: CaptureOptions) => {
    const rect = el.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor((opts.width ?? rect.width) * opts.scale);
    canvas.height = Math.floor((opts.height ?? rect.height) * opts.scale);
    return canvas;
  }),
}));

const html2canvasMock = vi.mocked(html2canvas);

/** jsdom has no layout (getBoundingClientRect returns 0x0), so we fake the rendered size. */
function makeElement(width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  return el;
}

/**
 * Element whose content overflows it: the box is boxWidth x boxHeight (with a
 * 1px border per side) but the content reaches scrollWidth x scrollHeight
 * (measured from the inner edge, as in a real browser).
 */
function makeOverflowingElement(boxWidth: number, boxHeight: number, scrollWidth: number, scrollHeight: number): HTMLElement {
  const el = makeElement(boxWidth, boxHeight);
  const props = { offsetWidth: boxWidth, clientWidth: boxWidth - 2, scrollWidth, offsetHeight: boxHeight, clientHeight: boxHeight - 2, scrollHeight };
  for (const [key, value] of Object.entries(props)) Object.defineProperty(el, key, { configurable: true, value });
  return el;
}

function captureOptions(): CaptureOptions[] {
  return html2canvasMock.mock.calls.map(call => call[1] as CaptureOptions);
}

function resetMocks() {
  addImageMock.mockClear();
  addPageMock.mockClear();
  saveMock.mockClear();
  html2canvasMock.mockClear();
  lastJsPdfCtorArgs = null;
}

describe('Bloque 2: convertHtmlToPdf — validación de salida', () => {
  beforeEach(resetMocks);

  it('genera contenido real (addImage recibe la captura, no está vacío) y guarda el PDF', async () => {
    await convertHtmlToPdf(makeElement(400, 300), 'A4');

    expect(addImageMock).toHaveBeenCalledTimes(1);
    const [imgData] = addImageMock.mock.calls[0];
    expect(typeof imgData).toBe('string');
    expect(saveMock).toHaveBeenCalledWith('converted.pdf');
  });

  it('respeta el paperSize A4 (595x842 px, portrait)', async () => {
    await convertHtmlToPdf(makeElement(400, 300), 'A4');
    expect(lastJsPdfCtorArgs?.format).toEqual([595, 842]);
    expect(lastJsPdfCtorArgs?.orientation).toBe('portrait');
  });

  it('respeta el paperSize Letter', async () => {
    await convertHtmlToPdf(makeElement(400, 300), 'Letter');
    expect(lastJsPdfCtorArgs?.format).toEqual([612, 792]);
  });

  it('paperSize "auto" usa las dimensiones reales del contenido capturado, en una sola página', async () => {
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(400, 300), 'auto', onProgress);
    // 400x300 CSS px -> 300x225 pt (1 CSS px = 0.75 pt), captured at scale 2
    expect(lastJsPdfCtorArgs?.unit).toBe('pt');
    expect(lastJsPdfCtorArgs?.format).toEqual([300, 225]);
    expect(lastJsPdfCtorArgs?.orientation).toBe('landscape'); // 300 > 225
    expect(captureOptions()[0].scale).toBe(2);
    expect(addPageMock).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it('"auto" con contenido muy alto NO pagina (sigue siendo una sola página ajustada al contenido)', async () => {
    await convertHtmlToPdf(makeElement(400, 4500), 'auto');
    expect(lastJsPdfCtorArgs?.format).toEqual([300, 3375]);
    expect(addPageMock).not.toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledTimes(1);
  });
});

describe('Bloque 2: convertHtmlToPdf — paginación real (A4/Letter)', () => {
  beforeEach(resetMocks);

  it('contenido corto: una sola página, sin addPage() de más (no agrega páginas en blanco)', async () => {
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(500, 200), 'A4', onProgress); // easily fits one A4 page

    expect(addPageMock).not.toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it('contenido largo: se recorta en varias franjas, una página por franja, con addPage() entre cada una', async () => {
    // A4 at 500 CSS px wide: one page is floor(500*842/595) = 707 CSS px
    // -> at 3000 tall, pageCount = ceil(3000/707) = 5.
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(500, 3000), 'A4', onProgress);

    expect(addImageMock).toHaveBeenCalledTimes(5);
    expect(addPageMock).toHaveBeenCalledTimes(4); // one less than the page count: no addPage before the first one
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 5);
    expect(onProgress).toHaveBeenNthCalledWith(5, 5, 5);

    // every page uses the full page width (content is never cut horizontally)
    // addImage(dataUrl, 'PNG', x, y, width, height)
    for (const call of addImageMock.mock.calls) {
      expect(call[4]).toBe(595); // width passed to addImage
    }
  });

  it('la última franja puede ser más baja que las demás (no se estira ni deja una página en blanco de más)', async () => {
    // the last page is 3000 - 4*707 = 172 CSS px
    await convertHtmlToPdf(makeElement(500, 3000), 'A4');

    const lastCallHeight = addImageMock.mock.calls[addImageMock.mock.calls.length - 1][5];
    const firstCallHeight = addImageMock.mock.calls[0][5];
    expect(lastCallHeight).toBeLessThan(firstCallHeight);
    // full page (CSS px height is floored: loses < 1px)
    expect(firstCallHeight).toBeGreaterThan(841);
    expect(firstCallHeight).toBeLessThanOrEqual(842);
  });

  it('sin onProgress no explota (el parámetro es opcional)', async () => {
    await expect(convertHtmlToPdf(makeElement(500, 3000), 'A4')).resolves.toBeUndefined();
  });
});

// Repro for the "PDF with every page blank" bug: a ~52-page A4 document in the
// preview (732 CSS px wide, as measured in Chrome) used to be captured WHOLE at
// scale 2 -> a 1464 x ~105,000 px canvas. Chrome (max 65,535 px per side) and
// Firefox (32,767) don't throw on such a canvas: it just stays empty, and every
// strip sliced from it comes out blank.
describe('convertHtmlToPdf — documentos largos no exceden los límites de canvas', () => {
  beforeEach(resetMocks);

  const WIDTH = 732;
  const A4_PAGE_CSS = Math.floor(WIDTH * 842 / 595); // 1035
  const HEIGHT_52_PAGES = A4_PAGE_CSS * 52 - 200;

  it('la captura única anterior (scale 2) superaba el límite: este es el caso a cubrir', () => {
    expect(HEIGHT_52_PAGES * 2).toBeGreaterThan(65_535); // Chrome's actual per-side limit
  });

  it('planCapture: mantiene scale 2 y agrupa páginas en tramos que entran en los límites', () => {
    const plan = planCapture(WIDTH, HEIGHT_52_PAGES, 595, 842);
    expect(plan.scale).toBe(2);
    expect(plan.pageCount).toBe(52);
    expect(plan.pagesPerChunk).toBeGreaterThan(1);

    const chunkCanvasHeight = plan.pagesPerChunk * plan.pageHeightCss * plan.scale;
    expect(chunkCanvasHeight).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(chunkCanvasHeight * WIDTH * plan.scale).toBeLessThanOrEqual(MAX_CANVAS_AREA);
  });

  it('planCapture: contenido extremadamente ancho baja el scale para que al menos una página entre', () => {
    const plan = planCapture(12_000, 50_000, 595, 842);
    expect(plan.scale).toBeLessThan(2);
    expect(plan.pagesPerChunk).toBe(1);
    const pageCanvasW = 12_000 * plan.scale;
    const pageCanvasH = plan.pageHeightCss * plan.scale;
    expect(pageCanvasW).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(pageCanvasH).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(pageCanvasW * pageCanvasH).toBeLessThanOrEqual(MAX_CANVAS_AREA + 1);
  });

  it('52 páginas: varias capturas por tramos (nunca un canvas gigante), contiguas, y 52 páginas con contenido', async () => {
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(WIDTH, HEIGHT_52_PAGES), 'A4', onProgress);

    const opts = captureOptions();
    expect(opts.length).toBeGreaterThan(1);
    for (const o of opts) {
      const w = o.width! * o.scale;
      const h = o.height! * o.scale;
      expect(o.scale).toBe(2);
      expect(w).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
      expect(h).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
      expect(w * h).toBeLessThanOrEqual(MAX_CANVAS_AREA);
    }

    // the chunks cover the whole document, with no gaps or overlaps
    let expectedY = 0;
    for (const o of opts) {
      expect(o.y).toBe(expectedY);
      expectedY += o.height!;
    }
    expect(expectedY).toBe(HEIGHT_52_PAGES);

    expect(addImageMock).toHaveBeenCalledTimes(52);
    // addImage(data, format, x, y, w, h, alias, compression): uncompressed, 52 pages would weigh ~470 MB
    for (const call of addImageMock.mock.calls) expect(call[7]).toBe('FAST');
    expect(addPageMock).toHaveBeenCalledTimes(51);
    expect(onProgress).toHaveBeenLastCalledWith(52, 52);
  });

});

// "auto" mode with long documents. Two bugs covered:
//  - a single full-height canvas exceeds the limit and comes out blank (or, when
//    the scale was lowered to avoid that, the text became unreadable);
//  - a page over 14,400 units is silently clipped by jsPDF: the previous "auto"
//    mode lost the last ~34% of the 41-page document that way.
describe('convertHtmlToPdf "auto" — documentos largos: scale 2, sin canvas gigante y sin recortes', () => {
  beforeEach(resetMocks);

  const WIDTH = 732;
  const HEIGHT_41_PAGES = 41_898; // the test document as measured in Chrome

  it('planAutoCapture: scale 2, tramos dentro de los límites y página dentro del máximo de un PDF', () => {
    const plan = planAutoCapture(WIDTH, HEIGHT_41_PAGES);
    expect(plan.scale).toBe(2);
    expect(plan.chunkCount).toBeGreaterThan(1);
    const chunkW = WIDTH * plan.scale;
    const chunkH = plan.chunkHeightCss * plan.scale;
    expect(chunkH).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(chunkW * chunkH).toBeLessThanOrEqual(MAX_CANVAS_AREA);
    // the page shrinks instead of being clipped, keeping the content's aspect ratio
    expect(plan.pageHeightPt).toBeCloseTo(MAX_PDF_PAGE_PT, 6);
    expect(plan.pageWidthPt / plan.pageHeightPt).toBeCloseTo(WIDTH / HEIGHT_41_PAGES, 9);
  });

  it('41 páginas: captura en tramos a scale 2 que cubren todo el documento, en UNA página', async () => {
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(WIDTH, HEIGHT_41_PAGES), 'auto', onProgress);

    const opts = captureOptions();
    expect(opts.length).toBeGreaterThan(1);
    let expectedY = 0;
    for (const o of opts) {
      expect(o.scale).toBe(2);
      expect(o.width! * o.scale * o.height! * o.scale).toBeLessThanOrEqual(MAX_CANVAS_AREA);
      expect(o.height! * o.scale).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
      expect(o.y).toBe(expectedY);
      expectedY += o.height!;
    }
    expect(expectedY).toBe(HEIGHT_41_PAGES);

    expect(addPageMock).not.toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledTimes(opts.length);
    expect(onProgress).toHaveBeenLastCalledWith(opts.length, opts.length);
  });

  it('41 páginas: las imágenes se apilan sin huecos ni solapes y ocupan exactamente la página (nada queda afuera)', async () => {
    await convertHtmlToPdf(makeElement(WIDTH, HEIGHT_41_PAGES), 'auto');

    const [pageW, pageH] = lastJsPdfCtorArgs!.format;
    expect(pageH).toBeLessThanOrEqual(MAX_PDF_PAGE_PT);
    expect(pageW).toBeLessThanOrEqual(MAX_PDF_PAGE_PT);

    // addImage(data, format, x, y, w, h, alias, compression)
    let expectedY = 0;
    for (const [, , x, y, w, h, , compression] of addImageMock.mock.calls) {
      expect(x).toBe(0);
      expect(w).toBe(pageW);
      expect(y).toBeCloseTo(expectedY, 6);
      expect(compression).toBe('FAST');
      expectedY = y + h;
    }
    expect(expectedY).toBeCloseTo(pageH, 6);
  });

  it('contenido de más de 8.192 px CSS de ancho: único caso en que el scale baja (límite físico del canvas)', () => {
    const plan = planAutoCapture(10_000, 3_000);
    expect(plan.scale).toBeLessThan(2);
    expect(10_000 * plan.scale).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(10_000 * plan.scale * plan.chunkHeightCss * plan.scale).toBeLessThanOrEqual(MAX_CANVAS_AREA);
  });
});

// Content wider than the preview (e.g. a 1,400px table inside the ~734px box):
// previously only the box was captured and the right side was lost in all three
// modes. Case measured in Chrome: 734px box with a 1px border, scrollWidth 1416
// -> actual content is 1416 + 2 = 1418px.
describe('convertHtmlToPdf — contenido que desborda la vista previa se captura completo', () => {
  beforeEach(resetMocks);

  const wideElement = () => makeOverflowingElement(734, 300, 1416, 298);

  it.each(['A4', 'Letter'] as const)('%s: captura el ancho real del contenido y escala TODO para que entre en el ancho de la página', async size => {
    await convertHtmlToPdf(wideElement(), size);

    const opts = captureOptions();
    for (const o of opts) {
      expect(o.x).toBe(0);
      expect(o.width).toBe(1418); // not 734: the overflow is included in the capture
    }
    const pageW = lastJsPdfCtorArgs!.format[0];
    for (const call of addImageMock.mock.calls) {
      expect(call[2]).toBe(0);
      expect(call[4]).toBe(pageW); // the wider content takes exactly the page width
    }
  });

  it('A4: el alto de página en px CSS crece en la misma proporción que el ancho (escalado proporcional, no deformado)', () => {
    const narrow = planCapture(734, 5000, 595, 842);
    const wide = planCapture(1418, 5000, 595, 842);
    expect(wide.pageHeightCss / 1418).toBeCloseTo(narrow.pageHeightCss / 734, 2);
    expect(wide.pageCount).toBeLessThan(narrow.pageCount); // more content per page, since it's scaled down
  });

  it('auto: la página toma el ancho real del contenido (1418px CSS -> 1063,5 pt)', async () => {
    await convertHtmlToPdf(wideElement(), 'auto');

    expect(captureOptions()[0].width).toBe(1418);
    expect(lastJsPdfCtorArgs!.format[0]).toBeCloseTo(1418 * 0.75, 6);
  });

  it('desborde vertical: también se captura el alto real del contenido', async () => {
    await convertHtmlToPdf(makeOverflowingElement(734, 300, 732, 2000), 'auto');

    const opts = captureOptions();
    expect(opts.reduce((sum, o) => sum + o.height!, 0)).toBe(2002);
  });

  it('sin desborde, se mantiene el tamaño del recuadro (sin cambios de comportamiento)', async () => {
    await convertHtmlToPdf(makeOverflowingElement(734, 300, 732, 298), 'auto');

    expect(captureOptions()[0]).toMatchObject({ width: 734, height: 300 });
  });
});
