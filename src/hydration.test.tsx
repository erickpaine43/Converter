import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { StaticRouter } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './App';

// Regresión para el pre-rendering: hidrata contra el HTML que realmente
// produce entry-server.tsx (mismo AppRoutes, mismo StaticRouter) y falla si
// React reporta cualquier mismatch de hidratación (texto distinto, atributos
// distintos, o un boundary de Suspense que no calza entre server y cliente).
const ROUTES = [
  '/',
  '/converter/images-to-pdf',
  '/converter/html-to-pdf',
  '/converter/pdf-to-images',
  '/converter/merge-pdfs',
  '/converter/pdf-to-text',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  root?.unmount();
  container?.remove();
  root = null;
  container = null;
  window.history.pushState({}, '', '/');
});

describe('Hidratación SSR -> cliente por ruta', () => {
  for (const route of ROUTES) {
    it(`hidrata ${route} sin warnings de mismatch`, async () => {
      // 1. Render "servidor": la misma función que usa scripts/prerender.mjs.
      const serverHtml = renderToString(
        <StaticRouter location={route}>
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

      // 3. Hidrata con el árbol real del cliente (BrowserRouter, como main.tsx).
      root = hydrateRoot(
        container,
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>,
        {
          onRecoverableError: (error) => { recoverableErrors.push(error); },
        }
      );

      // deja correr microtasks (lazy() dispara el import dinámico tras hidratar)
      await new Promise(resolve => setTimeout(resolve, 0));

      const hydrationWarnings = consoleError.mock.calls.filter(args =>
        args.some(a => typeof a === 'string' && /hydrat/i.test(a))
      );

      expect(recoverableErrors, JSON.stringify(recoverableErrors)).toHaveLength(0);
      expect(hydrationWarnings, JSON.stringify(hydrationWarnings)).toHaveLength(0);

      consoleError.mockRestore();
    });
  }
});
