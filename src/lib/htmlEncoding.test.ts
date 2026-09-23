import { describe, expect, it } from 'vitest';
import { decodeHtmlBytes, sniffDeclaredCharset } from './htmlEncoding';

// Bytes tal como los guarda un editor en windows-1252 / ISO-8859-1: para los
// caracteres del español (á é í ó ú ñ ü ¿ ¡) ambos usan el mismo byte que su
// code point Unicode, así que 'latin1' de Node genera exactamente esos bytes.
function latin1Bytes(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text, 'latin1'));
}

const ACCENTED = 'Estas páginas no admiten alteración: ñandú, pingüino, ¿qué? ¡sí!';

describe('decodeHtmlBytes — respeta la codificación declarada en el HTML', () => {
  it('reproducción del bug: leer windows-1252 como UTF-8 (lo que hacía readAsText) da mojibake', () => {
    const bytes = latin1Bytes(`<p>${ACCENTED}</p>`);
    const asUtf8 = new TextDecoder('utf-8').decode(bytes);
    expect(asUtf8).toContain('p�ginas');
    expect(asUtf8).toContain('alteraci�n');
  });

  it('<meta charset="windows-1252">: los acentos se leen bien', () => {
    const bytes = latin1Bytes(`<html><head><meta charset="windows-1252"></head><body><p>${ACCENTED}</p></body></html>`);
    const text = decodeHtmlBytes(bytes);
    expect(text).toContain(ACCENTED);
    expect(text).not.toContain('�');
  });

  it('<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"> (formato de Word): los acentos se leen bien', () => {
    const bytes = latin1Bytes(
      `<html><head><meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"></head><body><p>${ACCENTED}</p></body></html>`
    );
    expect(decodeHtmlBytes(bytes)).toContain(ACCENTED);
  });

  it('caracteres propios de windows-1252 (rango 0x80-0x9F, ej. comillas tipográficas y €)', () => {
    const bytes = new Uint8Array([
      ...latin1Bytes('<meta charset=windows-1252><p>'),
      0x93, ...latin1Bytes('Hola'), 0x94, 0x20, 0x80,
      ...latin1Bytes('</p>'),
    ]);
    expect(decodeHtmlBytes(bytes)).toContain('“Hola” €');
  });

  it('UTF-8 declarado o sin declarar: comportamiento de siempre', () => {
    const utf8 = new TextEncoder().encode(`<meta charset="utf-8"><p>${ACCENTED}</p>`);
    expect(decodeHtmlBytes(utf8)).toContain(ACCENTED);

    const undeclared = new TextEncoder().encode(`<p>${ACCENTED}</p>`);
    expect(decodeHtmlBytes(undeclared)).toContain(ACCENTED);
  });

  it('BOM de UTF-8 tiene prioridad sobre el <meta> (y no queda en el texto)', () => {
    const body = new TextEncoder().encode(`<meta charset="windows-1252"><p>${ACCENTED}</p>`);
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...body]);
    const text = decodeHtmlBytes(withBom);
    expect(text).toContain(ACCENTED);
    expect(text.charCodeAt(0)).not.toBe(0xfeff);
  });

  it('sin <meta> y con bytes que NO son UTF-8 válido: cae a windows-1252 en vez de mostrar "�"', () => {
    const bytes = latin1Bytes(`<p>${ACCENTED}</p>`);
    expect(decodeHtmlBytes(bytes)).toContain(ACCENTED);
  });

  it('charset declarado desconocido: se ignora y se usa UTF-8', () => {
    const bytes = new TextEncoder().encode(`<meta charset="no-existe-123"><p>${ACCENTED}</p>`);
    expect(decodeHtmlBytes(bytes)).toContain(ACCENTED);
  });

  it('<meta> que dice UTF-16 se trata como UTF-8 (igual que los navegadores)', () => {
    const bytes = new TextEncoder().encode(`<meta charset="utf-16"><p>${ACCENTED}</p>`);
    expect(decodeHtmlBytes(bytes)).toContain(ACCENTED);
  });

  it('acepta un ArrayBuffer (lo que devuelve File.arrayBuffer())', () => {
    const bytes = latin1Bytes(`<meta charset="windows-1252"><p>${ACCENTED}</p>`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    expect(decodeHtmlBytes(buffer)).toContain(ACCENTED);
  });
});

describe('sniffDeclaredCharset', () => {
  it.each([
    ['<meta charset="windows-1252">', 'windows-1252'],
    ["<meta charset='ISO-8859-1'>", 'ISO-8859-1'],
    ['<meta charset=latin1>', 'latin1'],
    ['<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=windows-1252">', 'windows-1252'],
    ['<meta content="text/html; charset=iso-8859-15" http-equiv="Content-Type">', 'iso-8859-15'],
    ['<p>sin meta</p>', null],
  ])('%s -> %s', (html, expected) => {
    expect(sniffDeclaredCharset(latin1Bytes(html))).toBe(expected);
  });

  it('solo mira los primeros 1024 bytes (como el prescan del estándar HTML)', () => {
    const html = `<!-- ${'x'.repeat(1100)} --><meta charset="windows-1252">`;
    expect(sniffDeclaredCharset(latin1Bytes(html))).toBeNull();
  });
});
