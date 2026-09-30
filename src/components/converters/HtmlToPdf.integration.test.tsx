import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Same as converters/htmlToPdf.test.ts: html2canvas/jsPDF are third-party, so
// they're mocked to test our own orchestration (sanitization, length limit,
// loading/error states) without depending on their actual rendering.
const addImageMock = vi.fn();
const addPageMock = vi.fn();
const saveMock = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function (this: unknown) {
    return { addImage: addImageMock, addPage: addPageMock, save: saveMock };
  }),
}));

let mockCanvasSize = { width: 800, height: 600 };

const html2canvasMock = vi.fn(async () => {
  // A real canvas (not a plain object): convertHtmlToPdf slices it into strips
  // with drawImage() to paginate, and vitest-canvas-mock needs an actual
  // HTMLCanvasElement to simulate that drawImage.
  const canvas = document.createElement('canvas');
  canvas.width = mockCanvasSize.width;
  canvas.height = mockCanvasSize.height;
  return canvas;
});

vi.mock('html2canvas', () => ({ default: () => html2canvasMock() }));

import HtmlToPdf from './HtmlToPdf';
import { MAX_HTML_LENGTH } from '../../lib/fileLimits';
import { toFile } from '../../test/fixtures';

// "Subir archivo" (upload) is the default mode; these tests exercise the "Pegar
// código" (paste) mode, so they switch tabs first. Upload mode is covered by the
// upload tests further down in this file.
async function switchToPasteMode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: /pegar código/i }));
}

describe('Bloque 3: HtmlToPdf — flujo de usuario (modo "Pegar código")', () => {
  beforeEach(() => {
    addImageMock.mockClear();
    addPageMock.mockClear();
    saveMock.mockClear();
    html2canvasMock.mockClear();
    mockCanvasSize = { width: 800, height: 600 };
  });

  it('flujo feliz: pegar HTML, convertir, sin quedar colgado en "Convirtiendo..."', async () => {
    const user = userEvent.setup();
    render(<HtmlToPdf />);
    await switchToPasteMode(user);

    await user.type(screen.getByPlaceholderText(/pegá tu html|pega tu html/i), '<p>Factura #1</p>');
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
    expect(html2canvasMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith('converted.pdf');
  });

  it('sanitiza <script> y onerror/onload reales: no quedan en la vista previa del DOM', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);
    await switchToPasteMode(user);

    const malicious = '<p>Factura</p><script>window.__xss=true;</script><img src="x" onerror="window.__xss=true">';
    const textarea = screen.getByPlaceholderText(/pegá tu html|pega tu html/i);
    // type it all at once (fireEvent.paste would be more faithful, but .type with raw HTML is
    // enough to check that what ends up in the real DOM went through DOMPurify)
    await user.click(textarea);
    await user.paste(malicious);

    const preview = container.querySelector('.html-preview')!;
    expect(preview.querySelectorAll('script').length).toBe(0);
    const withOnError = Array.from(preview.querySelectorAll('*')).some(el => el.hasAttribute('onerror'));
    expect(withOnError).toBe(false);
    expect(preview.textContent).toContain('Factura');
  });

  it(`HTML que supera MAX_HTML_LENGTH (${MAX_HTML_LENGTH} chars): se bloquea ANTES de procesar, con mensaje claro`, async () => {
    const user = userEvent.setup();
    render(<HtmlToPdf />);
    await switchToPasteMode(user);

    const tooLong = '<p>' + 'x'.repeat(MAX_HTML_LENGTH + 1) + '</p>';
    const textarea = screen.getByPlaceholderText(/pegá tu html|pega tu html/i);
    await user.click(textarea);
    await user.paste(tooLong);

    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByText(/supera el límite/i)).toBeInTheDocument();
    // it must not have tried to render/capture anything
    expect(html2canvasMock).not.toHaveBeenCalled();
  });

  it('error durante la conversión: mensaje visible en el UI, botón no queda colgado', async () => {
    html2canvasMock.mockRejectedValueOnce(new Error('boom interno de html2canvas'));
    const user = userEvent.setup();
    render(<HtmlToPdf />);
    await switchToPasteMode(user);

    await user.type(screen.getByPlaceholderText(/pegá tu html|pega tu html/i), '<p>hola</p>');
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByText('.', { exact: false, selector: '.msg-error' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
  });

  it('cambiar de modo no deja mezclado el contenido: pegar código, volver a "Subir archivo", y el textarea/preview quedan limpios', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);
    await switchToPasteMode(user);

    await user.type(screen.getByPlaceholderText(/pegá tu html|pega tu html/i), '<p>Contenido pegado</p>');
    expect(container.querySelector('.html-preview')?.textContent).toContain('Contenido pegado');

    await user.click(screen.getByRole('tab', { name: /subir archivo/i }));

    // upload mode must show neither the textarea nor a preview of the pasted content
    expect(container.querySelector('.html-preview')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/pegá tu html|pega tu html/i)).not.toBeInTheDocument();

    await switchToPasteMode(user);
    // and switching back to paste mode starts with an empty textarea, not the previous content
    expect(screen.getByPlaceholderText(/pegá tu html|pega tu html/i)).toHaveValue('');
  });
});

