export const BASE_URL = 'https://pdf-converter-freee.netlify.app';
export const SITE_NAME = 'PDF Converter';

/** Square, for Organization.logo in the structured data (see scripts/generate-og-images.mjs). */
export const LOGO_URL = `${BASE_URL}/logo-512.png`;

// Site operator details, shown in the privacy policy (data controller), terms
// (governing law), about page and the Organization JSON-LD.
export const OPERATOR_NAME = 'Erick Paine';
export const OPERATOR_COUNTRY = 'Panamá';
export const CONTACT_EMAIL = 'e3522e@gmail.com';

// Canonical form WITH trailing slash: the pre-render writes <route>/index.html
// and Netlify answers /contacto with a 301 to /contacto/, so only the slashed
// form returns 200 directly.
export function canonicalUrl(path: string): string {
  if (!path || path === '/') return `${BASE_URL}/`;
  return `${BASE_URL}${path.endsWith('/') ? path : `${path}/`}`;
}
