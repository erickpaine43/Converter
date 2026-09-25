import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link } from 'react-router-dom';
import { AppRoutes } from '../App';
import { COOKIE_CONSENT_KEY } from './cookieConsent';
import { GA_MEASUREMENT_ID, initGA, resetGAForTests, trackPageView } from './analytics';

const { initializeMock, sendMock } = vi.hoisted(() => ({
  initializeMock: vi.fn(),
  sendMock: vi.fn(),
}));
vi.mock('react-ga4', () => ({
  default: { initialize: initializeMock, send: sendMock },
}));

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <Link to="/about">ir-a-about</Link>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  resetGAForTests();
  initializeMock.mockClear();
  sendMock.mockClear();
});

afterEach(() => {
  localStorage.clear();
});

describe('analytics lib', () => {
  it('trackPageView no hace nada si GA no fue inicializado', () => {
    trackPageView('/about');
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('initGA inicializa una sola vez con el Measurement ID centralizado', () => {
    initGA();
    initGA();
    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(initializeMock).toHaveBeenCalledWith(GA_MEASUREMENT_ID, expect.anything());
  });
});

describe('GA + consentimiento de cookies', () => {
  it('no inicializa ni trackea si el usuario todavía no respondió el banner', async () => {
    renderApp('/');
    expect(screen.getByRole('region', { name: /cookies/i })).toBeInTheDocument();

    await userEvent.click(screen.getByText('ir-a-about'));

    expect(initializeMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('no inicializa ni trackea si el usuario rechaza', async () => {
    renderApp('/');
    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    await userEvent.click(screen.getByText('ir-a-about'));

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('rejected');
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument();
    expect(initializeMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('no inicializa si el rechazo viene de una visita anterior', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    renderApp('/');

    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument();
    expect(initializeMock).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('al aceptar inicializa GA y trackea la página actual y los cambios de ruta', async () => {
    renderApp('/');
    await userEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenLastCalledWith({ hitType: 'pageview', page: '/' });

    await userEvent.click(screen.getByText('ir-a-about'));
    expect(sendMock).toHaveBeenLastCalledWith({ hitType: 'pageview', page: '/about' });
    expect(initializeMock).toHaveBeenCalledTimes(1);
  });

  it('inicializa directo si ya había aceptado en una visita anterior', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    renderApp('/privacy');

    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument();
    expect(initializeMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({ hitType: 'pageview', page: '/privacy' });
  });

  it('"Preferencias de cookies" borra el consentimiento y vuelve a mostrar el banner sin recargar', async () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    renderApp('/');
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument();
    sendMock.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'Preferencias de cookies' }));

    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBeNull();
    expect(screen.getByRole('region', { name: /cookies/i })).toBeInTheDocument();

    // sin respuesta nueva, los cambios de ruta ya no se trackean
    await userEvent.click(screen.getByText('ir-a-about'));
    expect(sendMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('rejected');
    expect(screen.queryByRole('region', { name: /cookies/i })).not.toBeInTheDocument();
  });
});
