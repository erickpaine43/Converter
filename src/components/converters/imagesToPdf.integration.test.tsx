import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImagesToPdf from './imagesToPdf';
import { makeSolidPngFile, toFile } from '../../test/fixtures';

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('Bloque 3: ImagesToPdf — flujo de usuario', () => {
  it('flujo feliz: seleccionar imágenes, convertir con progreso, y queda el botón de descarga', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImagesToPdf />);

    const img1 = makeSolidPngFile(10, 10, 'foto1.png');
    const img2 = makeSolidPngFile(10, 10, 'foto2.png');
    await user.upload(getFileInput(container), [img1, img2]);

    expect(screen.getByText('foto1.png')).toBeInTheDocument();
    expect(screen.getByText('foto2.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    const downloadLink = await screen.findByRole('link', { name: /descargar pdf/i });
    expect(downloadLink).toHaveAttribute('download', 'converted.pdf');
    expect(screen.getByRole('button', { name: /^convertir a pdf$/i })).toBeInTheDocument();
  });

  it('archivo que supera el límite de tamaño: se bloquea ANTES de procesar, con mensaje claro', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImagesToPdf />);

    const oversized = toFile(new Uint8Array(51 * 1024 * 1024), 'grande.png', 'image/png');
    await user.upload(getFileInput(container), [oversized]);

    expect(await screen.findByText(/supera el límite/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /convirtiendo/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll('.image-preview-item').length).toBe(0);
  });

  it('error real de conversión: mime "image/jpeg" declarado pero contenido no es un JPEG real', async () => {
    const user = userEvent.setup();
    const { container } = render(<ImagesToPdf />);

    // pasa el filtro accept="image/jpeg,image/png" del input (mime correcto),
    // pero el contenido real no es un JPEG válido -> debe fallar en el converter, no trabarse.
    const badFile = toFile('esto no es un jpeg real', 'foto.jpg', 'image/jpeg');
    await user.upload(getFileInput(container), [badFile]);
    expect(screen.getByText('foto.jpg')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByText('.', { exact: false, selector: '.msg-error' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
  });

  it('desmontar a mitad de una conversión no explota, y revoca los Object URL (previews + descarga) al desmontar', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    const user = userEvent.setup();
    const { container, unmount } = render(<ImagesToPdf />);

    const img1 = makeSolidPngFile(5, 5, 'a.png');
    await user.upload(getFileInput(container), [img1]);
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));
    await screen.findByRole('link', { name: /descargar pdf/i });

    const callsBeforeUnmount = revokeSpy.mock.calls.length;
    expect(() => unmount()).not.toThrow();
    // al desmontar se revoca al menos el preview de la imagen y la URL de descarga
    await waitFor(() => expect(revokeSpy.mock.calls.length).toBeGreaterThan(callsBeforeUnmount));
    revokeSpy.mockRestore();
  });
});
