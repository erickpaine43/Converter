import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { COOKIE_ANSWERED_CLASS, setCookieConsent } from '../lib/cookieConsent';
import { useCookieConsent } from '../lib/useCookieConsent';

// Se pre-renderiza visible ('pending' en server e hidratación): así se pinta junto
// con el resto de la página en vez de aparecer recién tras hidratar (lo que lo
// volvía el elemento LCP en algunas páginas). A quien ya respondió se lo oculta el
// script inline de index.html antes del primer paint, y React lo desmonta al leer
// localStorage.
export default function CookieBanner() {
  const consent = useCookieConsent();

  // Sin respuesta guardada (p. ej. tras "Preferencias de cookies" en el footer):
  // saca la clase del script inline para que el banner vuelva a verse.
  useEffect(() => {
    if (consent === null) document.documentElement.classList.remove(COOKIE_ANSWERED_CLASS);
  }, [consent]);

  if (consent === 'accepted' || consent === 'rejected') return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Aviso de cookies">
      <p>
        Usamos cookies de análisis (Google Analytics) para entender de forma agregada cómo se usa
        el sitio. Solo se activan si las aceptas. <Link to="/privacy/">Más información</Link>.
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
