import { beforeEach, describe, expect, it, vi } from 'vitest';
import html2canvas from 'html2canvas';
import { convertHtmlToPdf, planAutoCapture, planCapture, MAX_CANVAS_AREA, MAX_CANVAS_SIDE, MAX_PDF_PAGE_PT } from './htmlToPdf';

// html2canvas y jsPDF son librerías de terceros; su render/generación de bytes de PDF
// no es responsabilidad nuestra probar (y html2canvas ni siquiera corre de forma
// realista en jsdom, sin layout real). Mockeamos ambas para poder validar en cambio
// LA LÓGICA PROPIA de convertHtmlToPdf: mapeo de paperSize -> dimensiones/orientación,
// captura por tramos (sin exceder los límites de canvas), paginación, progreso, y
// que el contenido capturado efectivamente se pasa a addImage.
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
  // se comporta como html2canvas real respecto del TAMAÑO: el canvas mide el
  // recorte pedido (o el elemento entero si no hay recorte) multiplicado por scale.
  // Es un canvas real (no un objeto plano): sliceCanvas() hace drawImage sobre esto,
  // y vitest-canvas-mock necesita un HTMLCanvasElement de verdad para simularlo.
  default: vi.fn(async (el: HTMLElement, opts: CaptureOptions) => {
    const rect = el.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor((opts.width ?? rect.width) * opts.scale);
    canvas.height = Math.floor((opts.height ?? rect.height) * opts.scale);
    return canvas;
  }),
}));

const html2canvasMock = vi.mocked(html2canvas);

/** jsdom no hace layout (getBoundingClientRect da 0x0): simulamos el tamaño renderizado. */
function makeElement(width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  return el;
}

