import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import { convertHtmlToPdf, MAX_PDF_PAGE_PT } from './htmlToPdf';
import { makeSolidPngBytes } from '../test/fixtures';

// A diferencia de htmlToPdf.test.ts, acá jsPDF es el REAL: el bug de pérdida de
// contenido del modo "auto" no estaba en nuestra lógica sino en cómo jsPDF trata
// una página de más de 14.400 unidades (la recorta, solo con un console.warn), y
// eso un mock de jsPDF no lo puede detectar. Se genera el PDF de verdad y se lo
// lee con pdf.js para verificar dónde quedó cada imagen y con qué resolución.
//
// html2canvas sí se mockea (no corre en jsdom): devuelve un PNG real, liso, del
// tamaño exacto que html2canvas generaría para el recorte y el scale pedidos.
interface CaptureOptions { scale: number; y?: number; width?: number; height?: number }

vi.mock('html2canvas', () => ({
  default: vi.fn(async (_el: HTMLElement, opts: CaptureOptions) => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(opts.width! * opts.scale);
    canvas.height = Math.floor(opts.height! * opts.scale);
    return canvas;
  }),
}));

// El canvas de vitest-canvas-mock no produce un PNG válido (jsPDF lo rechazaría):
// toDataURL devuelve acá un PNG real, liso, con las dimensiones del canvas. Sirve
// tanto para las capturas como para las franjas que recorta A4/Carta.
HTMLCanvasElement.prototype.toDataURL = function (this: HTMLCanvasElement) {
  return `data:image/png;base64,${Buffer.from(makeSolidPngBytes(this.width, this.height, [40, 40, 40])).toString('base64')}`;
};

function makeElement(width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ width, height, top: 0, left: 0, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  return el;
}

// page.getOperatorList() de pdf.js usa Map/WeakMap.prototype.getOrInsertComputed
// (ES2026), que el realm de jsdom todavía no trae (ver src/test/pdfjsMock.ts).
for (const proto of [Map.prototype, WeakMap.prototype] as Array<Map<object, unknown>>) {
  if (typeof (proto as { getOrInsertComputed?: unknown }).getOrInsertComputed !== 'function') {
    Object.defineProperty(proto, 'getOrInsertComputed', {
      configurable: true,
      writable: true,
      value(this: Map<object, unknown>, key: object, compute: (key: object) => unknown) {
        if (!this.has(key)) this.set(key, compute(key));
        return this.get(key);
      },
    });
  }
}

interface PlacedImage { widthPx: number; heightPx: number; x: number; y: number; w: number; h: number }

/** Lee la única página del PDF con pdf.js: su tamaño y cada imagen con su posición (pt) y resolución (px). */
async function inspectPdf(bytes: ArrayBuffer) {
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await doc.getPage(1);
  const [, , pageW, pageH] = page.view;
  const ops = await page.getOperatorList();
  const images: PlacedImage[] = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  ops.fnArray.forEach((fn, i) => {
    const args = ops.argsArray[i];
    if (fn === pdfjsLib.OPS.transform) ctm = args as number[];
    if (fn === pdfjsLib.OPS.paintImageXObject) {
      // una imagen se dibuja en el cuadrado unitario escalado por la CTM: [w 0 0 h x y]
      const [w, , , h, x, y] = ctm;
      images.push({ widthPx: args[1], heightPx: args[2], x, y, w, h });
    }
  });
  return { pageCount: doc.numPages, pageW, pageH, images };
}

let savedPdf: ArrayBuffer | null = null;

