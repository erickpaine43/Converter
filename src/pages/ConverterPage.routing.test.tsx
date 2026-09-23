import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { mockPdfPageRender } from '../test/pdfjsMock';
import { makePdfFile, makeSolidPngFile } from '../test/fixtures';

// A diferencia de los tests de components/converters/*.integration.test.tsx (que
// montan el componente directo), esto navega por la ruta real /converter/:type,
// tal como llega un usuario real o un pre-render: valida que React.lazy() +
// Suspense entreguen el widget real y que el flujo de archivo -> conversión ->
// descarga siga funcionando después de mover los conversores a carga diferida.

const addImageMock = vi.fn();
const addPageMock = vi.fn();
const saveMock = vi.fn();
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function (this: unknown) {
    return { addImage: addImageMock, addPage: addPageMock, save: saveMock };
  }),
}));
const html2canvasMock = vi.fn(async () => {
  // canvas real: convertHtmlToPdf pagina recortando el canvas con drawImage(),
  // y vitest-canvas-mock necesita un HTMLCanvasElement de verdad para simularlo.
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
});
vi.mock('html2canvas', () => ({ default: () => html2canvasMock() }));

function getFileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

async function renderRoute(path: string) {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>
  );
  // el fallback de Suspense debe estar visible ANTES de que resuelva el import() dinámico
  expect(screen.getByText(/cargando herramienta/i)).toBeInTheDocument();
  await waitForElementToBeRemoved(() => screen.queryByText(/cargando herramienta/i));
  return { ...utils, consoleError };
}

beforeAll(async () => {
  await mockPdfPageRender();
});

beforeEach(() => {
  addImageMock.mockClear();
  saveMock.mockClear();
  html2canvasMock.mockClear();
});

describe('Navegación real /converter/:type (React.lazy + Suspense)', () => {
  it('images-to-pdf: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute('/converter/images-to-pdf');

    expect(screen.getByRole('heading', { level: 1, name: /convertir imágenes a pdf gratis online/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^imágenes a pdf$/i })).toBeInTheDocument();

    const user = userEvent.setup();
    const img = makeSolidPngFile(10, 10, 'foto.png');
    await user.upload(getFileInput(), img);
    expect(screen.getByText('foto.png')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));
    const downloadLink = await screen.findByRole('link', { name: /descargar pdf/i });
    expect(downloadLink).toHaveAttribute('download', 'converted.pdf');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('html-to-pdf: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute('/converter/html-to-pdf');

    expect(screen.getByRole('heading', { level: 1, name: /convertir html a pdf gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    // "Subir archivo" es el modo por defecto; este flujo prueba "Pegar código".
    await user.click(screen.getByRole('tab', { name: /pegar código/i }));
    await user.type(screen.getByPlaceholderText(/pegá tu html|pega tu html/i), '<p>Factura #1</p>');
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
    expect(saveMock).toHaveBeenCalledWith('converted.pdf');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('pdf-to-images: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute('/converter/pdf-to-images');

    expect(screen.getByRole('heading', { level: 1, name: /convertir pdf a imágenes gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    const pdf = await makePdfFile('doc.pdf', 2);
    await user.upload(getFileInput(), pdf);
    await user.click(screen.getByRole('button', { name: /convertir/i }));

    expect(await screen.findByRole('button', { name: /descargar todas \(2\)/i })).toBeInTheDocument();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('merge-pdfs: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute('/converter/merge-pdfs');

    expect(screen.getByRole('heading', { level: 1, name: /unir pdfs gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    const a = await makePdfFile('a.pdf', 1);
    const b = await makePdfFile('b.pdf', 1);
    await user.upload(getFileInput(), [a, b]);
    await user.click(screen.getByRole('button', { name: /unir 2 pdfs/i }));

    const downloadLink = await screen.findByRole('link', { name: /descargar pdf unido/i });
    expect(downloadLink).toHaveAttribute('download', 'merged.pdf');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('pdf-to-text: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute('/converter/pdf-to-text');

    expect(screen.getByRole('heading', { level: 1, name: /extraer texto de pdf gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    const pdf = await makePdfFile('doc.pdf', 1, { pageTexts: ['contenido de prueba'] });
    await user.upload(getFileInput(), pdf);
    await user.click(screen.getByRole('button', { name: /extraer texto/i }));

    expect(await screen.findByText(/contenido de prueba/i)).toBeInTheDocument();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('la tarjeta de Home navega client-side (sin recarga) hasta la herramienta real', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('link', { name: /unir pdfs.*combina varios archivos pdf/is }));

    expect(await screen.findByRole('heading', { level: 1, name: /unir pdfs gratis online/i })).toBeInTheDocument();
    // seguimos en el mismo árbol de React (no hubo remount de document): la Home ya no está
    expect(screen.queryByRole('heading', { level: 1, name: /herramientas pdf para tu negocio/i })).not.toBeInTheDocument();
  });
});
