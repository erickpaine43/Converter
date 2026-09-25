import { useSyncExternalStore } from 'react';
import { getCookieConsent, subscribeCookieConsent, type CookieConsent } from './cookieConsent';

// 'pending' = todavía no leímos localStorage (render de servidor / hidratación).
// Mantener ese estado en SSR evita mismatches: GA solo arranca en el cliente, y el
// banner se pre-renderiza siempre (el script inline de index.html lo oculta si ya
// hay respuesta guardada).
export function useCookieConsent(): CookieConsent | 'pending' {
  return useSyncExternalStore(subscribeCookieConsent, getCookieConsent, () => 'pending');
}
