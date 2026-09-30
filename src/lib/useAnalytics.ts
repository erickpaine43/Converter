import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from './analytics';
import { watchGoogleCmp } from './cookieConsent';
import { updateConsentMode } from './consentMode';
import { useConsentSource, useCookieConsent } from './useCookieConsent';

// Initializes GA only with consent and sends a page_view on every route change.
// Accepting the banner also records the current page.
export function useAnalytics(): void {
  const consent = useCookieConsent();
  const source = useConsentSource();
  const { pathname, search } = useLocation();

  // With AdSense configured, wait for Google's CMP (no-op otherwise).
  useEffect(() => { watchGoogleCmp(); }, []);

  // Own-banner answer stored on a previous visit: tell Consent Mode on load (the
  // inline script in index.html starts at "denied"). When Google's CMP decides,
  // it updates Consent Mode itself.
  useEffect(() => {
    if (source === 'banner' && consent === 'accepted') updateConsentMode(true);
  }, [source, consent]);

  useEffect(() => {
    if (consent !== 'accepted') return;
    initGA();
    trackPageView(pathname + search);
  }, [consent, pathname, search]);
}
