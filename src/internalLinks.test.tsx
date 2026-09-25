import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { toolPath } from './lib/tools';

// Netlify responde /about con 301 a /about/ (URL canónica, ver SeoHead.tsx):
// todo link interno debe apuntar directo a la forma con barra final.
const ROUTES = ['/', toolPath('merge-pdfs'), '/about/', '/contact/', '/privacy/', '/terms/', '/__not-found__'];

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
