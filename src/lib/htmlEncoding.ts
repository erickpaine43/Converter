// Cuántos bytes del inicio se revisan buscando el <meta charset>: el estándar
// HTML (prescan del algoritmo de "encoding sniffing") mira los primeros 1024.
const PRESCAN_BYTES = 1024;

const META_CHARSET_RE = /<meta\b[^>]*?\bcharset\s*=\s*["']?\s*([\w.:-]+)/i;

/**
 * Busca el charset declarado en el propio HTML, en cualquiera de sus dos formas:
 *   <meta charset="windows-1252">
 *   <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
 * Devuelve la etiqueta tal cual aparece (sin normalizar), o null si no hay.
 */
export function sniffDeclaredCharset(bytes: Uint8Array): string | null {
  // latin1 mapea cada byte a un carácter 1:1, así que sirve para leer el ASCII
  // del <meta> sin importar en qué codificación esté el resto del archivo.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, PRESCAN_BYTES));
  return head.match(META_CHARSET_RE)?.[1] ?? null;
}

function bomEncoding(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8';
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  return null;
}

/** TextDecoder para la etiqueta dada, o null si el navegador no la reconoce. */
function decoderFor(label: string): TextDecoder | null {
  try {
    const decoder = new TextDecoder(label);
    // igual que los navegadores: un <meta> que dice UTF-16 no puede ser cierto
    // (el <meta> se pudo leer como ASCII), así que se trata como UTF-8.
    return decoder.encoding.startsWith('utf-16') ? new TextDecoder('utf-8') : decoder;
  } catch {
    return null;
  }
}

/**
 * Decodifica los bytes de un archivo HTML respetando su codificación real, en
 * este orden de prioridad (el mismo que usan los navegadores):
 *   1. BOM al inicio del archivo.
 *   2. charset declarado en un <meta> (ej. HTML exportado desde Word: windows-1252).
 *   3. UTF-8. Si los bytes NO son UTF-8 válido (archivo viejo sin <meta>), en vez
 *      de devolver texto con "�" se decodifica como windows-1252, que es lo que
 *      hace un navegador en esos casos para contenido en español.
 */
export function decodeHtmlBytes(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const bom = bomEncoding(bytes);
  if (bom) return new TextDecoder(bom).decode(bytes); // TextDecoder descarta el BOM

  const declared = sniffDeclaredCharset(bytes);
  const declaredDecoder = declared ? decoderFor(declared) : null;
  if (declaredDecoder) return declaredDecoder.decode(bytes);

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
