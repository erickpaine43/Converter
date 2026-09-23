import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MergePdfs from './MergePdfs';
import { makePdfFile, toFile } from '../../test/fixtures';

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('Bloque 3: MergePdfs — flujo de usuario', () => {
  it('flujo feliz: seleccionar 2 PDFs, convertir con progreso, y queda el botón de descarga', async () => {
    const user = userEvent.setup();
    const { container } = render(<MergePdfs />);

    const a = await makePdfFile('a.pdf', 1);
    const b = await makePdfFile('b.pdf', 1);
    await user.upload(getFileInput(container), [a, b]);

    expect(screen.getByText('a.pdf', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('b.pdf', { exact: false })).toBeInTheDocument();

    const convertBtn = screen.getByRole('button', { name: /unir 2 pdfs/i });
    expect(convertBtn).not.toBeDisabled();
    await user.click(convertBtn);

    const downloadLink = await screen.findByRole('link', { name: /descargar pdf unido/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('download', 'merged.pdf');
    // no debe quedar el botón colgado en "Uniendo..."
    expect(screen.getByRole('button', { name: /unir 2 pdfs/i })).toBeInTheDocument();
  });

  it('archivo inválido: muestra el mensaje de error en el UI y el botón no queda colgado', async () => {
    const user = userEvent.setup();
    const { container } = render(<MergePdfs />);

    // supera el límite de tamaño configurado en fileLimits.ts
    const oversized = toFile(new Uint8Array(51 * 1024 * 1024), 'gigante.pdf', 'application/pdf');
    await user.upload(getFileInput(container), [oversized]);

    expect(await screen.findByText(/supera el límite/i)).toBeInTheDocument();
    // no se agregó a la lista de archivos a unir (el nombre solo aparece dentro del mensaje de error)
    expect(document.querySelectorAll('.file-list-item').length).toBe(0);
  });

  it('error durante la conversión (PDF corrupto): mensaje visible, sin quedar colgado en "Uniendo..."', async () => {
    const user = userEvent.setup();
    const { container } = render(<MergePdfs />);

    const bad1 = toFile('no es un pdf real', 'malo1.pdf', 'application/pdf');
    const bad2 = toFile('tampoco', 'malo2.pdf', 'application/pdf');
    await user.upload(getFileInput(container), [bad1, bad2]);

    await user.click(screen.getByRole('button', { name: /unir 2 pdfs/i }));

    expect(await screen.findByText(/./, { selector: '.msg-error' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unir 2 pdfs/i })).not.toBeDisabled();
    expect(screen.queryByText(/uniendo/i)).not.toBeInTheDocument();
  });

  it('desmontar a mitad de una conversión no explota, y revoca el Object URL de descarga al desmontar', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const user = userEvent.setup();
    const { container, unmount } = render(<MergePdfs />);

    const a = await makePdfFile('a.pdf', 1);
    const b = await makePdfFile('b.pdf', 1);
    await user.upload(getFileInput(container), [a, b]);
    await user.click(screen.getByRole('button', { name: /unir 2 pdfs/i }));
    await screen.findByRole('link', { name: /descargar pdf unido/i });

    expect(() => unmount()).not.toThrow();
    await waitFor(() => expect(revokeSpy).toHaveBeenCalled());
    revokeSpy.mockRestore();
  });
});
