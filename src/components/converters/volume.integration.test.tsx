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

    // now add one more -> it should be blocked and NOT added to the list
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

    // each round: 1 image preview URL + 1 download URL = createObjectURL,
    // and each round revokes the previous round's download URL before creating a new one.
    // What matters for "no leak": the revoke count can't stay stuck at 0 while
    // createObjectURL keeps growing round after round.
    expect(createSpy.mock.calls.length).toBeGreaterThanOrEqual(8); // 4 rounds x (preview + download)
    expect(revokeSpy.mock.calls.length).toBeGreaterThanOrEqual(3); // at least 3 old downloadUrls revoked
  }, 20000);
});
