import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export type PaperSize = 'A4' | 'Letter' | 'auto';
export type HtmlToPdfProgress = (done: number, total: number) => void;

const paperDimensions: Record<string, [number, number]> = {
  A4:     [595, 842],
  Letter: [612, 792],
};

// Límites de canvas de los navegadores: si un canvas los supera, NO se lanza
// ninguna excepción -> getContext() devuelve un contexto que no dibuja nada y
// toDataURL() devuelve "data:," (canvas vacío). Medido en Chrome 153: máximo
// 65.535 px por lado y 268.435.456 px de área (16384²). Firefox corta en 32.767
// por lado y Safari de iOS en 16.777.216 px de área (4096²). Usamos el más
// restrictivo de cada uno para que la captura sea segura en cualquier navegador.
export const MAX_CANVAS_SIDE = 16_384;
export const MAX_CANVAS_AREA = 16_777_216;
const PREFERRED_SCALE = 2;

export interface CapturePlan {
  scale: number;
  /** Alto de una página del PDF, en px CSS del elemento. */
  pageHeightCss: number;
  pageCount: number;
  /** Cuántas páginas se capturan por cada llamada a html2canvas. */
  pagesPerChunk: number;
}

/** Mayor scale (<= PREFERRED_SCALE) con el que un canvas de width x height CSS px entra en los límites. */
function fitScale(widthCss: number, heightCss: number): number {
  return Math.min(
    PREFERRED_SCALE,
    MAX_CANVAS_SIDE / widthCss,
    MAX_CANVAS_SIDE / heightCss,
    Math.sqrt(MAX_CANVAS_AREA / (widthCss * heightCss)),
  );
}

/**
 * Decide cómo capturar un elemento de widthCss x heightCss en páginas del
 * tamaño pedido sin generar nunca un canvas que exceda los límites del
 * navegador: se captura en tramos alineados a páginas completas (varias
 * páginas por tramo, para no repetir el clonado del DOM de html2canvas una
 * vez por página), en vez de capturar todo de una y recortar después.
 */
export function planCapture(widthCss: number, heightCss: number, pdfW: number, pdfH: number): CapturePlan {
  const pageHeightCss = Math.max(1, Math.floor(widthCss * pdfH / pdfW));
  // una sola página tiene que entrar sí o sí: si el contenido es muy ancho se
  // baja el scale (solo en ese caso extremo; lo normal es mantener 2x).
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
  // html2canvas captura por defecto solo el recuadro del elemento: lo que lo
  // desborda (ej. una tabla más ancha que la vista previa) quedaba afuera del
  // PDF. scrollWidth/scrollHeight incluyen ese desborde, así que se captura el
  // contenido real completo; planCapture/planAutoCapture escalan todo en
  // proporción para que ese ancho entre en la página. scroll* se mide desde el
  // borde interno y la captura arranca en el externo: se suman los bordes
  // (offset* - client*) para no perder la última fila/columna de píxeles.
  //
  // NO CUBIERTO A PROPÓSITO: desborde hacia la IZQUIERDA o hacia ARRIBA del
  // elemento (ej. margin-left/top negativos o position con left/top negativos).
  // scrollWidth/scrollHeight solo miden el desborde hacia la derecha y hacia
  // abajo, y la captura arranca en el borde superior izquierdo del elemento, así
  // que lo que se salga más allá del padding + borde de la vista previa (~17px)
  // queda fuera del PDF. Verificado en Chrome: un margin-left de -60px se corta,
  // mientras que el margin-left:-5.4pt típico de las tablas exportadas por Word
  // entra sin problema (cae dentro del padding).
  // Cubrirlo exigiría recorrer los descendientes buscando el borde más a la
  // izquierda/arriba y capturar con x/y negativos, pero eso rompe con el patrón
  // de accesibilidad text-indent:-9999px (texto oculto a la vista, legible por
  // lectores de pantalla): se capturarían ~10.000px en blanco y el documento
  // entero se achicaría hasta quedar ilegible. Se decidió no cubrirlo por ser un
  // caso raro en la práctica; si hiciera falta, habría que ignorar los
  // elementos ocultos de esa forma al calcular el borde.
  const rect = element.getBoundingClientRect();
  const bordersX = element.offsetWidth - element.clientWidth;
  const bordersY = element.offsetHeight - element.clientHeight;
  return {
    widthCss: Math.max(1, Math.ceil(rect.width), element.scrollWidth + bordersX),
    heightCss: Math.max(1, Math.ceil(rect.height), element.scrollHeight + bordersY),
  };
}

