import { Link } from 'react-router-dom';
import { clearCookieConsent } from '../lib/cookieConsent';
import { TOOL_IDS, TOOL_LABELS, toolPath } from '../lib/tools';

export default function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-links footer-tools" aria-label="Herramientas">
        {TOOL_IDS.map(id => (
          <Link key={id} to={toolPath(id)}>{TOOL_LABELS[id]}</Link>
        ))}
      </nav>
      <div className="footer-links">
        <Link to="/about/">Sobre Nosotros</Link>
        <Link to="/contact/">Contacto</Link>
        <Link to="/privacy/">Política de Privacidad</Link>
        <Link to="/terms/">Términos y Condiciones</Link>
        <button type="button" className="footer-link-button" onClick={clearCookieConsent}>
          Preferencias de cookies
        </button>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} PDF Converter. Todos los derechos reservados.</p>
    </footer>
  );
}
