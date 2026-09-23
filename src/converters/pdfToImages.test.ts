import { beforeAll, describe, expect, it, vi } from 'vitest';
import * as pdfjsLib from 'pdfjs-dist';
import { convertPdfToImages } from './pdfToImages';
import { mockPdfPageRender } from '../test/pdfjsMock';
import { makePdfBytes, makePdfFile, toFile, truncatePdf, corruptPdfTail } from '../test/fixtures';

vi.mock('pdfjs-dist', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pdfjs-dist')>();
  return { ...actual, getDocument: vi.fn(actual.getDocument) };
});

// Nota: no usamos vi.restoreAllMocks() en afterEach acá porque tiraría abajo el
// mock de `render` (necesario para TODOS los tests del archivo). El mock de
// getDocument de más abajo usa mockReturnValueOnce, que se autoconsume solo.
beforeAll(async () => {
  await mockPdfPageRender();
});

describe('Bloque 1: convertPdfToImages — entradas inválidas/maliciosas', () => {
  it('archivo vacío (0 bytes) rechaza sin colgar el proceso', async () => {
    const empty = toFile(new Uint8Array(0), 'vacio.pdf', 'application/pdf');
    await expect(convertPdfToImages(empty)).rejects.toBeTruthy();
  });

  it('archivo con extensión .pdf pero contenido que no es un PDF real', async () => {
    const fake = toFile('contenido de texto plano', 'imagen.pdf', 'application/pdf');
    await expect(convertPdfToImages(fake)).rejects.toBeTruthy();
  });

  it('PDF truncado a la mitad', async () => {
    const bytes = await makePdfBytes(1);
    const truncated = toFile(truncatePdf(bytes), 'roto.pdf', 'application/pdf');
    await expect(convertPdfToImages(truncated)).rejects.toBeTruthy();
  });

  it('PDF con la tabla xref/trailer dañada', async () => {
    const bytes = await makePdfBytes(1);
    const corrupted = toFile(corruptPdfTail(bytes), 'roto2.pdf', 'application/pdf');
    await expect(convertPdfToImages(corrupted)).rejects.toBeTruthy();
  });

  it('PDF protegido con contraseña: pdfjs-dist rechaza con PasswordException, sin mapear (eso lo hace la UI)', async () => {
    const passwordErr = new Error('No password given');
    passwordErr.name = 'PasswordException';
    vi.mocked(pdfjsLib.getDocument).mockReturnValueOnce({ promise: Promise.reject(passwordErr) } as ReturnType<typeof pdfjsLib.getDocument>);

    const someFile = toFile(new Uint8Array([1]), 'protegido.pdf', 'application/pdf');
    await expect(convertPdfToImages(someFile)).rejects.toMatchObject({ name: 'PasswordException' });
  });

  it('PDF con una sola página en blanco genera una imagen', async () => {
    const file = await makePdfFile('blanco.pdf', 1);
    const images = await convertPdfToImages(file);
    expect(images.length).toBe(1);
  });

  it('nombres de archivo raros no rompen la conversión', async () => {
    const file = await makePdfFile('reporte financiero (final) ñ 📊.pdf', 1);
    const images = await convertPdfToImages(file);
    expect(images.length).toBe(1);
  });
});

describe('Bloque 2: convertPdfToImages — validación de salida', () => {
  it('la cantidad de imágenes generadas coincide con la cantidad de páginas del PDF', async () => {
    const file = await makePdfFile('multi.pdf', 4);
    const images = await convertPdfToImages(file);
    expect(images.length).toBe(4);
  });

  it('respeta el formato seleccionado (mimeType pasado a canvas.toDataURL)', async () => {
    const file = await makePdfFile('one.pdf', 1);
    const toDataURLSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
    await convertPdfToImages(file, 'jpeg', 1);
    expect(toDataURLSpy).toHaveBeenCalledWith('image/jpeg', 0.92);
    toDataURLSpy.mockRestore();
  });

  it('respeta la calidad seleccionada (scale del viewport)', async () => {
    const file = await makePdfFile('one.pdf', 1);
    const bytes = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
    const page = await doc.getPage(1);
    const proto = Object.getPrototypeOf(page);
    const viewportSpy = vi.spyOn(proto, 'getViewport');

    await convertPdfToImages(file, 'png', 3);
    expect(viewportSpy).toHaveBeenCalledWith({ scale: 3 });
    viewportSpy.mockRestore();
  });

  it('el callback onProgress se llama con el total correcto y termina en done === total', async () => {
    const file = await makePdfFile('multi.pdf', 3);
    const calls: Array<[number, number]> = [];
    await convertPdfToImages(file, 'png', 1, (done, total) => calls.push([done, total]));
    expect(calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });
});
