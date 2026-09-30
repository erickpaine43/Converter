import { SITE_OG_IMAGE } from '../lib/tools';
import { BASE_URL, SITE_NAME, canonicalUrl } from '../lib/site';

interface Props {
  title: string;
  description: string;
  path?: string;
  /** Sharing image (path in public/, 1200x630). Defaults to the site-wide one. */
  image?: string;
  /** Pages that must not be indexed (e.g. the 404): adds robots noindex and omits canonical/og:url. */
  noindex?: boolean;
  /** og:type: 'article' for guides, 'website' for everything else. */
  type?: 'website' | 'article';
}

// React 19 native metadata tags: they're hoisted into <head> automatically no
// matter where they render in the tree, and work the same on the client and in
// renderToString (SSR/pre-render), unlike react-helmet-async.
export default function SeoHead({ title, description, path = '', image = SITE_OG_IMAGE, noindex = false, type = 'website' }: Props) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = canonicalUrl(path);
  const imageUrl = `${BASE_URL}${image}`;
  // The images in public/og/ show the site and tool names.
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
      <meta property="og:type" content={type} />
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
