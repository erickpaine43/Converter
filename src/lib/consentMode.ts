// Google Consent Mode v2. The default state (everything "denied", with
// wait_for_update) and the global gtag() function are defined by the inline
// script in index.html before any Google tag loads; this module only sends the
// updates decided by our own banner. When Google's CMP decides, it sends them
// itself.

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export const CONSENT_TYPES = ['ad_storage', 'ad_user_data', 'ad_personalization', 'analytics_storage'] as const;

export function updateConsentMode(granted: boolean): void {
  if (typeof window === 'undefined') return;
  const { gtag } = window as GtagWindow;
  // No gtag (tests, or the inline script didn't run) means there are no Google
  // tags to notify.
  if (typeof gtag !== 'function') return;
  const value = granted ? 'granted' : 'denied';
  gtag('consent', 'update', Object.fromEntries(CONSENT_TYPES.map(type => [type, value])));
}
