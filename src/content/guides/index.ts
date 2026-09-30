import type { Guide } from '../types';
import reducirPeso from './reducir-peso-pdf';
import pdfEscaneado from './pdf-escaneado';
import unirSinPerderCalidad from './unir-pdf-sin-perder-calidad';
import fotosCelular from './fotos-celular-a-pdf';
import pngOJpg from './png-o-jpg';
import abrirHtml from './abrir-html-como-pdf';

// One guide per file: scripts/prerender.mjs uses each file's last commit date as
// the <lastmod> of its URL in the sitemap. New guides get their own file and an
// entry here (this order is the order of the /guias/ index).
export const GUIDES: Guide[] = [
  unirSinPerderCalidad,
  reducirPeso,
  fotosCelular,
  pdfEscaneado,
  pngOJpg,
  abrirHtml,
];

export const GUIDE_SLUGS: string[] = GUIDES.map(g => g.slug);

/** Each guide's file name, for the sitemap's <lastmod>. */
export const GUIDE_FILES: Record<string, string> = {
  [unirSinPerderCalidad.slug]: 'unir-pdf-sin-perder-calidad.ts',
  [reducirPeso.slug]: 'reducir-peso-pdf.ts',
  [fotosCelular.slug]: 'fotos-celular-a-pdf.ts',
  [pdfEscaneado.slug]: 'pdf-escaneado.ts',
  [pngOJpg.slug]: 'png-o-jpg.ts',
  [abrirHtml.slug]: 'abrir-html-como-pdf.ts',
};

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
