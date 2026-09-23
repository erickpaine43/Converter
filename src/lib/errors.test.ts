import { describe, expect, it } from 'vitest';
import { AppError, toFriendlyErrorMessage } from './errors';

function namedError(name: string, message: string): Error {
  const err = new Error(message);
  err.name = name;
  return err;
}

describe('Bloque 1: toFriendlyErrorMessage', () => {
  it('mapea PasswordException (pdfjs-dist) al mensaje de PDF con contraseña', () => {
    const err = namedError('PasswordException', 'No password given');
    expect(toFriendlyErrorMessage(err)).toBe('Este PDF está protegido con contraseña. Quitá la protección antes de subirlo.');
  });

  it('mapea EncryptedPDFError (pdf-lib) al mensaje de PDF con contraseña', () => {
    const err = namedError('EncryptedPDFError', 'Input document to `PDFDocument.load` is encrypted.');
    expect(toFriendlyErrorMessage(err)).toBe('Este PDF está protegido con contraseña. Quitá la protección antes de subirlo.');
  });

  it('mapea InvalidPDFException al mensaje de PDF dañado', () => {
    const err = namedError('InvalidPDFException', 'Invalid PDF structure.');
    expect(toFriendlyErrorMessage(err)).toBe('El archivo no es un PDF válido o está dañado.');
  });

  it('deja pasar el mensaje de un AppError tal cual (ya está en español y es claro)', () => {
    const err = new AppError('Formato no soportado: image/webp. Usa JPG o PNG.');
    expect(toFriendlyErrorMessage(err)).toBe('Formato no soportado: image/webp. Usa JPG o PNG.');
  });

  it('errores técnicos no mapeados caen a un mensaje genérico, no el stack técnico', () => {
    const err = new Error('Cannot read properties of undefined (reading \'foo\') at internal.js:42');
    const msg = toFriendlyErrorMessage(err);
    expect(msg).not.toContain('internal.js');
    expect(msg).not.toContain('undefined');
    expect(msg.length).toBeGreaterThan(0);
  });

  it('valores no-Error (throw de algo raro) también caen al genérico sin explotar', () => {
    expect(() => toFriendlyErrorMessage('string suelta')).not.toThrow();
    expect(() => toFriendlyErrorMessage(undefined)).not.toThrow();
    expect(() => toFriendlyErrorMessage({ weird: true })).not.toThrow();
  });
});
