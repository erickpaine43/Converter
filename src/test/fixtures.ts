import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import zlib from 'node:zlib';

export function toFile(bytes: Uint8Array | string, name: string, type: string): File {
  const body = typeof bytes === 'string' ? bytes : new Uint8Array(bytes);
  return new File([body as BlobPart], name, { type });
}

interface MakePdfOptions {
  pageTexts?: string[]; // un elemento por página; si se omite, la página queda en blanco
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

// pdfjs-dist (como la mayoría de los lectores PDF) escanea buscando "%PDF-" en vez
// de exigirlo estrictamente en el byte 0, así que dañar solo el header no alcanza
// para forzar un error real de parseo. Corrompemos en cambio el tramo final del
// archivo, donde vive la tabla xref/trailer que pdfjs sí necesita para poder leerlo.
export function corruptPdfTail(bytes: Uint8Array): Uint8Array {
  const copy = new Uint8Array(bytes);
  const tailStart = Math.floor(copy.length * 0.7);
  for (let i = tailStart; i < copy.length; i++) copy[i] = 0x00;
  return copy;
}

// PNG 1x1 real (fucsia), suficiente para pdf-lib.embedPng.
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// JPEG 1x1 real (blanco), suficiente para pdf-lib.embedJpg.
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

// --- Encoder PNG mínimo (sin dependencias), para poder generar imágenes de un
// tamaño exacto y así verificar orden/dimensiones reales en los tests de salida. ---

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

/** Genera un PNG RGB de color sólido, real y válido, del tamaño exacto pedido. */
export function makeSolidPngBytes(width: number, height: number, rgbColor: [number, number, number] = [255, 0, 255]): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, width);
  ihdrView.setUint32(4, height);
  ihdrData[8] = 8; // profundidad de bits
  ihdrData[9] = 2; // color type: RGB
  const ihdr = pngChunk('IHDR', ihdrData);

  const rowBytes = width * 3;
  const raw = new Uint8Array((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // sin filtro
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
