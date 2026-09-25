// Estado del consentimiento de cookies de análisis, persistido en localStorage.
// Expuesto como un store externo (subscribe/getSnapshot) para useSyncExternalStore.

export type CookieConsent = 'accepted' | 'rejected' | null;

export const COOKIE_CONSENT_KEY = 'cookie-consent';

// Clase que el script inline de index.html pone en <html> antes del primer paint
// si ya hay respuesta guardada: oculta el banner pre-renderizado (sin flash) hasta
// que React toma el control. Ese script repite a mano esta clave y esta clase
// (lo controla cookieBanner.test.tsx).
export const COOKIE_ANSWERED_CLASS = 'cookie-consent-answered';

const listeners = new Set<() => void>();

export function getCookieConsent(): CookieConsent {
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    // localStorage bloqueado (modo privado estricto, etc.): tratar como "sin respuesta".
    return null;
  }
}

export function setCookieConsent(value: 'accepted' | 'rejected'): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    // Sin persistencia: el banner volverá a aparecer en la próxima visita.
  }
  listeners.forEach(listener => listener());
}

// Borra la respuesta guardada: el banner vuelve a mostrarse y GA deja de trackear
// (useAnalytics solo envía page_views con consentimiento 'accepted').
export function clearCookieConsent(): void {
  try {
    window.localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch {
    // localStorage bloqueado: igual avisamos para que el banner reaparezca.
  }
  listeners.forEach(listener => listener());
}

export function subscribeCookieConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
