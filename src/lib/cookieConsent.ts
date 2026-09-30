// Analytics and advertising cookie consent, exposed as an external store
// (subscribe/getSnapshot) for useSyncExternalStore.
//
// The user's answer can come from two sources:
//  - Our own banner (CookieBanner), which stores the answer in localStorage.
//  - Google's CMP (AdSense "Privacy & messaging", TCF-certified), required to
//    serve ads in the EEA, UK and Switzerland. Only used when an AdSense client
//    ID is configured (VITE_ADSENSE_CLIENT) and only for visitors covered by
//    GDPR (tcData.gdprApplies): Google's CMP shows nothing to everyone else, so
//    they keep getting our own banner.
//
// Either way Google is notified through Consent Mode v2 (see consentMode.ts);
// the "denied" default is set by an inline script in index.html.

import { updateConsentMode } from './consentMode';

export type CookieConsent = 'accepted' | 'rejected' | null;

export const COOKIE_CONSENT_KEY = 'cookie-consent';

// Class the inline script in index.html adds to <html> before first paint when
// an answer is already stored: it hides the pre-rendered banner (no flash) until
// React takes over. That script duplicates this key and class by hand
// (checked by cookieBanner.test.tsx).
export const COOKIE_ANSWERED_CLASS = 'cookie-consent-answered';

/** AdSense client ID (ca-pub-…). Empty = no AdSense: own banner only. */
export const ADSENSE_CLIENT: string = import.meta.env.VITE_ADSENSE_CLIENT ?? '';

/**
 * - 'banner': our own banner decides.
 * - 'google-pending': Google's CMP is configured and we don't know yet whether
 *   it applies to this visitor (no banner is shown).
 * - 'google': the visitor is in a GDPR region; Google's CMP decides.
 */
export type ConsentSource = 'banner' | 'google-pending' | 'google';

let source: ConsentSource = ADSENSE_CLIENT ? 'google-pending' : 'banner';
let googleConsent: CookieConsent = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach(listener => listener());

export function getConsentSource(): ConsentSource {
  return source;
}

/** Source used for pre-rendering (the server doesn't know where the visitor is). */
export function getServerConsentSource(): ConsentSource {
  return ADSENSE_CLIENT ? 'google-pending' : 'banner';
}

function getStoredConsent(): CookieConsent {
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    // localStorage blocked (strict private mode, etc.): treat as "no answer".
    return null;
  }
}

export function getCookieConsent(): CookieConsent {
  if (source === 'google') return googleConsent;
  if (source === 'google-pending') return null;
  return getStoredConsent();
}

export function setCookieConsent(value: 'accepted' | 'rejected'): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Not persisted: the banner will show up again on the next visit.
  }
  updateConsentMode(value === 'accepted');
  notify();
}

// Clears the stored answer: the banner shows up again and GA stops tracking
// (useAnalytics only sends page_views with 'accepted' consent).
export function clearCookieConsent(): void {
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {
    // localStorage blocked: notify anyway so the banner shows up again.
  }
  updateConsentMode(false);
  notify();
}

/** Footer "Preferencias de cookies" link: reopens whichever CMP applies. */
export function openCookiePreferences(): void {
  const googlefc = (window as GoogleFcWindow).googlefc;
  if (source === 'google' && typeof googlefc?.showRevocationMessage === 'function') {
    googlefc.showRevocationMessage();
    return;
  }
  clearCookieConsent();
}

export function subscribeCookieConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Google's CMP (IAB TCF v2.2)

interface TcData {
  gdprApplies?: boolean;
  eventStatus?: 'tcloaded' | 'cmpuishown' | 'useractioncomplete';
  purpose?: { consents?: Record<string, boolean> };
}

type TcfApi = (command: string, version: number, callback: (tcData: TcData, success: boolean) => void) => void;

interface GoogleFcWindow extends Window {
  __tcfapi?: TcfApi;
  googlefc?: { showRevocationMessage?: () => void };
}

// TCF purposes that enable Google Analytics: 1 (store and/or access information
// on a device) and 8 (measure content performance). With Consent Mode enabled
// in AdSense, Google's CMP also updates analytics_storage/ad_storage itself;
// this only decides whether GA gets loaded.
const ANALYTICS_PURPOSES = ['1', '8'];

/** Maps Google's CMP response to our state. Exported for tests. */
export function applyTcData(tcData: TcData): void {
  if (tcData.gdprApplies === false) {
    source = 'banner';
    notify();
    return;
  }
  if (tcData.gdprApplies !== true) return;

  source = 'google';
  if (tcData.eventStatus === 'tcloaded' || tcData.eventStatus === 'useractioncomplete') {
    const consents = tcData.purpose?.consents ?? {};
    googleConsent = ANALYTICS_PURPOSES.every(p => consents[p]) ? 'accepted' : 'rejected';
  }
  notify();
}

/** If the CMP never shows up (ad blocker, network error), fall back to our own banner. */
export function fallBackToBanner(): void {
  if (source !== 'google-pending') return;
  source = 'banner';
  notify();
}

const CMP_POLL_MS = 250;
const CMP_TIMEOUT_MS = 5000;
let watching = false;

/**
 * Waits for the AdSense script to load Google's CMP (__tcfapi) and subscribes
 * to its events. Called once, on the client, after hydration.
 */
export function watchGoogleCmp(): void {
  if (watching || source !== 'google-pending') return;
  watching = true;
  const start = Date.now();

  const poll = () => {
    const tcfapi = (window as GoogleFcWindow).__tcfapi;
    if (typeof tcfapi === 'function') {
      tcfapi('addEventListener', 2, (tcData, success) => {
        if (success) applyTcData(tcData);
        else fallBackToBanner();
      });
      return;
    }
    if (Date.now() - start >= CMP_TIMEOUT_MS) {
      fallBackToBanner();
      return;
    }
    window.setTimeout(poll, CMP_POLL_MS);
  };
  poll();
}

/** Tests only. */
export function resetConsentSourceForTests(value: ConsentSource = ADSENSE_CLIENT ? 'google-pending' : 'banner'): void {
  source = value;
  googleConsent = null;
  watching = false;
}
