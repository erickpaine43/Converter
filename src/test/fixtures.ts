import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import zlib from 'node:zlib';

export function toFile(bytes: Uint8Array | string, name: string, type: string): File {
  const body = typeof bytes === 'string' ? bytes : new Uint8Array(bytes);
  return new File([body as BlobPart], name, { type });
}

interface MakePdfOptions {
  pageTexts?: string[]; // one entry per page; if omitted, the page is blank
  pageSize?: [number, number];
}

export async function makePdfBytes(numPages: number, opts: MakePdfOptions = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const [w, h] = opts.pageSize ?? [200, 300];

  for (let i = 0; i < numPages; i++) {
    const page = doc.addPage([w, h]);
    const text = opts.pageTexts?.[i];
    if (text) {
      page.drawText(text, { x: 20, y: h - 40, size: 14, font, color: rgb(0, 0, 0) });
    }
  }

  return doc.save();
}

export async function makePdfFile(name: string, numPages: number, opts: MakePdfOptions = {}): Promise<File> {
  const bytes = await makePdfBytes(numPages, opts);
  return toFile(bytes, name, 'application/pdf');
}

export function truncatePdf(bytes: Uint8Array): Uint8Array {
  return bytes.slice(0, Math.floor(bytes.length / 2));
}

// pdfjs-dist (like most PDF readers) scans for "%PDF-" instead of strictly
// requiring it at byte 0, so damaging only the header isn't enough to force a
// real parse error. Instead we corrupt the end of the file, where the
// xref/trailer table that pdfjs does need lives.
export function corruptPdfTail(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes);
  const tailStart = Math.floor(copy.length * 0.7);
  for (let i = tailStart; i < copy.length; i++) copy[i] = 0x00;
  return copy;
}

// Real 1x1 PNG (magenta), enough for pdf-lib.embedPng.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Real 1x1 JPEG (white), enough for pdf-lib.embedJpg.
const JPEG_1X1_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==';

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function makePngFile(name = 'image.png'): File {
  return toFile(base64ToBytes(PNG_1X1_BASE64), name, 'image/png');
}

export function makeJpegFile(name = 'image.jpg'): File {
  return toFile(base64ToBytes(JPEG_1X1_BASE64), name, 'image/jpeg');
}

// --- Minimal PNG encoder (no dependencies), to generate images of an exact
// size and check real order/dimensions in the output tests. ---

const CRC_TABLE = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const out = new Uint8Array(4 + 4 + data.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  const crcInput = new Uint8Array(4 + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, 4);
  view.setUint32(8 + data.length, crc32(crcInput));
  return out;
}

/** Generates a real, valid solid-color RGB PNG of exactly the requested size. */
export function makeSolidPngBytes(width: number, height: number, rgbColor: [number, number, number] = [255, 0, 255]): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  const ihdr = pngChunk('IHDR', ihdrData);

  const rowBytes = width * 3;
  const raw = new Uint8Array((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < width; x++) {
      raw[rowStart + 1 + x * 3] = rgbColor[0];
      raw[rowStart + 1 + x * 3 + 1] = rgbColor[1];
      raw[rowStart + 1 + x * 3 + 2] = rgbColor[2];
    }
  }
  const idat = pngChunk('IDAT', new Uint8Array(zlib.deflateSync(raw)));
  const iend = pngChunk('IEND', new Uint8Array(0));

  const out = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  out.set(signature, offset); offset += signature.length;
  out.set(ihdr, offset); offset += ihdr.length;
  out.set(idat, offset); offset += idat.length;
  out.set(iend, offset);
  return out;
}

export function makeSolidPngFile(width: number, height: number, name = 'image.png', rgbColor?: [number, number, number]): File {
  return toFile(makeSolidPngBytes(width, height, rgbColor), name, 'image/png');
}
