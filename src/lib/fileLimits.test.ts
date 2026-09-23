import { describe, expect, it } from 'vitest';
import { MAX_FILE_SIZE_MB, MAX_FILES_MERGE, MAX_FILES_IMAGES, validateFiles } from './fileLimits';
import { toFile } from '../test/fixtures';

function fileOfSize(bytes: number, name = 'f.pdf'): File {
  return toFile(new Uint8Array(bytes), name, 'application/pdf');
}

describe('Bloque 1: validateFiles', () => {
  it('acepta un archivo dentro del límite de tamaño', () => {
    const f = fileOfSize(1024);
    expect(validateFiles([f])).toBeNull();
  });

  it('rechaza un archivo que supera el límite de tamaño, ANTES de procesar', () => {
    const oversized = fileOfSize(MAX_FILE_SIZE_MB * 1024 * 1024 + 1);
    const err = validateFiles([oversized]);
    expect(err).not.toBeNull();
    expect(err).toContain(`${MAX_FILE_SIZE_MB} MB`);
  });

  it('borde exacto del tamaño: el límite exacto pasa, límite+1 byte no pasa', () => {
    const exact = fileOfSize(MAX_FILE_SIZE_MB * 1024 * 1024);
    const overByOne = fileOfSize(MAX_FILE_SIZE_MB * 1024 * 1024 + 1);
    expect(validateFiles([exact])).toBeNull();
    expect(validateFiles([overByOne])).not.toBeNull();
  });

  it('rechaza cuando la cantidad de archivos supera el límite (unir PDFs)', () => {
    const files = Array.from({ length: MAX_FILES_MERGE + 1 }, (_, i) => fileOfSize(10, `f${i}.pdf`));
    const err = validateFiles(files, { maxCount: MAX_FILES_MERGE });
    expect(err).not.toBeNull();
    expect(err).toContain(String(MAX_FILES_MERGE));
  });

  it('borde exacto de cantidad: el límite exacto pasa, límite+1 no pasa (imágenes a PDF)', () => {
    const exact = Array.from({ length: MAX_FILES_IMAGES }, (_, i) => fileOfSize(10, `f${i}.png`));
    const overByOne = Array.from({ length: MAX_FILES_IMAGES + 1 }, (_, i) => fileOfSize(10, `f${i}.png`));
    expect(validateFiles(exact, { maxCount: MAX_FILES_IMAGES })).toBeNull();
    expect(validateFiles(overByOne, { maxCount: MAX_FILES_IMAGES })).not.toBeNull();
  });

  it('cuenta los archivos ya existentes al validar el límite de cantidad', () => {
    const existing = 5;
    const newFiles = Array.from({ length: MAX_FILES_MERGE - existing }, (_, i) => fileOfSize(10, `f${i}.pdf`));
    // exactamente en el límite total
    expect(validateFiles(newFiles, { maxCount: MAX_FILES_MERGE, existingCount: existing })).toBeNull();
    // uno más rompe el límite
    newFiles.push(fileOfSize(10, 'extra.pdf'));
    expect(validateFiles(newFiles, { maxCount: MAX_FILES_MERGE, existingCount: existing })).not.toBeNull();
  });

  it('archivo vacío (0 bytes) no dispara el límite de tamaño', () => {
    const empty = fileOfSize(0);
    expect(validateFiles([empty])).toBeNull();
  });
});
