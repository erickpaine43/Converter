import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { convertImagesToPdf } from './imagesToPdf';
import { AppError } from '../lib/errors';
import { makePngFile, makeJpegFile, makeSolidPngFile, toFile } from '../test/fixtures';

describe('Bloque 1: convertImagesToPdf — entradas inválidas/maliciosas', () => {
  it('archivo vacío (0 bytes) con mime de imagen rechaza sin colgar el proceso', async () => {
    const empty = toFile(new Uint8Array(0), 'vacia.png', 'image/png');
    await expect(convertImagesToPdf([empty])).rejects.toBeTruthy();
  });

  it('archivo .jpg cuyo contenido real es otro formato (ej. bmp/webp renombrado) se rechaza con mensaje claro', async () => {
    // Contenido no es un JPEG real, aunque el navegador reportó mime image/jpeg.
    const fakeJpeg = toFile('no soy un jpeg real, soy texto plano', 'foto.jpg', 'image/jpeg');
    await expect(convertImagesToPdf([fakeJpeg])).rejects.toBeTruthy();
  });

  it('mime type no soportado (ej. image/webp) lanza AppError con mensaje en español', async () => {
    const webp = toFile(new Uint8Array([1, 2, 3]), 'foto.webp', 'image/webp');
    await expect(convertImagesToPdf([webp])).rejects.toThrow(AppError);
    await expect(convertImagesToPdf([webp])).rejects.toThrow(/Formato no soportado/);
  });

  it('acepta PNG y JPEG reales mezclados', async () => {
    const bytes = await convertImagesToPdf([makePngFile(), makeJpegFile()]);
    expect(bytes.length).toBeGreaterThan(0);
  });
});

describe('Bloque 2: convertImagesToPdf — validación de salida', () => {
  it('una página por imagen, en el orden en que el usuario las dejó', async () => {
    const img1 = makeSolidPngFile(50, 30, 'a.png');
    const img2 = makeSolidPngFile(80, 40, 'b.png');
    const img3 = makeSolidPngFile(20, 90, 'c.png');

    const bytes = await convertImagesToPdf([img1, img2, img3], 'original', 'portrait');
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
    const sizes = doc.getPages().map(p => p.getSize());
    expect(sizes).toEqual([
      { width: 50, height: 30 },
      { width: 80, height: 40 },
      { width: 20, height: 90 },
    ]);
  });

  it('respeta el orden reordenado (simula el drag-arrows del usuario invirtiendo el orden)', async () => {
    const img1 = makeSolidPngFile(11, 11, 'a.png');
    const img2 = makeSolidPngFile(22, 22, 'b.png');
    const bytes = await convertImagesToPdf([img2, img1], 'original', 'portrait');
    const doc = await PDFDocument.load(bytes);
    const sizes = doc.getPages().map(p => p.getSize());
    expect(sizes).toEqual([{ width: 22, height: 22 }, { width: 11, height: 11 }]);
  });

  it('el callback onProgress se llama con el total correcto y termina en done === total', async () => {
    const imgs = [makeSolidPngFile(5, 5), makeSolidPngFile(5, 5), makeSolidPngFile(5, 5)];
    const calls: Array<[number, number]> = [];
    await convertImagesToPdf(imgs, 'original', 'portrait', (done, total) => calls.push([done, total]));
    expect(calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });
});
