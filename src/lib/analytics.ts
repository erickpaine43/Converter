import ReactGA from 'react-ga4';

// The only place the Measurement ID lives. Can be overridden per environment
// (VITE_GA_MEASUREMENT_ID in .env / Netlify env vars) without code changes.
export const GA_MEASUREMENT_ID: string =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-R0SHPW5E39';

let initialized = false;

export function isGAInitialized(): boolean {
  return initialized;
}

// Must only be called with cookie consent (see useAnalytics).
export function initGA(): void {
  if (initialized) return;
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    // page_views are sent by trackPageView on every route change; without this
    // the first one would be counted twice (the config's automatic one + ours).
    gtagOptions: { send_page_view: false },
  });
  initialized = true;
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  ReactGA.send({ hitType: 'pageview', page: path });
}

// Tests only: resets to the "never initialized" state.
export function resetGAForTests(): void {
  initialized = false;
}
