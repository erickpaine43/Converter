import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PdfToText from './PdfToText';
import { makePdfFile, toFile } from '../../test/fixtures';

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('Bloque 3: PdfToText — flujo de usuario', () => {
  it('flujo feliz: seleccionar PDF, ver conteo de páginas, extraer con progreso, y ver el texto + botón de descarga', async () => {
    const user = userEvent.setup();
    const { container } = render(<PdfToText />);

    const file = await makePdfFile('doc.pdf', 2, { pageTexts: ['Hola desde la página uno', 'Y la dos'] });
    await user.upload(getFileInput(container), file);

    await waitFor(() => expect(container.textContent).toContain('2 página(s)'));

    await user.click(screen.getByRole('button', { name: /extraer texto/i }));

    expect(await screen.findByText(/Hola desde la página uno/i)).toBeInTheDocument();
    const downloadBtn = screen.getByRole('button', { name: /descargar \.txt/i });
    expect(downloadBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^extraer texto$/i })).not.toBeDisabled();
  });

  it('archivo inválido: el error se muestra al seleccionar el archivo (antes de poder extraer), sin colgarse', async () => {
    const user = userEvent.setup();
    const { container } = render(<PdfToText />);

    const badFile = toFile('no es un pdf real', 'roto.pdf', 'application/pdf');
    await user.upload(getFileInput(container), badFile);

    expect(await screen.findByText('.', { exact: false, selector: '.msg-error' })).toBeInTheDocument();
    // no debería habilitarse "Extraer Texto" con un archivo que ya falló al leerse
    expect(screen.getByRole('button', { name: /extraer texto/i })).toBeDisabled();
  });

  it('desmontar a mitad de una extracción no explota', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<PdfToText />);

    const file = await makePdfFile('doc.pdf', 1, { pageTexts: ['contenido'] });
    await user.upload(getFileInput(container), file);
    await user.click(screen.getByRole('button', { name: /extraer texto/i }));

    expect(() => unmount()).not.toThrow();
  });
});
