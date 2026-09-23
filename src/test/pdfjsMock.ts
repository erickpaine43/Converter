import { vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { makePdfBytes } from './fixtures';

/**
 * El render real de pdfjs-dist (page.render) usa APIs de motor JS muy nuevas
 * (ej. Map.prototype.getOrInsertComputed) que el realm de jsdom todavía no expone,
 * y tronaría en cualquier test que dibuje una página real. Mockeamos `render` en el
 * prototype compartido de PDFPageProxy (afecta a toda instancia de página, presente
 * y futura) para poder probar nuestra propia lógica de loop/progreso/formato sin
 * depender de esa pieza de pdf.js que no es nuestra responsabilidad.
 */
export async function mockPdfPageRender() {
  const bytes = await makePdfBytes(1);
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await doc.getPage(1);
  const proto = Object.getPrototypeOf(page);
  return vi.spyOn(proto, 'render').mockReturnValue({ promise: Promise.resolve() } as ReturnType<typeof page.render>);
}
