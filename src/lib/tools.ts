import { GUIDE_SLUGS } from '../content/guides';

// Single source of truth for the site's routes. Each tool's internal ID (the
// key for its texts/FAQ in ConverterPage) never changes; the public part is the
// Spanish slug, which is what people search for ("unir pdf").
export const TOOL_SLUGS = {
  'merge-pdfs':    'unir-pdf',
  'images-to-pdf': 'imagenes-a-pdf',
  'pdf-to-images': 'pdf-a-imagenes',
  'pdf-to-text':   'pdf-a-texto',
  'html-to-pdf':   'html-a-pdf',
} as const;

export type ToolId = keyof typeof TOOL_SLUGS;

export const TOOL_IDS = Object.keys(TOOL_SLUGS) as ToolId[];

/** Short name (Home cards, footer, "Otras herramientas"). */
export const TOOL_LABELS: Record<ToolId, string> = {
  'merge-pdfs':    'Unir PDFs',
  'images-to-pdf': 'Imágenes a PDF',
  'pdf-to-images': 'PDF a Imágenes',
  'pdf-to-text':   'PDF a Texto',
  'html-to-pdf':   'HTML a PDF',
};

/** One-line description for tool cards and listings. */
export const TOOL_SHORT_DESCS: Record<ToolId, string> = {
  'merge-pdfs':    'Combina varios PDFs en uno solo',
  'images-to-pdf': 'Convierte JPG y PNG a PDF',
  'pdf-to-images': 'Extrae páginas como imágenes',
  'pdf-to-text':   'Extrae el texto de un PDF',
  'html-to-pdf':   'Convierte archivos o código HTML a PDF',
};

/** Site-wide sharing image (Open Graph/Twitter); see scripts/generate-og-images.mjs. */
export const SITE_OG_IMAGE = '/og/sitio.png';

/** Per-tool sharing image (1200x630, in public/og/). */
export function toolOgImage(id: ToolId): string {
  return `/og/${TOOL_SLUGS[id]}.png`;
}

/** Canonical tool URL, WITH trailing slash (see SeoHead.tsx). */
export function toolPath(id: ToolId): string {
  return `/${TOOL_SLUGS[id]}/`;
}

/** Site pages, also with Spanish slugs. */
export const PAGE_SLUGS = {
  about:   'sobre-nosotros',
  contact: 'contacto',
  privacy: 'privacidad',
  terms:   'terminos',
  guides:  'guias',
} as const;

export type PageId = keyof typeof PAGE_SLUGS;

/** Canonical URL of a site page, WITH trailing slash. */
export function pagePath(id: PageId): string {
  return `/${PAGE_SLUGS[id]}/`;
}

/** Canonical URL of a guide, WITH trailing slash. */
export function guidePath(slug: string): string {
  return `/${PAGE_SLUGS.guides}/${slug}/`;
}

/**
 * Routes pre-rendered to <route>/index.html (scripts/prerender.mjs) and listed
 * in the dist/sitemap.xml generated at build time (with trailing slash).
 */
export const PRERENDER_ROUTES: string[] = [
  '/',
  ...TOOL_IDS.map(id => `/${TOOL_SLUGS[id]}`),
  `/${PAGE_SLUGS.guides}`,
  ...GUIDE_SLUGS.map(slug => `/${PAGE_SLUGS.guides}/${slug}`),
  `/${PAGE_SLUGS.about}`,
  `/${PAGE_SLUGS.contact}`,
  `/${PAGE_SLUGS.privacy}`,
  `/${PAGE_SLUGS.terms}`,
];

/**
 * Old English URLs that netlify.toml 301-redirects to the new ones. Only used by
 * the test that checks no redirect is missing (siteConfig.test.ts).
 */
export const LEGACY_TOOL_PATHS: Record<string, string> = Object.fromEntries(
  TOOL_IDS.map(id => [`/converter/${id}`, toolPath(id)])
);

export const LEGACY_PAGE_PATHS: Record<string, string> = {
  '/about':   pagePath('about'),
  '/contact': pagePath('contact'),
  '/privacy': pagePath('privacy'),
  '/terms':   pagePath('terms'),
};
