import { vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { makePdfBytes } from './fixtures';

/**
 * pdfjs-dist's real render (page.render) uses very recent JS engine APIs (e.g.
 * Map.prototype.getOrInsertComputed) that jsdom's realm doesn't expose yet, so
 * it would crash any test that draws a real page. `render` is mocked on the
 * shared PDFPageProxy prototype (affecting every page instance, present and
 * future) so we can test our own loop/progress/format logic without depending
 * on that part of pdf.js, which isn't ours to test.
 */
export async function mockPdfPageRender() {
  const bytes = await makePdfBytes(1);
  const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
  const page = await doc.getPage(1);
  const proto = Object.getPrototypeOf(page);
  return vi.spyOn(proto, 'render').mockReturnValue({ promise: Promise.resolve() } as ReturnType<typeof page.render>);
}
