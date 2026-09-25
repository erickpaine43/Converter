interface Props {
  title: string;
  description: string;
  path?: string;
  /** Páginas que no deben indexarse (ej. la 404): agrega robots noindex y omite canonical/og:url. */
  noindex?: boolean;
}

const BASE_URL = 'https://pdf-converter-freee.netlify.app';

// Forma canónica CON barra final: el pre-render genera <ruta>/index.html y
// Netlify responde /about con 301 a /about/, así que solo /about/ da 200 directo.
function canonicalPath(path: string): string {
  if (!path || path === '/') return '/';
  return path.endsWith('/') ? path : `${path}/`;
}

// Tags nativos de metadata de React 19: se "hoistean" al <head> automáticamente
// sin importar dónde se rendericen en el árbol — funciona igual en el cliente
// y en renderToString (SSR/pre-render), a diferencia de react-helmet-async.
export default function SeoHead({ title, description, path = '', noindex = false }: Props) {
  const fullTitle = `${title} | PDF Converter`;
  const url = `${BASE_URL}${canonicalPath(path)}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}
      {!noindex && <link rel="canonical" href={url} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {!noindex && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
    </>
  );
}
