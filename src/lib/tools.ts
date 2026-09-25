// Única fuente de verdad de las rutas del sitio. El ID interno de cada
// herramienta (clave de los textos/FAQ en ConverterPage) no cambia; lo público
// es el slug en español, que es lo que la gente busca ("unir pdf").
export const TOOL_SLUGS = {
  'merge-pdfs':    'unir-pdf',
  'images-to-pdf': 'imagenes-a-pdf',
  'pdf-to-images': 'pdf-a-imagenes',
  'pdf-to-text':   'pdf-a-texto',
  'html-to-pdf':   'html-a-pdf',
} as const;

export type ToolId = keyof typeof TOOL_SLUGS;

export const TOOL_IDS = Object.keys(TOOL_SLUGS) as ToolId[];

/** URL canónica de la herramienta, CON barra final (ver SeoHead.tsx). */
export function toolPath(id: ToolId): string {
  return `/${TOOL_SLUGS[id]}/`;
}

/**
 * Rutas que se pre-renderizan a <ruta>/index.html (scripts/prerender.mjs) y que
 * lista public/sitemap.xml (con barra final; lo verifica siteConfig.test.ts).
 */
export const PRERENDER_ROUTES: string[] = [
  '/',
  ...TOOL_IDS.map(id => `/${TOOL_SLUGS[id]}`),
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

/**
 * URLs viejas en inglés (/converter/<id>) que netlify.toml redirige con 301 a
 * toolPath(id). Solo para el test que controla que no falte ningún redirect.
 */
export const LEGACY_TOOL_PATHS: Record<string, string> = Object.fromEntries(
  TOOL_IDS.map(id => [`/converter/${id}`, toolPath(id)])
);
