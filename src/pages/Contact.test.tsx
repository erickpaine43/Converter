import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import Contact from './Contact';

async function fillAndSubmit() {
  const user = userEvent.setup();
  render(<Contact />);
  await user.type(screen.getByLabelText('Nombre'), 'Ana');
  await user.type(screen.getByLabelText('Email'), 'ana@example.com');
  await user.type(screen.getByLabelText('Mensaje'), 'Hola, encontré un problema.');
  await user.click(screen.getByRole('button', { name: 'Enviar mensaje' }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Contact — envío real a Netlify Forms', () => {
  it('envía form-name y campos url-encoded a la ruta estática del form, y solo muestra éxito si la respuesta es ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await fillAndSubmit();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/__forms.html');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    const body = new URLSearchParams(init.body);
    expect(body.get('form-name')).toBe('contact');
    expect(body.get('name')).toBe('Ana');
    expect(body.get('email')).toBe('ana@example.com');
    expect(body.get('message')).toBe('Hola, encontré un problema.');
    expect(body.get('bot-field')).toBe('');

    expect(await screen.findByRole('status')).toHaveTextContent('Mensaje enviado');
  });

  it('respuesta no-ok: muestra error, NO muestra éxito y conserva lo escrito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos enviar tu mensaje');
    expect(screen.queryByText(/Mensaje enviado/)).toBeNull();
    expect(screen.getByLabelText('Mensaje')).toHaveValue('Hola, encontré un problema.');
    expect(screen.getByRole('link', { name: 'e3522e@gmail.com' }).getAttribute('href')).toMatch(/^mailto:/);
  });

  it('error de red: muestra error y no éxito', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText(/Mensaje enviado/)).toBeNull();
  });

  it('public/__forms.html declara exactamente los mismos campos que envía el formulario', () => {
    const staticHtml = readFileSync(path.resolve(__dirname, '../../public/__forms.html'), 'utf-8');
    const doc = new DOMParser().parseFromString(staticHtml, 'text/html');
    const staticForm = doc.querySelector('form[name="contact"]')!;
    expect(staticForm).not.toBeNull();
    expect(staticForm.getAttribute('data-netlify')).toBe('true');
    expect(staticForm.getAttribute('netlify-honeypot')).toBe('bot-field');

    render(<Contact />);
    const reactForm = document.querySelector('form[name="contact"]')!;
    const names = (form: Element) =>
      [...form.querySelectorAll('input, textarea')].map(el => el.getAttribute('name')).sort();
    expect(names(reactForm)).toEqual(names(staticForm));
  });
});
