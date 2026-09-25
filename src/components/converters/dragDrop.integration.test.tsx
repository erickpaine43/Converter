import { describe, expect, it } from 'vitest';
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MergePdfs from './MergePdfs';
import ImagesToPdf from './imagesToPdf';
import PdfToText from './PdfToText';
import PdfToImages from './PdfToImages';
import HtmlToPdf from './HtmlToPdf';
import { matchesAccept } from '../../lib/useFileDrop';
import { makePdfFile, makePngFile, toFile } from '../../test/fixtures';

// jsdom no implementa DataTransfer: alcanza con un objeto con types/files.
function dataTransfer(files: File[]) {
  return { types: ['Files'], files, dropEffect: 'none' };
}

function getDropZone(container: HTMLElement): HTMLElement {
  return container.querySelector('.file-drop') as HTMLElement;
}

function drop(zone: HTMLElement, files: File[]) {
  const dt = dataTransfer(files);
  fireEvent.dragEnter(zone, { dataTransfer: dt });
  fireEvent.dragOver(zone, { dataTransfer: dt });
  const event = createEvent.drop(zone, { dataTransfer: dt });
  fireEvent(zone, event);
  return event;
}

describe('Drag & drop en las zonas .file-drop', () => {
  it('Unir PDFs: soltar varios PDFs los agrega a la lista y cancela la acción por defecto del navegador', async () => {
    const { container } = render(<MergePdfs />);
    const a = await makePdfFile('a.pdf', 1);
    const b = await makePdfFile('b.pdf', 1);

    const event = drop(getDropZone(container), [a, b]);

    expect(event.defaultPrevented).toBe(true);
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('b.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unir 2 pdfs/i })).not.toBeDisabled();
  });

  it('Unir PDFs: un archivo que no es PDF se rechaza con mensaje y no se agrega', () => {
    const { container } = render(<MergePdfs />);
    drop(getDropZone(container), [toFile('hola', 'notas.txt', 'text/plain')]);

    expect(screen.getByText(/"notas\.txt" no es un tipo de archivo admitido/)).toBeInTheDocument();
    expect(screen.queryByText('notas.txt')).not.toBeInTheDocument();
  });

  it('Unir PDFs: pasa por los mismos límites que el input (tamaño)', () => {
    const { container } = render(<MergePdfs />);
    const oversized = toFile(new Uint8Array(51 * 1024 * 1024), 'gigante.pdf', 'application/pdf');
    drop(getDropZone(container), [oversized]);

    expect(screen.getByText(/supera el límite/)).toBeInTheDocument();
  });

  it('Imágenes a PDF: soltar varias imágenes las agrega', () => {
    const { container } = render(<ImagesToPdf />);
    drop(getDropZone(container), [makePngFile('uno.png'), makePngFile('dos.png')]);

    expect(screen.getByText('uno.png')).toBeInTheDocument();
    expect(screen.getByText('dos.png')).toBeInTheDocument();
  });

  it('PDF a Texto: soltar un PDF lo carga igual que el input', async () => {
    const { container } = render(<PdfToText />);
    drop(getDropZone(container), [await makePdfFile('doc.pdf', 2)]);

    await waitFor(() => expect(container.textContent).toContain('doc.pdf — 2 página(s)'));
  });

  it('PDF a Imágenes: soltar más de un archivo en una herramienta de un solo archivo muestra error', async () => {
    const { container } = render(<PdfToImages />);
    drop(getDropZone(container), [await makePdfFile('a.pdf', 1), await makePdfFile('b.pdf', 1)]);

    expect(screen.getByText(/un solo archivo por vez/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^convertir$/i })).toBeDisabled();
  });

  it('HTML a PDF: soltar el .html lo carga en la vista previa', async () => {
    const { container } = render(<HtmlToPdf />);
    drop(getDropZone(container), [toFile('<p>Hola soltado</p>', 'doc.html', 'text/html')]);

    expect(await screen.findByText('doc.html')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelector('.html-preview')?.textContent).toContain('Hola soltado'));
  });

  it('feedback visual: la zona se resalta mientras se arrastra encima y se apaga al salir', () => {
    const { container } = render(<MergePdfs />);
    const zone = getDropZone(container);
    const dt = dataTransfer([]);

    fireEvent.dragEnter(zone, { dataTransfer: dt });
    expect(zone).toHaveClass('file-drop--active');
    expect(screen.getByText('Suelta los PDFs aquí')).toBeInTheDocument();

    fireEvent.dragLeave(zone, { dataTransfer: dt });
    expect(zone).not.toHaveClass('file-drop--active');
  });

  it('soltar un archivo FUERA de la zona tampoco deja que el navegador lo abra', () => {
    render(<MergePdfs />);
    const event = createEvent.drop(document.body, { dataTransfer: dataTransfer([]) });
    fireEvent(document.body, event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('matchesAccept', () => {
  it('matchea por MIME exacto, comodín y extensión', () => {
    expect(matchesAccept(toFile('', 'a.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(matchesAccept(toFile('', 'a.png', 'image/png'), 'image/*')).toBe(true);
    expect(matchesAccept(toFile('', 'A.HTML', ''), '.html,.htm')).toBe(true);
    expect(matchesAccept(toFile('', 'a.gif', 'image/gif'), 'image/jpeg,image/png')).toBe(false);
  });
});
