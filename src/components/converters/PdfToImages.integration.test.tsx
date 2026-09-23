import { beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PdfToImages from './PdfToImages';
import { mockPdfPageRender } from '../../test/pdfjsMock';
import { makePdfFile, toFile } from '../../test/fixtures';

beforeAll(async () => {
  await mockPdfPageRender();
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe('Bloque 3: PdfToImages — flujo de usuario', () => {
  it('flujo feliz: seleccionar PDF, convertir con progreso, y quedan las imágenes + botón de descarga', async () => {
    const user = userEvent.setup();
    const { container } = render(<PdfToImages />);

    const file = await makePdfFile('doc.pdf', 3);
    await user.upload(getFileInput(container), file);

    await user.click(screen.getByRole('button', { name: /convertir/i }));

    const downloadAllBtn = await screen.findByRole('button', { name: /descargar todas \(3\)/i });
    expect(downloadAllBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^convertir$/i })).not.toBeDisabled();
  });

  it('PDF corrupto: muestra el mensaje de error en el UI y no queda colgado en "Convirtiendo..."', async () => {
    const user = userEvent.setup();
    const { container } = render(<PdfToImages />);

    const badFile = toFile('no es un pdf real', 'roto.pdf', 'application/pdf');
    await user.upload(getFileInput(container), badFile);

    await user.click(screen.getByRole('button', { name: /convertir/i }));

    expect(await screen.findByText('.', { exact: false, selector: '.msg-error' })).toBeInTheDocument();
    expect(screen.queryByText(/convirtiendo/i)).not.toBeInTheDocument();
  });

  it('desmontar a mitad de una conversión no explota', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<PdfToImages />);

    const file = await makePdfFile('doc.pdf', 2);
    await user.upload(getFileInput(container), file);
    await user.click(screen.getByRole('button', { name: /convertir/i }));

    expect(() => unmount()).not.toThrow();
  });
});
