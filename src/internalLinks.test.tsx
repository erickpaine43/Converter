import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { GUIDE_SLUGS } from './content/guides';
import { guidePath, pagePath, toolPath } from './lib/tools';

// Netlify answers /contacto with a 301 to /contacto/ (canonical URL, see
// SeoHead.tsx), so every internal link must point straight to the slashed form.
const ROUTES = [
  '/', toolPath('merge-pdfs'), pagePath('guides'), guidePath(GUIDE_SLUGS[0]),
  pagePath('about'), pagePath('contact'), pagePath('privacy'), pagePath('terms'), '/__not-found__',
];

describe('Links internos con barra final', () => {
  for (const route of ROUTES) {
    it(`todos los href internos de ${route} terminan en "/"`, () => {
      const html = renderToString(
        <StaticRouter location={route}>
          <AppRoutes />
        </StaticRouter>
      );
      const hrefs = [...html.matchAll(/<a [^>]*href="(\/[^"]*)"/g)].map(m => m[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.filter(h => !h.split(/[?#]/)[0].endsWith('/'))).toEqual([]);
    });
  }
});
