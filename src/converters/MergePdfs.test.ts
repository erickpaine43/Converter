import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergePdfs } from './MergePdfs';
import { toFriendlyErrorMessage } from '../lib/errors';
import { makePdfBytes, makePdfFile, toFile, truncatePdf, corruptPdfTail } from '../test/fixtures';

describe('Bloque 1: mergePdfs — entradas inválidas/maliciosas', () => {
  it('archivo vacío (0 bytes) rechaza sin colgar el proceso', async () => {
    const empty = toFile(new Uint8Array(0), 'vacio.pdf', 'application/pdf');
    await expect(mergePdfs([empty])).rejects.toBeTruthy();
  });

  it('archivo con extensión .pdf pero contenido que no es un PDF real', async () => {
    const fake = toFile('esto es un txt cualquiera, no un PDF', 'notas.pdf', 'application/pdf');
    await expect(mergePdfs([fake])).rejects.toBeTruthy();
  });

  it('PDF truncado a la mitad', async () => {
    const bytes = await makePdfBytes(2);
    const truncated = toFile(truncatePdf(bytes), 'roto.pdf', 'application/pdf');
    await expect(mergePdfs([truncated])).rejects.toBeTruthy();
  });

  it('PDF con la tabla xref/trailer dañada', async () => {
    const bytes = await makePdfBytes(2);
    const corrupted = toFile(corruptPdfTail(bytes), 'roto2.pdf', 'application/pdf');
    await expect(mergePdfs([corrupted])).rejects.toBeTruthy();
  });

  it('los errores de contenido corrupto, una vez mapeados, no exponen el stack técnico', async () => {
    const fake = toFile('no es un pdf', 'x.pdf', 'application/pdf');
    try {
      await mergePdfs([fake]);
      expect.unreachable('debería haber rechazado');
    } catch (err) {
      const friendly = toFriendlyErrorMessage(err);
      expect(friendly).not.toMatch(/at \S+\.js:\d+/); // sin stack trace
      expect(friendly.length).toBeGreaterThan(0);
    }
  });

  it('PDF con una sola página en blanco se une sin problema', async () => {
    const blank = await makePdfFile('blanco.pdf', 1);
    const other = await makePdfFile('otro.pdf', 1);
    const result = await mergePdfs([blank, other]);
    const merged = await PDFDocument.load(result);
    expect(merged.getPageCount()).toBe(2);
  });

  it('nombres de archivo raros (espacios, acentos, emojis, muy largos) no rompen el merge', async () => {
    const weirdNames = [
      'archivo con espacios y ñ.pdf',
      'documento 📄🎉.pdf',
      'a'.repeat(200) + '.pdf',
    ];
    const files = await Promise.all(weirdNames.map(name => makePdfFile(name, 1)));
    const result = await mergePdfs(files);
    const merged = await PDFDocument.load(result);
    expect(merged.getPageCount()).toBe(3);
  });
});

describe('Bloque 2: mergePdfs — validación de salida', () => {
  it('la suma de páginas es exacta y el orden de los PDFs de entrada se respeta', async () => {
    const a = await makePdfFile('a.pdf', 2, { pageSize: [100, 100] });
    const b = await makePdfFile('b.pdf', 3, { pageSize: [200, 200] });
    const c = await makePdfFile('c.pdf', 1, { pageSize: [300, 300] });

    const result = await mergePdfs([a, b, c]);
    const merged = await PDFDocument.load(result);

    expect(merged.getPageCount()).toBe(6);
    const sizes = merged.getPages().map(p => p.getSize());
    expect(sizes).toEqual([
      { width: 100, height: 100 }, { width: 100, height: 100 },
      { width: 200, height: 200 }, { width: 200, height: 200 }, { width: 200, height: 200 },
      { width: 300, height: 300 },
    ]);
  });

  it('el orden inverso de entrada produce el orden inverso de salida (no hay reordenamiento oculto)', async () => {
    const a = await makePdfFile('a.pdf', 1, { pageSize: [111, 111] });
    const b = await makePdfFile('b.pdf', 1, { pageSize: [222, 222] });
    const result = await mergePdfs([b, a]);
    const merged = await PDFDocument.load(result);
    const sizes = merged.getPages().map(p => p.getSize());
    expect(sizes).toEqual([{ width: 222, height: 222 }, { width: 111, height: 111 }]);
  });

  it('el callback onProgress se llama con el total correcto y termina en done === total', async () => {
    const files = await Promise.all([0, 1, 2].map(i => makePdfFile(`f${i}.pdf`, 1)));
    const calls: Array<[number, number]> = [];
    await mergePdfs(files, (done, total) => calls.push([done, total]));
    expect(calls).toEqual([[1, 3], [2, 3], [3, 3]]);
  });
});
