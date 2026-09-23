import { describe, expect, it, vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { convertPdfToText, getPdfPageCount } from './pdfToText';
import { makePdfBytes, makePdfFile, toFile, truncatePdf, corruptPdfTail } from '../test/fixtures';

vi.mock('pdfjs-dist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pdfjs-dist')>();
  return { ...actual, getDocument: vi.fn(actual.getDocument) };
});

describe('Bloque 1: convertPdfToText / getPdfPageCount — entradas inválidas/maliciosas', () => {
  it('archivo vacío (0 bytes) rechaza sin colgar el proceso', async () => {
    const empty = toFile(new Uint8Array(0), 'vacio.pdf', 'application/pdf');
    await expect(getPdfPageCount(empty)).rejects.toBeTruthy();
  });

  it('archivo con extensión .pdf pero contenido que no es un PDF real', async () => {
    const fake = toFile('contenido de texto plano', 'texto.pdf', 'application/pdf');
    await expect(convertPdfToText(fake)).rejects.toBeTruthy();
  });

  it('PDF truncado a la mitad', async () => {
    const bytes = await makePdfBytes(1);
    const truncated = toFile(truncatePdf(bytes), 'roto.pdf', 'application/pdf');
    await expect(convertPdfToText(truncated)).rejects.toBeTruthy();
  });

  it('PDF con la tabla xref/trailer dañada', async () => {
    const bytes = await makePdfBytes(1);
    const corrupted = toFile(corruptPdfTail(bytes), 'roto2.pdf', 'application/pdf');
    await expect(convertPdfToText(corrupted)).rejects.toBeTruthy();
  });

  it('PDF protegido con contraseña: pdfjs-dist rechaza con PasswordException, sin mapear (eso lo hace la UI)', async () => {
    const passwordErr = new Error('No password given');
    passwordErr.name = 'PasswordException';
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce({ promise: Promise.reject(passwordErr) } as ReturnType<typeof pdfjsLib.getDocument>);

    const someFile = toFile(new Uint8Array([1]), 'protegido.pdf', 'application/pdf');
    await expect(getPdfPageCount(someFile)).rejects.toMatchObject({ name: 'PasswordException' });
  });

  it('PDF con una sola página en blanco: extrae string vacío para esa página, sin explotar', async () => {
    const file = await makePdfFile('blanco.pdf', 1);
    const text = await convertPdfToText(file);
    expect(text).toContain('--- Página 1 ---');
  });

  it('nombres de archivo raros no rompen la extracción', async () => {
    const file = await makePdfFile('contrato (v2) ñ 📄.pdf', 1, { pageTexts: ['contenido'] });
    const text = await convertPdfToText(file);
    expect(text).toContain('contenido');
  });
});

describe('Bloque 2: convertPdfToText — validación de salida', () => {
  it('extrae el texto conocido de un PDF fixture', async () => {
    const file = await makePdfFile('doc.pdf', 1, { pageTexts: ['Contenido de prueba XYZ123'] });
    const text = await convertPdfToText(file);
    expect(text).toContain('Contenido de prueba XYZ123');
  });

  it('respeta el rango fromPage/toPage: no incluye páginas fuera del rango', async () => {
    const file = await makePdfFile('doc.pdf', 3, { pageTexts: ['Pagina UNO', 'Pagina DOS', 'Pagina TRES'] });
    const text = await convertPdfToText(file, 2, 2);
    expect(text).toContain('Pagina DOS');
    expect(text).not.toContain('Pagina UNO');
    expect(text).not.toContain('Pagina TRES');
    expect(text).toContain('--- Página 2 ---');
  });

  it('el callback onProgress usa el tamaño del rango pedido, no el total del documento', async () => {
    const file = await makePdfFile('doc.pdf', 5, { pageTexts: ['a', 'b', 'c', 'd', 'e'] });
    const calls: Array<[number, number]> = [];
    await convertPdfToText(file, 2, 4, (done, total) => calls.push([done, total]));
    expect(calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });
});
