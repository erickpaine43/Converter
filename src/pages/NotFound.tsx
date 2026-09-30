import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';

// Rendered for any unknown route (the AppRoutes catch-all). The markup does NOT
// depend on the URL: it's the same one pre-rendered into dist/404.html, which
// Netlify serves with a 404 status for any path without its own file.
export default function NotFound() {
  return (
    <main className="home">
      <SeoHead
        title="Página no encontrada"
        description="La página que buscas no existe o cambió de dirección. Vuelve al inicio para ver todas las herramientas PDF."
        noindex
      />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Página no encontrada</h1>
        <p>La página que buscas no existe o cambió de dirección.</p>
        <p><Link to="/">Volver al inicio y ver todas las herramientas</Link></p>
      </div>
    </main>
  );
}
