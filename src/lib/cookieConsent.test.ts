import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  COOKIE_CONSENT_KEY, applyTcData, fallBackToBanner, getConsentSource, getCookieConsent,
  openCookiePreferences, resetConsentSourceForTests, setCookieConsent, watchGoogleCmp,
} from './cookieConsent';
import { CONSENT_TYPES } from './consentMode';

type TestWindow = Window & { gtag?: unknown; __tcfapi?: unknown; googlefc?: unknown };
const w = window as TestWindow;

afterEach(() => {
  localStorage.clear();
  delete w.gtag;
  delete w.__tcfapi;
  delete w.googlefc;
  resetConsentSourceForTests();
  vi.useRealTimers();
});

describe('Consent Mode v2 desde el banner propio', () => {
  it('aceptar envía "granted" y rechazar "denied" para los cuatro tipos', () => {
    const gtag = vi.fn();
    w.gtag = gtag;

    setCookieConsent('accepted');
    expect(gtag).toHaveBeenLastCalledWith('consent', 'update',
      Object.fromEntries(CONSENT_TYPES.map(t => [t, 'granted'])));

    setCookieConsent('rejected');
    expect(gtag).toHaveBeenLastCalledWith('consent', 'update',
      Object.fromEntries(CONSENT_TYPES.map(t => [t, 'denied'])));
  });
});

describe('Sin AdSense configurado', () => {
  it('decide siempre el banner propio', () => {
    expect(getConsentSource()).toBe('banner');
    watchGoogleCmp();
    expect(getConsentSource()).toBe('banner');
  });
});

describe('Con AdSense configurado (CMP de Google)', () => {
  it('mientras no se sabe la región no hay consentimiento ni banner, aunque haya respuesta guardada', () => {
    resetConsentSourceForTests('google-pending');
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    expect(getCookieConsent()).toBeNull();
  });

  it('visitante con GDPR: decide el CMP de Google según los propósitos TCF 1 y 8', () => {
    resetConsentSourceForTests('google-pending');
    applyTcData({ gdprApplies: true, eventStatus: 'cmpuishown' });
    expect(getConsentSource()).toBe('google');
    expect(getCookieConsent()).toBeNull();

    applyTcData({ gdprApplies: true, eventStatus: 'useractioncomplete', purpose: { consents: { 1: true, 8: true } } });
    expect(getCookieConsent()).toBe('accepted');

    applyTcData({ gdprApplies: true, eventStatus: 'useractioncomplete', purpose: { consents: { 1: true } } });
    expect(getCookieConsent()).toBe('rejected');
  });

  it('visitante sin GDPR: vuelve al banner propio y respeta la respuesta guardada', () => {
    resetConsentSourceForTests('google-pending');
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    applyTcData({ gdprApplies: false, eventStatus: 'tcloaded' });
    expect(getConsentSource()).toBe('banner');
    expect(getCookieConsent()).toBe('rejected');
  });

  it('si el CMP no aparece (bloqueador de anuncios), a los 5 s se usa el banner propio', () => {
    vi.useFakeTimers();
    resetConsentSourceForTests('google-pending');
    watchGoogleCmp();
    expect(getConsentSource()).toBe('google-pending');
    vi.advanceTimersByTime(5000);
    expect(getConsentSource()).toBe('banner');
  });

  it('se suscribe a __tcfapi cuando el CMP termina de cargar', () => {
    vi.useFakeTimers();
    resetConsentSourceForTests('google-pending');
    watchGoogleCmp();
    w.__tcfapi = vi.fn((_cmd: string, _v: number, cb: (d: unknown, ok: boolean) => void) =>
      cb({ gdprApplies: true, eventStatus: 'tcloaded', purpose: { consents: { 1: true, 8: true } } }, true));
    vi.advanceTimersByTime(250);
    expect(w.__tcfapi).toHaveBeenCalledWith('addEventListener', 2, expect.any(Function));
    expect(getConsentSource()).toBe('google');
    expect(getCookieConsent()).toBe('accepted');
  });

  it('"Preferencias de cookies" reabre el mensaje de Google para visitantes con GDPR', () => {
    const showRevocationMessage = vi.fn();
    w.googlefc = { showRevocationMessage };
    resetConsentSourceForTests('google-pending');
    applyTcData({ gdprApplies: true, eventStatus: 'tcloaded', purpose: { consents: { 1: true, 8: true } } });

    openCookiePreferences();
    expect(showRevocationMessage).toHaveBeenCalledTimes(1);
  });

  it('fallBackToBanner no pisa una decisión ya tomada por el CMP de Google', () => {
    resetConsentSourceForTests('google-pending');
    applyTcData({ gdprApplies: true, eventStatus: 'tcloaded', purpose: { consents: {} } });
    fallBackToBanner();
    expect(getConsentSource()).toBe('google');
  });
});
