import { Link } from 'react-router-dom';
import { setCookieConsent } from '../lib/cookieConsent';
import { useCookieConsent } from '../lib/useCookieConsent';

export default function CookieBanner() {
  const consent = useCookieConsent();
  if (consent !== null) return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Aviso de cookies">
      <p>
        Usamos cookies de análisis (Google Analytics) para entender de forma agregada cómo se usa
        el sitio. Solo se activan si las aceptas. <Link to="/privacy">Más información</Link>.
      </p>
      <div className="cookie-banner-actions">
        <button type="button" className="btn btn-secondary" onClick={() => setCookieConsent('rejected')}>
          Rechazar
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setCookieConsent('accepted')}>
          Aceptar
        </button>
      </div>
    </div>
  );
}
