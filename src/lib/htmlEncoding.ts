// How many leading bytes are scanned for <meta charset>: the HTML standard's
// encoding-sniffing prescan looks at the first 1024.
const PRESCAN_BYTES = 1024;

const META_CHARSET_RE = /<meta\b[^>]*?\bcharset\s*=\s*["']?\s*([\w.:-]+)/i;

/**
 * Finds the charset declared in the HTML itself, in either form:
 *   <meta charset="windows-1252">
 *   <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
 * Returns the label as written (not normalized), or null if there is none.
 */
export function sniffDeclaredCharset(bytes: Uint8Array): string | null {
  // latin1 maps each byte to one character, so it can read the <meta>'s ASCII
  // regardless of the encoding used by the rest of the file.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, PRESCAN_BYTES));
  return head.match(META_CHARSET_RE)?.[1] ?? null;
}

function bomEncoding(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return 'utf-8';
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return 'utf-16le';
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return 'utf-16be';
  return null;
}

/** TextDecoder for the given label, or null if the browser doesn't recognize it. */
function decoderFor(label: string): TextDecoder | null {
  try {
    const decoder = new TextDecoder(label);
    // Same as browsers: a <meta> claiming UTF-16 can't be right (it was just
    // read as ASCII), so it's treated as UTF-8.
    return decoder.encoding.startsWith('utf-16') ? new TextDecoder('utf-8') : decoder;
  } catch {
    return null;
  }
}

/**
 * Decodes an HTML file's bytes using its actual encoding, in this order of
 * precedence (the same one browsers use):
 *   1. BOM at the start of the file.
 *   2. charset declared in a <meta> (e.g. HTML exported from Word: windows-1252).
 *   3. UTF-8. If the bytes are NOT valid UTF-8 (an old file with no <meta>),
 *      instead of returning text full of "�" it falls back to windows-1252,
 *      which is what browsers do in that case for Spanish content.
 */
export function decodeHtmlBytes(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const bom = bomEncoding(bytes);
  if (bom) return new TextDecoder(bom).decode(bytes); // TextDecoder strips the BOM

  const declared = sniffDeclaredCharset(bytes);
  const declaredDecoder = declared ? decoderFor(declared) : null;
  if (declaredDecoder) return declaredDecoder.decode(bytes);

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}
