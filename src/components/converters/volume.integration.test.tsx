import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MergePdfs from './MergePdfs';
import ImagesToPdf from './imagesToPdf';
import { MAX_FILES_MERGE } from '../../lib/fileLimits';
import { makePdfFile, makeSolidPngFile } from '../../test/fixtures';

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('Bloque 4: casos límite de volumen', () => {
  it(`unir exactamente ${MAX_FILES_MERGE} PDFs (el límite exacto) funciona; ${MAX_FILES_MERGE + 1} se bloquea`, async () => {
    const user = userEvent.setup();
    const { container } = render(<MergePdfs />);

    const exactFiles = await Promise.all(
      Array.from({ length: MAX_FILES_MERGE }, (_, i) => makePdfFile(`f${i}.pdf`, 1))
    );
    await user.upload(getFileInput(container), exactFiles);

    expect(document.querySelectorAll('.file-list-item').length).toBe(MAX_FILES_MERGE);
    expect(screen.queryByText(/solo se permiten/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: new RegExp(`unir ${MAX_FILES_MERGE} pdfs`, 'i') }));
    const downloadLink = await screen.findByRole('link', { name: /descargar pdf unido/i });
    expect(downloadLink).toBeInTheDocument();

    // ahora agregamos uno más -> debería bloquearse y NO sumarse a la lista
    const oneMore = await makePdfFile('extra.pdf', 1);
    await user.upload(getFileInput(container), [oneMore]);

    expect(await screen.findByText(/solo se permiten/i)).toBeInTheDocument();
    expect(document.querySelectorAll('.file-list-item').length).toBe(MAX_FILES_MERGE);
  }, 20000);

  it('varias conversiones sucesivas (imágenes a PDF) no acumulan Object URLs sin revocar', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImagesToPdf />);

    const createSpy = vi.mocked(URL.createObjectURL);
    const revokeSpy = vi.mocked(URL.revokeObjectURL);
    createSpy.mockClear();
    revokeSpy.mockClear();

    for (let round = 0; round < 4; round++) {
      const img = makeSolidPngFile(5, 5, `img${round}.png`);
      await user.upload(getFileInput(container), [img]);
      await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));
      await screen.findByRole('link', { name: /descargar pdf/i });
    }

    // por cada ronda: 1 URL de preview de la imagen + 1 URL de descarga = createObjectURL
    // y cada ronda revoca el download URL de la ronda anterior antes de crear el nuevo.
    // Lo importante para "no leak": el número de revokes no puede quedarse fijo en 0
    // mientras createObjectURL sigue subiendo ronda tras ronda.
    expect(createSpy.mock.calls.length).toBeGreaterThanOrEqual(8); // 4 rondas x (preview + descarga)
    expect(revokeSpy.mock.calls.length).toBeGreaterThanOrEqual(3); // al menos 3 downloadUrl viejos revocados
  }, 20000);
});
