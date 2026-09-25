import { useSyncExternalStore } from 'react';
import { getCookieConsent, subscribeCookieConsent, type CookieConsent } from './cookieConsent';

// 'pending' = todavía no leímos localStorage (render de servidor / hidratación).
// Mantener ese estado en SSR evita mismatches: el banner y GA solo arrancan en el cliente.
export function useCookieConsent(): CookieConsent | 'pending' {
  return useSyncExternalStore(subscribeCookieConsent, getCookieConsent, () => 'pending');
}
