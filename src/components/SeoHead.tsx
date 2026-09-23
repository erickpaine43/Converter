interface Props {
  title: string;
  description: string;
  path?: string;
}

const BASE_URL = 'https://pdf-converter-freee.netlify.app';

// Tags nativos de metadata de React 19: se "hoistean" al <head> automáticamente
// sin importar dónde se rendericen en el árbol — funciona igual en el cliente
// y en renderToString (SSR/pre-render), a diferencia de react-helmet-async.
export default function SeoHead({ title, description, path = '' }: Props) {
  const fullTitle = `${title} | PDF Converter`;
  const url = `${BASE_URL}${path}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
    </>
  );
}
