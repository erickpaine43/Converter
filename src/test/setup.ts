import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
import { vi } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// The URL.createObjectURL polyfill Vitest ships for jsdom expects Blobs created
// with ITS OWN internal constructor (it reads a private `_buffer` field); a native
// jsdom Blob (like the one our real code creates) makes it throw
// "Cannot read properties of undefined (reading '_buffer')". Not an app bug (it
// works fine in a real browser), so it's replaced here with a small deterministic
// mock, enough to test our own logic (that it's called, that the download link
// gets a URL, that it's revoked on unmount).
let objectUrlCounter = 0;
URL.createObjectURL = vi.fn(() => `blob:mock-url-${objectUrlCounter++}`);
URL.revokeObjectURL = vi.fn(() => {});

// jsdom's vm context has its own intrinsics (Uint8Array, etc.), separate from
// Node's. pdfjs-dist uses `Uint8Array.prototype.toHex` (ES2024) for hashing; if
// jsdom's realm doesn't have it yet, it's polyfilled here.
if (typeof Uint8Array.prototype.toHex !== 'function') {
  Object.defineProperty(Uint8Array.prototype, 'toHex', {
    configurable: true,
    writable: true,
    value(this: Uint8Array) {
      let hex = '';
      for (let i = 0; i < this.length; i++) hex += this[i].toString(16).padStart(2, '0');
      return hex;
    },
  });
}

// jsdom doesn't actually load resources: setting `new Image().src` never fires
// load/error on its own, so any <img> in a test HTML would hang until
// resolveHtmlImages' real 5s timeout (HtmlToPdf). By default it's replaced here
// with a version that fails fast (in a microtask); tests that need a successful
// or controlled load swap globalThis.Image themselves and restore it in their
// own afterEach.
class FastFailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}
globalThis.Image = FastFailingImage as unknown as typeof Image;

import * as pdfjsLib from 'pdfjs-dist';

// The converters set GlobalWorkerOptions.workerSrc with `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`.
// Under Vitest, import.meta.url of our own modules is an http: URL served by vite-node,
// and Node can't `import()` that URL to spin up the fake worker. It's replaced here with
// the real path on disk (as a file:// URL, required on Windows), and any later attempt
// to overwrite it is ignored.
const require = createRequire(import.meta.url);
const realWorkerPath = pathToFileURL(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')).toString();

Object.defineProperty(pdfjsLib.GlobalWorkerOptions, 'workerSrc', {
  configurable: true,
  get() {
    return realWorkerPath;
  },
  set() {
    // intentionally ignored
  },
});