describe('convertHtmlToPdf "auto" — PDF real (jsPDF sin mock, leído con pdf.js)', () => {
  // jsPDF copia los métodos de jsPDF.API sobre cada instancia nueva (pisando su
  // save() interno), así que se reemplaza ahí en vez de con vi.spyOn.
  const api = jsPDF.API as { save?: unknown };
  const originalSave = api.save;

  beforeEach(() => {
    savedPdf = null;
    api.save = function (this: jsPDF) {
      savedPdf = this.output('arraybuffer');
      return this;
    };
  });
  afterEach(() => {
    api.save = originalSave;
    vi.restoreAllMocks();
  });

  it('reproducción del bug preexistente: jsPDF recorta en silencio una página de más de 14.400 unidades', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pdf = new jsPDF({ unit: 'pt', format: [300, 20_000] });
    expect(pdf.internal.pageSize.getHeight()).toBe(MAX_PDF_PAGE_PT); // 5.600 pt de contenido afuera
    expect(warn).toHaveBeenCalled();
  });

  it('documento de 41 páginas (732 x 41.898 px CSS): una página, todo el contenido adentro y a resolución scale 2', async () => {
    const WIDTH = 732;
    const HEIGHT = 41_898;
    const warn = vi.spyOn(console, 'warn');

    await convertHtmlToPdf(makeElement(WIDTH, HEIGHT), 'auto');

    expect(savedPdf).not.toBeNull();
    const { pageCount, pageW, pageH, images } = await inspectPdf(savedPdf!);
    // jsPDF no tuvo que recortar nada
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('14400'));

    expect(pageCount).toBe(1);
    expect(pageH).toBeLessThanOrEqual(MAX_PDF_PAGE_PT);
    expect(pageW / pageH).toBeCloseTo(WIDTH / HEIGHT, 6); // misma proporción que el contenido
    expect(images.length).toBeGreaterThan(1);

    // sin pérdida: cada imagen está completa DENTRO de la página, y apiladas
    // (de arriba hacia abajo) cubren toda la altura sin huecos ni solapes.
    const EPS = 1e-3;
    const topDown = [...images].sort((a, b) => b.y - a.y); // PDF: y crece hacia arriba
    let expectedTop = pageH;
    for (const img of topDown) {
      expect(img.x).toBeCloseTo(0, 3);
      expect(img.w).toBeCloseTo(pageW, 3);
      expect(img.y).toBeGreaterThanOrEqual(-EPS);
      expect(img.y + img.h).toBeLessThanOrEqual(pageH + EPS);
      expect(img.y + img.h).toBeCloseTo(expectedTop, 3);
      expectedTop = img.y;
    }
    expect(expectedTop).toBeCloseTo(0, 3);

    // nitidez: las imágenes guardan 2 px por px CSS del contenido (scale 2),
    // aunque la página se haya achicado para entrar en el máximo de un PDF.
    for (const img of images) expect(img.widthPx).toBe(WIDTH * 2);
    expect(images.reduce((sum, img) => sum + img.heightPx, 0)).toBe(HEIGHT * 2);
  }, 60_000);

  it.each(['A4', 'Letter', 'auto'] as const)(
    '%s: tabla más ancha que la vista previa (recuadro 734px, contenido 1418px) -> todo el ancho dentro de la página',
    async size => {
      const el = makeElement(734, 300);
      const layout = { offsetWidth: 734, clientWidth: 732, scrollWidth: 1416, offsetHeight: 300, clientHeight: 298, scrollHeight: 298 };
      for (const [key, value] of Object.entries(layout)) Object.defineProperty(el, key, { configurable: true, value });

      await convertHtmlToPdf(el, size);

      const { pageW, images } = await inspectPdf(savedPdf!);
      expect(images.length).toBeGreaterThan(0);
      for (const img of images) {
        expect(img.widthPx).toBe(1418 * 2); // la captura incluye el desborde completo, a scale 2
        expect(img.x).toBeGreaterThanOrEqual(-1e-3);
        expect(img.x + img.w).toBeLessThanOrEqual(pageW + 1e-3); // y entra entera en el ancho de la página
        expect(img.w).toBeCloseTo(pageW, 3);
      }
    }
  );

  it('documento corto: página 1:1 con el contenido (1 px CSS = 0.75 pt), una sola imagen a scale 2', async () => {
    await convertHtmlToPdf(makeElement(600, 900), 'auto');

    const { pageW, pageH, images } = await inspectPdf(savedPdf!);
    expect(pageW).toBeCloseTo(450, 3);
    expect(pageH).toBeCloseTo(675, 3);
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({ widthPx: 1200, heightPx: 1800 });
  });
});
