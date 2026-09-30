/* eslint-disable react-refresh/only-export-components -- build-time SSR entry (scripts/prerender.mjs), never goes through Fast Refresh */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';

// scripts/prerender.mjs takes the routes (single source: lib/tools.ts) and the
// base URL from here to generate dist/sitemap.xml.
export { PRERENDER_ROUTES, TOOL_SLUGS, PAGE_SLUGS } from './lib/tools';
export { GUIDE_FILES } from './content/guides';
export { canonicalUrl } from './lib/site';

// React 19 hoists <title>/<meta>/<link> rendered anywhere in the tree to the
// start of the output string, so plain renderToString is enough, with no
// server-side metadata provider.
export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}
