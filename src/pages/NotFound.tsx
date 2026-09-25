import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';

// Se renderiza para cualquier ruta desconocida (catch-all en AppRoutes y
// herramientas inexistentes en ConverterPage). El marcado NO depende de la URL:
// es el mismo que se pre-renderiza en dist/404.html, que Netlify sirve con
// status 404 para cualquier ruta sin archivo propio.
export default function NotFound() {
  return (
    <main className="home">
      <SeoHead
        title="Página no encontrada"
        description="La página que buscás no existe o cambió de dirección. Volvé al inicio para ver todas las herramientas PDF."
        noindex
      />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Página no encontrada</h1>
        <p>La página que buscás no existe o cambió de dirección.</p>
        <p><Link to="/">Volver al inicio y ver todas las herramientas</Link></p>
      </div>
    </main>
  );
}
