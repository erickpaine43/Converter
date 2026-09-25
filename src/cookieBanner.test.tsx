import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { StrictMode, act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import { waitFor } from '@testing-library/react';
import { AppRoutes } from './App';
import { COOKIE_ANSWERED_CLASS, COOKIE_CONSENT_KEY, clearCookieConsent } from './lib/cookieConsent';

// El banner se pre-renderiza siempre; un script inline de index.html lo oculta
// antes del primer paint si ya hay respuesta guardada.

let root: Root | null = null;
let container: HTMLDivElement | null = null;

afterEach(() => {
  root?.unmount();
  container?.remove();
  root = null;
  container = null;
  localStorage.clear();
  document.documentElement.classList.remove(COOKIE_ANSWERED_CLASS);
  window.history.pushState({}, '', '/');
});

const banner = () => container!.querySelector('.cookie-banner');

async function hydrateHome() {
  const serverHtml = renderToString(
    <StaticRouter location="/">
      <AppRoutes />
    </StaticRouter>
  );
  container = document.createElement('div');
  container.innerHTML = serverHtml;
  document.body.appendChild(container);

  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const recoverableErrors: string[] = [];
  await act(async () => {
    root = hydrateRoot(
      container!,
      <StrictMode>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StrictMode>,
      { onRecoverableError: (error) => { recoverableErrors.push(String(error)); } }
    );
  });
  const hydrationWarnings = consoleError.mock.calls.filter(args =>
    args.some(a => typeof a === 'string' && /hydrat/i.test(a))
  );
  consoleError.mockRestore();
  return { serverHtml, recoverableErrors, hydrationWarnings };
}

// Ejecuta el script inline real de index.html, como lo haría el navegador en <head>.
function runInlineHeadScript() {
  const html = readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  expect(script).toBeTruthy();
  new Function(script!)();
  return script!;
}

describe('Banner de cookies pre-renderizado', () => {
  it('el script inline de index.html usa la misma clave y clase que cookieConsent.ts', () => {
    const script = runInlineHeadScript();
    expect(script).toContain(`'${COOKIE_CONSENT_KEY}'`);
    expect(script).toContain(`'${COOKIE_ANSWERED_CLASS}'`);
  });

  it('el script inline marca <html> solo si hay respuesta guardada', () => {
    runInlineHeadScript();
    expect(document.documentElement.classList.contains(COOKIE_ANSWERED_CLASS)).toBe(false);

    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    runInlineHeadScript();
    expect(document.documentElement.classList.contains(COOKIE_ANSWERED_CLASS)).toBe(true);
  });

  it('usuario nuevo: el banner viene en el HTML del servidor y sigue tras hidratar', async () => {
    const { serverHtml, recoverableErrors, hydrationWarnings } = await hydrateHome();
    expect(serverHtml).toContain('cookie-banner');
    expect(recoverableErrors).toHaveLength(0);
    expect(hydrationWarnings).toHaveLength(0);
    expect(banner()).not.toBeNull();
  });

  it('con respuesta guardada: hidrata sin mismatch, desmonta el banner, y "Preferencias" lo vuelve a mostrar', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    runInlineHeadScript();

    const { recoverableErrors, hydrationWarnings } = await hydrateHome();
    expect(recoverableErrors).toHaveLength(0);
    expect(hydrationWarnings).toHaveLength(0);
    await waitFor(() => expect(banner()).toBeNull());
    expect(document.documentElement.classList.contains(COOKIE_ANSWERED_CLASS)).toBe(true);

    await act(async () => { clearCookieConsent(); });
    expect(banner()).not.toBeNull();
    expect(document.documentElement.classList.contains(COOKIE_ANSWERED_CLASS)).toBe(false);
  });
});