async function waitForConvertEnabled() {
  await waitFor(() => expect(screen.getByRole('button', { name: /convertir a pdf/i })).not.toBeDisabled());
}

describe('Bloque 3: HtmlToPdf — flujo de usuario (modo "Subir archivo", default)', () => {
  it('arranca en modo "Subir archivo" por defecto', () => {
    render(<HtmlToPdf />);
    expect(screen.getByRole('tab', { name: /subir archivo/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /pegar código/i })).toHaveAttribute('aria-selected', 'false');
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('sube un .html válido: el contenido llega sanitizado a la vista previa y se puede convertir', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const html = '<p>Factura #42</p><script>window.__xss=true;</script>';
    const file = toFile(html, 'factura.html', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText('factura.html')).toBeInTheDocument();
    const preview = await waitFor(() => container.querySelector('.html-preview')!);
    expect(preview.querySelectorAll('script').length).toBe(0);
    expect(preview.textContent).toContain('Factura #42');

    await waitForConvertEnabled();
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));
    expect(await screen.findByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
    expect(saveMock).toHaveBeenCalledWith('converted.pdf');
  });

  it('.html guardado en windows-1252 (con <meta charset>): los acentos llegan bien a la vista previa, sin "�"', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const html = '<html><head><meta http-equiv="Content-Type" content="text/html; charset=windows-1252"></head>'
      + '<body><p>Estas páginas no admiten alteración: ñandú, pingüino.</p></body></html>';
    // actual windows-1252 bytes (1 byte per accented char), not UTF-8
    const file = toFile(new Uint8Array(Buffer.from(html, 'latin1')), 'word.htm', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText('word.htm')).toBeInTheDocument();
    const preview = container.querySelector('.html-preview')!;
    expect(preview.textContent).toContain('Estas páginas no admiten alteración: ñandú, pingüino.');
    expect(preview.textContent).not.toContain('�');
  });

  it('rechaza la selección si no hay ningún .html/.htm (extensión inválida) sin llegar a leerlo', async () => {
    // applyAccept: false because we want to exercise OUR extension check (the
    // point of this case: a user can reach this input with a wrongly named file
    // even though the input's accept attribute filters the native dialog, e.g.
    // via drag & drop, which ignores `accept`).
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<HtmlToPdf />);

    const file = toFile('<p>no importa</p>', 'reporte.pdf', 'application/pdf');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText(/tienes que incluir un archivo \.html o \.htm/i)).toBeInTheDocument();
    expect(screen.queryByText('reporte.pdf')).not.toBeInTheDocument();
    expect(container.querySelector('.html-preview')).not.toBeInTheDocument();
  });

  it('rechaza la selección si hay más de un .html/.htm', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const fileA = toFile('<p>a</p>', 'a.html', 'text/html');
    const fileB = toFile('<p>b</p>', 'b.htm', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [fileA, fileB]);

    expect(await screen.findByText(/solo se puede subir un archivo \.html o \.htm/i)).toBeInTheDocument();
    expect(container.querySelector('.html-preview')).not.toBeInTheDocument();
  });

  it('archivo .html vacío: muestra error y no habilita convertir', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const file = toFile('   ', 'vacio.html', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText(/el archivo está vacío/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /convertir a pdf/i })).toBeDisabled();
  });

  it('permite quitar el archivo cargado y vuelve al estado vacío', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const file = toFile('<p>Factura</p>', 'factura.html', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    expect(await screen.findByText('factura.html')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /quitar archivo/i }));

    expect(screen.queryByText('factura.html')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /convertir a pdf/i })).toBeDisabled();
  });

  it('subir un .html junto con una imagen suelta muestra el conteo de adjuntos', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    const htmlFile = toFile('<p>Con foto</p><img src="foto.jpg">', 'doc.html', 'text/html');
    const imgFile = toFile('contenido-fake', 'foto.jpg', 'image/jpeg');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [htmlFile, imgFile]);

    expect(await screen.findByText(/doc\.html \+ 1 imagen adjunta/i)).toBeInTheDocument();
  });
});

