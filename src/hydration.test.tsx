import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { waitFor } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { StaticRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { PRERENDER_ROUTES } from './lib/tools';

// Pre-rendering regression test: hydrates against the HTML that
// entry-server.tsx actually produces (same AppRoutes, same StaticRouter) and
// fails if React reports any hydration mismatch (different text, different
// attributes, or a Suspense boundary that doesn't match between server and client).
const ROUTES = PRERENDER_ROUTES;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  root?.unmount();
  container?.remove();
  root = null;
  container = null;
  window.history.pushState({}, '', '/');
});

// Netlify serves dist/404.html (pre-rendered from NOT_FOUND_ROUTE) for any URL
// without its own file; the client hydrates that HTML at the real URL.
const NOT_FOUND_ROUTE = '/__not-found__';
const CASES: { route: string; serverRoute: string }[] = [
  ...ROUTES.map(route => ({ route, serverRoute: route })),
  { route: '/pagina-que-no-existe', serverRoute: NOT_FOUND_ROUTE },
  { route: '/converter/noexiste', serverRoute: NOT_FOUND_ROUTE },
  // Old English URL: in production Netlify 301-redirects it before it gets here
  { route: '/converter/merge-pdfs', serverRoute: NOT_FOUND_ROUTE },
];

describe('Hidratación SSR -> cliente por ruta', () => {
  for (const { route, serverRoute } of CASES) {
    it(`hidrata ${route} sin warnings de mismatch`, async () => {
      // 1. "Server" render: the same function scripts/prerender.mjs uses.
      const serverHtml = renderToString(
        <StaticRouter location={serverRoute}>
          <AppRoutes />
        </StaticRouter>
      );

      // 2. Mount that raw HTML in the DOM, exactly as dist/<route>/index.html serves it.
      container = document.createElement('div');
      container.innerHTML = serverHtml;
      document.body.appendChild(container);
      window.history.pushState({}, '', route);

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const recoverableErrors: unknown[] = [];

      // 3. Hydrate with the real client tree (StrictMode + BrowserRouter, like main.tsx).
      root = hydrateRoot(
        container,
        <StrictMode>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StrictMode>,
        {
          onRecoverableError: (error) => { recoverableErrors.push(String(error)); },
        }
      );

      // On tool pages, wait for the lazy() widget to load and replace the
      // "Cargando herramienta…" placeholder from the pre-rendered HTML.
      await waitFor(() => expect(container!.querySelector('.converter-loading')).toBeNull(), { timeout: 5000 });

      const hydrationWarnings = consoleError.mock.calls.filter(args =>
        args.some(a => typeof a === 'string' && /hydrat/i.test(a))
      );

      expect(recoverableErrors, JSON.stringify(recoverableErrors)).toHaveLength(0);
      expect(hydrationWarnings, JSON.stringify(hydrationWarnings)).toHaveLength(0);

      consoleError.mockRestore();
    });
  }
});

describe('Hidratación con año distinto al del build', () => {
  it('no reporta mismatch si el footer se pre-renderizó en un año anterior', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2026-12-31T23:00:00'));
      const serverHtml = renderToString(
        <StaticRouter location="/">
          <AppRoutes />
        </StaticRouter>
      );

      container = document.createElement('div');
      container.innerHTML = serverHtml;
      document.body.appendChild(container);

      vi.setSystemTime(new Date('2027-01-01T01:00:00'));
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const recoverableErrors: string[] = [];
      root = hydrateRoot(
        container,
        <StrictMode>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StrictMode>,
        { onRecoverableError: (error) => { recoverableErrors.push(String(error)); } }
      );
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(recoverableErrors, JSON.stringify(recoverableErrors)).toHaveLength(0);
      expect(consoleError.mock.calls.filter(args => args.some(a => typeof a === 'string' && /hydrat/i.test(a)))).toHaveLength(0);
      expect(container.querySelector('.footer-copy')?.textContent).toContain('2026');
      consoleError.mockRestore();
    } finally {
      vi.useRealTimers();
    }
  });
});