/**
 * Elemento cuyo contenido lo desborda: el recuadro mide boxWidth x boxHeight
 * (con 1px de borde por lado) pero el contenido llega a scrollWidth x scrollHeight
 * (medidos desde el borde interno, como en un navegador real).
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
    // 400x300 px CSS -> 300x225 pt (1 px CSS = 0.75 pt), capturado a scale 2
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
    await convertHtmlToPdf(makeElement(500, 200), 'A4', onProgress); // entra en una página A4 de sobra

    expect(addPageMock).not.toHaveBeenCalled();
    expect(addImageMock).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(1, 1);
  });

  it('contenido largo: se recorta en varias franjas, una página por franja, con addPage() entre cada una', async () => {
    // A4 con 500px CSS de ancho: una página mide floor(500*842/595) = 707px CSS
    // -> con 3000 de alto, pageCount = ceil(3000/707) = 5.
    const onProgress = vi.fn();
    await convertHtmlToPdf(makeElement(500, 3000), 'A4', onProgress);

    expect(addImageMock).toHaveBeenCalledTimes(5);
    expect(addPageMock).toHaveBeenCalledTimes(4); // una menos que las páginas: no hay addPage antes de la primera
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 5);
    expect(onProgress).toHaveBeenNthCalledWith(5, 5, 5);

    // cada página usa el ancho completo de la página (contenido nunca se corta a lo ancho)
    // addImage(dataUrl, 'PNG', x, y, width, height)
    for (const call of addImageMock.mock.calls) {
      expect(call[4]).toBe(595); // width pasado a addImage
    }
  });

  it('la última franja puede ser más baja que las demás (no se estira ni deja una página en blanco de más)', async () => {
    // la última página mide 3000 - 4*707 = 172px CSS
    await convertHtmlToPdf(makeElement(500, 3000), 'A4');

    const lastCallHeight = addImageMock.mock.calls[addImageMock.mock.calls.length - 1][5];
    const firstCallHeight = addImageMock.mock.calls[0][5];
    expect(lastCallHeight).toBeLessThan(firstCallHeight);
    // página llena (el alto en px CSS se redondea hacia abajo: pierde < 1px)
    expect(firstCallHeight).toBeGreaterThan(841);
    expect(firstCallHeight).toBeLessThanOrEqual(842);
  });

  it('sin onProgress no explota (el parámetro es opcional)', async () => {
    await expect(convertHtmlToPdf(makeElement(500, 3000), 'A4')).resolves.toBeUndefined();
  });
});

// Reproducción del bug "PDF con todas las páginas en blanco": un documento de ~52
// páginas A4 en la vista previa (732px CSS de ancho, como se midió en Chrome) se
// capturaba ENTERO con scale 2 -> canvas de 1464 x ~105.000 px. Chrome (máx. 65.535
// px por lado) y Firefox (32.767) no lanzan error con un canvas así: queda vacío,
// y todas las franjas recortadas de él salen en blanco.
describe('convertHtmlToPdf — documentos largos no exceden los límites de canvas', () => {
  beforeEach(resetMocks);

  const WIDTH = 732;
  const A4_PAGE_CSS = Math.floor(WIDTH * 842 / 595); // 1035
  const HEIGHT_52_PAGES = A4_PAGE_CSS * 52 - 200;

  it('la captura única anterior (scale 2) superaba el límite: este es el caso a cubrir', () => {
    expect(HEIGHT_52_PAGES * 2).toBeGreaterThan(65_535); // límite real por lado en Chrome
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

    // los tramos cubren el documento entero, sin huecos ni solapes
    let expectedY = 0;
    for (const o of opts) {
      expect(o.y).toBe(expectedY);
      expectedY += o.height!;
    }
    expect(expectedY).toBe(HEIGHT_52_PAGES);

    expect(addImageMock).toHaveBeenCalledTimes(52);
    // addImage(data, format, x, y, w, h, alias, compression): sin compresión, 52 páginas pesarían ~470 MB
    for (const call of addImageMock.mock.calls) expect(call[7]).toBe('FAST');
    expect(addPageMock).toHaveBeenCalledTimes(51);
    expect(onProgress).toHaveBeenLastCalledWith(52, 52);
  });

});

// Modo "auto" con documentos largos. Dos bugs a cubrir:
//  - un único canvas del alto total excede el límite y sale en blanco (o, si se
//    bajaba el scale para evitarlo, el texto quedaba ilegible);
//  - una página de más de 14.400 unidades se recorta en silencio (jsPDF): el modo
//    "auto" anterior perdía así el último ~34% del documento de 41 páginas.
describe('convertHtmlToPdf "auto" — documentos largos: scale 2, sin canvas gigante y sin recortes', () => {
  beforeEach(resetMocks);

  const WIDTH = 732;
  const HEIGHT_41_PAGES = 41_898; // el documento de prueba medido en Chrome

  it('planAutoCapture: scale 2, tramos dentro de los límites y página dentro del máximo de un PDF', () => {
    const plan = planAutoCapture(WIDTH, HEIGHT_41_PAGES);
    expect(plan.scale).toBe(2);
    expect(plan.chunkCount).toBeGreaterThan(1);
    const chunkW = WIDTH * plan.scale;
    const chunkH = plan.chunkHeightCss * plan.scale;
    expect(chunkH).toBeLessThanOrEqual(MAX_CANVAS_SIDE);
    expect(chunkW * chunkH).toBeLessThanOrEqual(MAX_CANVAS_AREA);
    // la página se achica en vez de recortarse, respetando la proporción del contenido
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

// Contenido más ancho que la vista previa (ej. una tabla de 1.400px dentro del
// recuadro de ~734px): antes se capturaba solo el recuadro y la parte derecha
// se perdía en los tres modos. Caso medido en Chrome: recuadro 734px con 1px de
// borde, scrollWidth 1416 -> contenido real de 1416 + 2 = 1418px.
describe('convertHtmlToPdf — contenido que desborda la vista previa se captura completo', () => {
  beforeEach(resetMocks);

  const wideElement = () => makeOverflowingElement(734, 300, 1416, 298);

  it.each(['A4', 'Letter'] as const)('%s: captura el ancho real del contenido y escala TODO para que entre en el ancho de la página', async size => {
    await convertHtmlToPdf(wideElement(), size);

    const opts = captureOptions();
    for (const o of opts) {
      expect(o.x).toBe(0);
      expect(o.width).toBe(1418); // no 734: el desborde entra en la captura
    }
    const pageW = lastJsPdfCtorArgs!.format[0];
    for (const call of addImageMock.mock.calls) {
      expect(call[2]).toBe(0);
      expect(call[4]).toBe(pageW); // el contenido más ancho ocupa justo el ancho de la página
    }
  });

  it('A4: el alto de página en px CSS crece en la misma proporción que el ancho (escalado proporcional, no deformado)', () => {
    const narrow = planCapture(734, 5000, 595, 842);
    const wide = planCapture(1418, 5000, 595, 842);
    expect(wide.pageHeightCss / 1418).toBeCloseTo(narrow.pageHeightCss / 734, 2);
    expect(wide.pageCount).toBeLessThan(narrow.pageCount); // más contenido por página, porque se achica
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
