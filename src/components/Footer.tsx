import { Link } from 'react-router-dom';
import { openCookiePreferences } from '../lib/cookieConsent';
import { TOOL_IDS, TOOL_LABELS, pagePath, toolPath } from '../lib/tools';

export default function Footer() {
  return (
    <footer className="footer">
      <nav className="footer-links footer-tools" aria-label="Herramientas">
        {TOOL_IDS.map(id => (
          <Link key={id} to={toolPath(id)}>{TOOL_LABELS[id]}</Link>
        ))}
      </nav>
      <div className="footer-links">
        <Link to={pagePath('guides')}>Guías</Link>
        <Link to={pagePath('about')}>Sobre nosotros</Link>
        <Link to={pagePath('contact')}>Contacto</Link>
        <Link to={pagePath('privacy')}>Política de privacidad</Link>
        <Link to={pagePath('terms')}>Términos y condiciones</Link>
        <button type="button" className="footer-link-button" onClick={openCookiePreferences}>
          Preferencias de cookies
        </button>
      </div>
      {/* The year comes from the pre-render (build date): if the client hydrates in
          a later year the text differs, and suppressHydrationWarning avoids the
          mismatch by keeping the HTML's value until the next deploy. */}
      <p className="footer-copy" suppressHydrationWarning>© {new Date().getFullYear()} PDF Converter. Todos los derechos reservados.</p>
    </footer>
  );
}
