import { afterEach, describe, expect, it } from 'vitest';
import { resolveHtmlImages } from './htmlImageResolver';

// jsdom no ejecuta carga real de recursos (setear img.src no dispara load/error
// para una URL http real), así que para probar los caminos de éxito/fallo del
// precargador reemplazamos window.Image por una versión que dispara el evento
// que le pidamos de forma inmediata (microtask), en vez de depender de red real
// o de esperar el timeout real de 5s.
class ImmediateImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static fail = false;
  set src(_value: string) {
    queueMicrotask(() => {
      if (ImmediateImage.fail) this.onerror?.();
      else this.onload?.();
    });
  }
}

class HangingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) { /* nunca dispara load ni error: fuerza el timeout */ }
}

function makeContainer(html: string): HTMLDivElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  return el;
}

describe('resolveHtmlImages', () => {
  const OriginalImage = globalThis.Image;
  afterEach(() => {
    globalThis.Image = OriginalImage;
  });

  it('imagen embebida en base64: se deja intacta, sin precargar nada', async () => {
    const container = makeContainer('<img src="data:image/png;base64,AAAA">');
    const { unavailableCount } = await resolveHtmlImages(container, []);
    expect(unavailableCount).toBe(0);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
  });

  it('imagen resuelta vía archivo subido: el nombre de archivo coincide con el src y se muestra normal (blob URL)', async () => {
    const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
    const container = makeContainer('<img src="images/foto.jpg">');
    const { unavailableCount, createdBlobUrls } = await resolveHtmlImages(container, [file]);

    expect(unavailableCount).toBe(0);
    expect(createdBlobUrls).toHaveLength(1);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.src).toBe(createdBlobUrls[0]);
  });

  it('el match de archivo por nombre es case-insensitive', async () => {
    const file = new File(['contenido'], 'Foto.JPG', { type: 'image/jpeg' });
    const container = makeContainer('<img src="foto.jpg">');
    const { unavailableCount, createdBlobUrls } = await resolveHtmlImages(container, [file]);
    expect(unavailableCount).toBe(0);
    expect(createdBlobUrls).toHaveLength(1);
  });

  it('imagen con src absoluto (http) que falla: aparece el recuadro CON la URL visible', async () => {
    ImmediateImage.fail = true;
    globalThis.Image = ImmediateImage as unknown as typeof Image;

    const container = makeContainer('<img src="https://ejemplo.com/foto.png">');
    const { unavailableCount } = await resolveHtmlImages(container, []);

    expect(unavailableCount).toBe(1);
    expect(container.querySelector('img')).toBeNull();
    const placeholder = container.querySelector('.html-image-missing');
    expect(placeholder?.textContent).toContain('[Imagen no disponible]');
    expect(container.querySelector('.html-image-missing-url')?.textContent).toBe('https://ejemplo.com/foto.png');
  });

  it('imagen con src relativo sin resolver: aparece el recuadro SIN URL', async () => {
    ImmediateImage.fail = true;
    globalThis.Image = ImmediateImage as unknown as typeof Image;

    const container = makeContainer('<img src="assets/foto.png">');
    const { unavailableCount } = await resolveHtmlImages(container, []);

    expect(unavailableCount).toBe(1);
    expect(container.querySelector('.html-image-missing-url')).toBeNull();
    expect(container.querySelector('.html-image-missing')?.textContent).toBe('[Imagen no disponible]');
  });

  it('imagen con src absoluto que SÍ carga: se deja como <img> normal, sin reemplazo', async () => {
    ImmediateImage.fail = false;
    globalThis.Image = ImmediateImage as unknown as typeof Image;

    const container = makeContainer('<img src="https://ejemplo.com/ok.png">');
    const { unavailableCount } = await resolveHtmlImages(container, []);

    expect(unavailableCount).toBe(0);
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('.html-image-missing')).toBeNull();
  });

  it('timeout (nunca dispara load ni error) se trata como fallo', async () => {
    globalThis.Image = HangingImage as unknown as typeof Image;
    const container = makeContainer('<img src="https://ejemplo.com/lenta.png">');
    const { unavailableCount } = await resolveHtmlImages(container, [], 30);
    expect(unavailableCount).toBe(1);
    expect(container.querySelector('.html-image-missing')).not.toBeNull();
  });

  it('el aviso "N imágenes no disponibles" corresponde al conteo real: mezcla de ok/rotas/base64/blob', async () => {
    ImmediateImage.fail = true;
    globalThis.Image = ImmediateImage as unknown as typeof Image;
    const file = new File(['x'], 'ok.jpg', { type: 'image/jpeg' });

    const container = makeContainer(`
      <img src="data:image/png;base64,AAAA">
      <img src="ok.jpg">
      <img src="https://ejemplo.com/rota1.png">
      <img src="rota2.png">
    `);
    const { unavailableCount } = await resolveHtmlImages(container, [file]);
    expect(unavailableCount).toBe(2);
  });

  it('sin imágenes en el HTML, el conteo de no disponibles es 0', async () => {
    const container = makeContainer('<p>Sin imágenes acá.</p>');
    const { unavailableCount } = await resolveHtmlImages(container, []);
    expect(unavailableCount).toBe(0);
  });
});
