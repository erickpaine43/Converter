import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { MemoryRouter, StaticRouter } from 'react-router-dom';
import Header from './Header';
import { TOOL_IDS, pagePath, toolPath } from '../lib/tools';

describe('Header: navegación principal', () => {
  it('el HTML pre-renderizado ya trae los links a todas las herramientas y páginas', () => {
    const html = renderToString(
      <StaticRouter location="/">
        <Header />
      </StaticRouter>
    );
    const hrefs = [...html.matchAll(/<a [^>]*href="([^"]*)"/g)].map(m => m[1]);
    const expected = [
      ...TOOL_IDS.map(toolPath),
      ...(['guides', 'about', 'contact', 'privacy', 'terms'] as const).map(pagePath),
    ];
    expect(hrefs).toEqual(expect.arrayContaining(expected));
  });

  it('el submenú de herramientas se abre, se cierra con Escape y al elegir un link', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const toggle = screen.getByRole('button', { name: /herramientas/i });
    const submenu = document.getElementById('site-nav-tools')!;
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(submenu).not.toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(submenu).toBeVisible();

    await user.keyboard('{Escape}');
    expect(submenu).not.toBeVisible();

    await user.click(toggle);
    await user.click(screen.getByRole('link', { name: 'Unir PDFs' }));
    expect(submenu).not.toBeVisible();
  });

  it('el botón "Menú" despliega la navegación en pantallas angostas', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const menu = screen.getByRole('button', { name: 'Menú' });
    await user.click(menu);
    expect(screen.getByRole('navigation', { name: 'Principal' })).toHaveClass('site-nav--open');
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('aria-expanded', 'true');
  });
});
