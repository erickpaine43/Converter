import { SITE_OG_IMAGE } from '../lib/tools';
import { BASE_URL, SITE_NAME, canonicalUrl } from '../lib/site';

interface Props {
  title: string;
  description: string;
  path?: string;
  /** Imagen para compartir (ruta en public/, 1200x630). Por defecto, la genérica del sitio. */
  image?: string;
  /** Páginas que no deben indexarse (ej. la 404): agrega robots noindex y omite canonical/og:url. */
  noindex?: boolean;
}

// Tags nativos de metadata de React 19: se "hoistean" al <head> automáticamente
// sin importar dónde se rendericen en el árbol — funciona igual en el cliente
// y en renderToString (SSR/pre-render), a diferencia de react-helmet-async.
export default function SeoHead({ title, description, path = '', image = SITE_OG_IMAGE, noindex = false }: Props) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = canonicalUrl(path);
  const imageUrl = `${BASE_URL}${image}`;
  // Las imágenes de public/og/ muestran el nombre del sitio y de la herramienta.
  const imageAlt = `${title} — ${SITE_NAME}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {!noindex && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />
    </>
  );
}
