import { useSyncExternalStore } from 'react';
import {
  getConsentSource, getCookieConsent, getServerConsentSource, subscribeCookieConsent,
  type ConsentSource, type CookieConsent,
} from './cookieConsent';

// 'pending' = localStorage hasn't been read yet (server render / hydration).
// Keeping that state during SSR avoids mismatches: GA only starts on the client,
// and the banner is always pre-rendered (the inline script in index.html hides
// it if an answer is already stored).
export function useCookieConsent(): CookieConsent | 'pending' {
  return useSyncExternalStore(subscribeCookieConsent, getCookieConsent, () => 'pending');
}

/** Who decides consent for this visitor (our own banner or Google's CMP). */
export function useConsentSource(): ConsentSource {
  return useSyncExternalStore(subscribeCookieConsent, getConsentSource, getServerConsentSource);
}
