import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { toolPath } from '../lib/tools';
import { mockPdfPageRender } from '../test/pdfjsMock';
import { makePdfFile, makeSolidPngFile } from '../test/fixtures';

// Unlike components/converters/*.integration.test.tsx (which mount the component
// directly), this navigates through each tool's real route (Spanish slug), the
// way a real user or the pre-render gets there: it checks that React.lazy() +
// Suspense deliver the real widget and that the file -> conversion -> download
// flow still works with the converters lazy-loaded.

const addImageMock = vi.fn();
const addPageMock = vi.fn();
const saveMock = vi.fn();
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function (this: unknown) {
    return { addImage: addImageMock, addPage: addPageMock, save: saveMock };
  }),
}));
const html2canvasMock = vi.fn(async () => {
  // A real canvas: convertHtmlToPdf paginates by slicing it with drawImage(),
  // and vitest-canvas-mock needs an actual HTMLCanvasElement to simulate that.
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
  // the Suspense fallback must be visible BEFORE the dynamic import() resolves
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

describe('Navegación real por la URL de cada herramienta (React.lazy + Suspense)', () => {
  it('images-to-pdf: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute(toolPath('images-to-pdf'));

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
    const { consoleError } = await renderRoute(toolPath('html-to-pdf'));

    expect(screen.getByRole('heading', { level: 1, name: /convertir html a pdf gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    // Upload ("Subir archivo") is the default mode; this flow tests paste ("Pegar código").
    await user.click(screen.getByRole('tab', { name: /pegar código/i }));
    await user.type(screen.getByPlaceholderText(/pegá tu html|pega tu html/i), '<p>Factura #1</p>');
    await user.click(screen.getByRole('button', { name: /convertir a pdf/i }));

    expect(await screen.findByRole('button', { name: /^convertir a pdf$/i })).not.toBeDisabled();
    expect(saveMock).toHaveBeenCalledWith('converted.pdf');

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('pdf-to-images: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute(toolPath('pdf-to-images'));

    expect(screen.getByRole('heading', { level: 1, name: /convertir pdf a imágenes gratis online/i })).toBeInTheDocument();

    const user = userEvent.setup();
    const pdf = await makePdfFile('doc.pdf', 2);
    await user.upload(getFileInput(), pdf);
    await user.click(screen.getByRole('button', { name: /convertir/i }));

    expect(await screen.findByRole('button', { name: /descargar todas \(2\)/i })).toBeInTheDocument();

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('merge-pdfs: fallback -> widget real -> flujo completo de conversión', async () => {
    const { consoleError } = await renderRoute(toolPath('merge-pdfs'));

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
    const { consoleError } = await renderRoute(toolPath('pdf-to-text'));

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
    // still the same React tree (no document remount): Home is gone
    expect(screen.queryByRole('heading', { level: 1, name: /herramientas pdf gratis online, sin registro/i })).not.toBeInTheDocument();
  });
});