// Un PDF no admite páginas de más de 14.400 unidades por lado (jsPDF las recorta
// a ese tamaño con solo un console.warn, perdiendo el contenido que sobra).
export const MAX_PDF_PAGE_PT = 14_400;
const PT_PER_CSS_PX = 0.75; // 72 pt por pulgada / 96 px CSS por pulgada

export interface AutoCapturePlan {
  scale: number;
  /** Alto de cada tramo capturado, en px CSS (el último puede ser más bajo). */
  chunkHeightCss: number;
  chunkCount: number;
  /** Tamaño de la única página del PDF, en pt. */
  pageWidthPt: number;
  pageHeightPt: number;
  /** pt de página por px CSS de contenido (0.75 salvo que haya que achicar la página). */
  ptPerCss: number;
}

/**
 * Plan del modo "auto": una sola página ajustada al contenido. El contenido se
 * captura en tramos (a scale 2, cada uno dentro de los límites de canvas) que
 * se apilan como imágenes separadas en esa página, sin unirlos nunca en un
 * canvas del alto total (que en documentos largos excede el límite y sale en blanco).
 *
 * La página se dimensiona 1:1 (1 px CSS = 0.75 pt) mientras entre en el máximo
 * de un PDF; si el contenido es más largo, se achica la página proporcionalmente
 * en vez de recortarla. Las imágenes conservan su resolución de scale 2: solo
 * cambia el tamaño físico con el que se muestran a zoom 100%.
 */
export function planAutoCapture(widthCss: number, heightCss: number): AutoCapturePlan {
  // scale 2 siempre, salvo contenido de más de 8.192 px CSS de ancho, donde ni
  // una franja de 1 px de alto entraría en MAX_CANVAS_SIDE a scale 2.
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
    // cada tramo va justo debajo del anterior, sobre la misma página
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

    // x/y/width/height de html2canvas recortan la captura (relativos al
    // elemento): el canvas resultante mide solo este tramo, nunca el documento entero.
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      x: 0,
      y: chunkY,
      width: widthCss,
      height: chunkHeightCss,
    });

    // se recorta el tramo en páginas; los bordes se redondean desde la misma
    // proporción para que las franjas queden contiguas (sin huecos ni solapes).
    const canvasPxPerCss = canvas.height / chunkHeightCss;
    for (let j = 0; j < pagesInChunk; j++) {
      const sourceY = Math.round(j * pageHeightCss * canvasPxPerCss);
      const sourceEnd = Math.min(canvas.height, Math.round((j + 1) * pageHeightCss * canvasPxPerCss));
      const sliceHeight = Math.max(1, sourceEnd - sourceY);
      const slice = sliceCanvas(canvas, sourceY, sliceHeight);

      if (pageIndex > 0) pdf.addPage();
      // ancho del canvas -> ancho de la página; el alto se escala en la misma proporción.
      // 'FAST' = compresión deflate sin pérdida; sin ella jsPDF guarda los píxeles
      // crudos (~9 MB por página a scale 2).
      pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pdfW, sliceHeight * pdfW / canvas.width, undefined, 'FAST');
      pageIndex++;
      onProgress?.(pageIndex, pageCount);
    }
  }

  pdf.save('converted.pdf');
}
