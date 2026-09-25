export const BASE_URL = 'https://pdf-converter-freee.netlify.app';
export const SITE_NAME = 'PDF Converter';

/** Cuadrado, para Organization.logo en los datos estructurados (ver scripts/generate-og-images.mjs). */
export const LOGO_URL = `${BASE_URL}/logo-512.png`;

// Forma canónica CON barra final: el pre-render genera <ruta>/index.html y
// Netlify responde /about con 301 a /about/, así que solo /about/ da 200 directo.
export function canonicalUrl(path: string): string {
  if (!path || path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path.endsWith('/') ? path : `${path}/`}`;
}