describe('Bloque 3: HtmlToPdf — resolución de imágenes del HTML', () => {
  // jsdom doesn't actually load resources (setting img.src never fires load/error
  // for a real http URL), so window.Image is replaced with a controllable version
  // to test the preloader's success/failure paths without network or real timeouts.
  class ImmediateImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    static fail = false;
    set src(_value: string) {
      queueMicrotask(() => { if (ImmediateImage.fail) this.onerror?.(); else this.onload?.(); });
    }
  }
  const OriginalImage = globalThis.Image;

  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  async function uploadHtml(container: HTMLElement, user: ReturnType<typeof userEvent.setup>, html: string, extraFiles: File[] = []) {
    const htmlFile = toFile(html, 'doc.html', 'text/html');
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, [htmlFile, ...extraFiles]);
  }

  it('imagen resuelta vía archivo adjunto: se muestra normal (sin placeholder ni aviso)', async () => {
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);
    const imgFile = toFile('fake-bytes', 'foto.jpg', 'image/jpeg');

    await uploadHtml(container, user, '<p>Texto</p><img src="images/foto.jpg">', [imgFile]);

    await waitFor(() => {
      const img = container.querySelector('.html-preview img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toMatch(/^blob:/);
    });
    expect(container.querySelector('.html-image-missing')).not.toBeInTheDocument();
    expect(screen.queryByText(/no se pudieron cargar/i)).not.toBeInTheDocument();
  });

  it('imagen con src absoluto (http) que falla: recuadro + URL visible en la vista previa, y aparece el aviso', async () => {
    ImmediateImage.fail = true;
    globalThis.Image = ImmediateImage as unknown as typeof Image;
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    await uploadHtml(container, user, '<p>Texto</p><img src="https://ejemplo.com/rota.png">');

    await waitFor(() => expect(container.querySelector('.html-image-missing')).not.toBeNull());
    expect(container.querySelector('.html-preview img')).not.toBeInTheDocument();
    expect(container.querySelector('.html-image-missing-url')?.textContent).toBe('https://ejemplo.com/rota.png');
    expect(await screen.findByText(/1 imagen\(es\) no se pudieron cargar/i)).toBeInTheDocument();
  });

  it('imagen con src relativo sin resolver: recuadro SIN URL visible', async () => {
    ImmediateImage.fail = true;
    globalThis.Image = ImmediateImage as unknown as typeof Image;
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    await uploadHtml(container, user, '<p>Texto</p><img src="assets/rota.png">');

    await waitFor(() => expect(container.querySelector('.html-image-missing')).not.toBeNull());
    expect(container.querySelector('.html-image-missing-url')).not.toBeInTheDocument();
  });

  it('sin imágenes rotas, no aparece el aviso de "no disponibles"', async () => {
    ImmediateImage.fail = false;
    globalThis.Image = ImmediateImage as unknown as typeof Image;
    const user = userEvent.setup();
    const { container } = render(<HtmlToPdf />);

    await uploadHtml(container, user, '<p>Texto</p><img src="https://ejemplo.com/ok.png">');

    await waitFor(() => expect(container.querySelector('.html-preview img')).not.toBeNull());
    expect(screen.queryByText(/no se pudieron cargar/i)).not.toBeInTheDocument();
  });
});
