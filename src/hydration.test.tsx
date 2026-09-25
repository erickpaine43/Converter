import { describe, it, expect, vi, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { waitFor } from '@testing-library/react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { StaticRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { PRERENDER_ROUTES } from './lib/tools';

// Regresión para el pre-rendering: hidrata contra el HTML que realmente
// produce entry-server.tsx (mismo AppRoutes, mismo StaticRouter) y falla si
// React reporta cualquier mismatch de hidratación (texto distinto, atributos
// distintos, o un boundary de Suspense que no calza entre server y cliente).
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

// Netlify sirve dist/404.html (pre-renderizado desde NOT_FOUND_ROUTE) para
// cualquier URL sin archivo propio: el cliente hidrata ese HTML en la URL real.
const NOT_FOUND_ROUTE = '/__not-found__';
const CASES: { route: string; serverRoute: string }[] = [
  ...ROUTES.map(route => ({ route, serverRoute: route })),
  { route: '/pagina-que-no-existe', serverRoute: NOT_FOUND_ROUTE },
  { route: '/converter/noexiste', serverRoute: NOT_FOUND_ROUTE },
  // URL vieja en inglés: en producción Netlify la redirige con 301 antes de llegar acá
  { route: '/converter/merge-pdfs', serverRoute: NOT_FOUND_ROUTE },
];

describe('Hidratación SSR -> cliente por ruta', () => {
  for (const { route, serverRoute } of CASES) {
    it(`hidrata ${route} sin warnings de mismatch`, async () => {
      // 1. Render "servidor": la misma función que usa scripts/prerender.mjs.
      const serverHtml = renderToString(
        <StaticRouter location={serverRoute}>
          <AppRoutes />
        </StaticRouter>
      );

      // 2. Monta ese HTML crudo en el DOM, tal como lo entrega dist/<ruta>/index.html.
      container = document.createElement('div');
      container.innerHTML = serverHtml;
      document.body.appendChild(container);
      window.history.pushState({}, '', route);

      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const recoverableErrors: unknown[] = [];

      // 3. Hidrata con el árbol real del cliente (StrictMode + BrowserRouter, como main.tsx).
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

      // En las herramientas, espera a que el widget lazy() cargue y reemplace el
      // placeholder "Cargando herramienta…" que vino en el HTML pre-renderizado.
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
