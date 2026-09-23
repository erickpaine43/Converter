import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
import { vi } from 'vitest';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// El polyfill de URL.createObjectURL que trae Vitest para jsdom espera Blobs creados
// con SU PROPIO constructor interno (lee un campo privado `_buffer`); un Blob nativo
// de jsdom (como el que crea nuestro código real) lo hace explotar con
// "Cannot read properties of undefined (reading '_buffer')". No es un bug de la app
// -en un navegador real esto funciona sin problema-, así que lo reemplazamos acá por
// un mock liviano y determinístico, suficiente para probar nuestra propia lógica
// (que se llame, que el link de descarga tenga una URL, que se revoque al desmontar).
let objectUrlCounter = 0;
URL.createObjectURL = vi.fn(() => `blob:mock-url-${objectUrlCounter++}`);
URL.revokeObjectURL = vi.fn(() => {});

// El contexto vm de jsdom tiene sus propios intrínsecos (Uint8Array, etc.), separados
// de los de Node. pdfjs-dist usa `Uint8Array.prototype.toHex` (ES2024) para hashear;
// si el realm de jsdom no lo trae todavía, lo poliriamos acá.
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

// jsdom no ejecuta carga real de recursos: asignar `new Image().src` nunca dispara
// load/error por sí solo, lo que haría que cualquier <img> de un HTML de prueba
// cuelgue hasta el timeout real de 5s de resolveHtmlImages (HtmlToPdf). Por defecto
// la reemplazamos acá por una versión que falla rápido (microtask); los tests que
// necesitan simular una carga exitosa/controlada reemplazan globalThis.Image puntualmente
// y lo restauran en su propio afterEach.
class FastFailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    queueMicrotask(() => this.onerror?.());
  }
}
globalThis.Image = FastFailingImage as unknown as typeof Image;

import * as pdfjsLib from 'pdfjs-dist';

// Los converters fijan GlobalWorkerOptions.workerSrc con `new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`.
// Bajo Vitest, import.meta.url de nuestros propios módulos es una URL http: servida por vite-node,
// y Node no puede hacer `import()` de esa URL para levantar el fake worker. Acá la reemplazamos
// por la ruta real en disco (como file:// URL, requerido en Windows), ignorando cualquier
// intento posterior de pisarla.
const require = createRequire(import.meta.url);
const realWorkerPath = pathToFileURL(require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')).toString();

Object.defineProperty(pdfjsLib.GlobalWorkerOptions, 'workerSrc', {
  configurable: true,
  get() {
    return realWorkerPath;
  },
  set() {
    // ignorado a propósito
  },
});
