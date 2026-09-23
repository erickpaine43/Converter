import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { AppRoutes } from './App';

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
