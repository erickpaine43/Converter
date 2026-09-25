/* eslint-disable react-refresh/only-export-components -- entrada SSR del build (scripts/prerender.mjs), nunca pasa por Fast Refresh */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';

// scripts/prerender.mjs toma la lista de rutas de acá (única fuente: lib/tools.ts).
export { PRERENDER_ROUTES } from './lib/tools';

// React 19 hoistea <title>/<meta>/<link> renderizados en cualquier punto del
// árbol al inicio del string de salida — por eso alcanza con renderToString
// plano, sin ningún provider de metadata server-side.
export function render(url: string): string {
  return renderToString(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>
  );
}
