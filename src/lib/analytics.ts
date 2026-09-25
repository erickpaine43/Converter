import ReactGA from 'react-ga4';

// Único lugar donde vive el Measurement ID. Se puede sobreescribir por entorno
// (VITE_GA_MEASUREMENT_ID en .env / variables de Netlify) sin tocar código.
export const GA_MEASUREMENT_ID: string =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-R0SHPW5E39';

let initialized = false;

export function isGAInitialized(): boolean {
  return initialized;
}

// Solo debe llamarse con consentimiento de cookies (ver useAnalytics).
export function initGA(): void {
  if (initialized) return;
  ReactGA.initialize(GA_MEASUREMENT_ID, {
    // Los page_view los manda trackPageView en cada cambio de ruta; sin esto el
    // primero se contaría dos veces (uno automático del config + el nuestro).
    gtagOptions: { send_page_view: false },
  });
  initialized = true;
}

export function trackPageView(path: string): void {
  if (!initialized) return;
  ReactGA.send({ hitType: 'pageview', page: path });
}

// Solo para tests: vuelve al estado "nunca inicializado".
export function resetGAForTests(): void {
  initialized = false;
}
