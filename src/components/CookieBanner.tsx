import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { COOKIE_ANSWERED_CLASS, setCookieConsent } from '../lib/cookieConsent';
import { pagePath } from '../lib/tools';
import { useConsentSource, useCookieConsent } from '../lib/useCookieConsent';

// Pre-rendered visible ('pending' on the server and during hydration) so it's
// painted along with the rest of the page instead of appearing after hydration
// (which made it the LCP element on some pages). For visitors who already
// answered, the inline script in index.html hides it before first paint, and
// React unmounts it once it reads localStorage.
//
// With AdSense configured (VITE_ADSENSE_CLIENT) it isn't pre-rendered: we first
// wait to find out whether Google's CMP applies to the visitor (EEA, UK and
// Switzerland), and only if not does this banner show up (see lib/cookieConsent.ts).
export default function CookieBanner() {
  const consent = useCookieConsent();
  const source = useConsentSource();

  // No stored answer (e.g. after "Preferencias de cookies" in the footer):
  // remove the inline script's class so the banner is visible again.
  useEffect(() => {
    if (source === 'banner' && consent === null) document.documentElement.classList.remove(COOKIE_ANSWERED_CLASS);
  }, [source, consent]);

  if (source !== 'banner') return null;
  if (consent === 'accepted' || consent === 'rejected') return null;

  return (
    <div className="cookie-banner" role="region" aria-label="Aviso de cookies">
      <p>
        Usamos cookies de análisis (Google Analytics) para entender de forma agregada cómo se usa
        el sitio y, cuando se muestran anuncios, cookies de publicidad de Google. Solo se activan
        si las aceptas. <Link to={pagePath('privacy')}>Más información</Link>.
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
