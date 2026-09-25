import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from './analytics';
import { useCookieConsent } from './useCookieConsent';

// Inicializa GA solo con consentimiento y registra un page_view por cada cambio
// de ruta. Al aceptar el banner también se registra la página actual.
export function useAnalytics(): void {
  const consent = useCookieConsent();
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (consent !== 'accepted') return;
    initGA();
    trackPageView(pathname + search);
  }, [consent, pathname, search]);
}
