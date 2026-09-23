const DEFAULT_TIMEOUT_MS = 5000;

export interface ImageResolutionResult {
  unavailableCount: number;
  createdBlobUrls: string[];
}

function basename(src: string): string {
  const withoutQueryOrHash = src.split(/[?#]/)[0];
  const segments = withoutQueryOrHash.split('/');
  const last = segments[segments.length - 1] ?? '';
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function preloadImage(src: string, timeoutMs: number): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => { clearTimeout(timer); finish(true); };
    img.onerror = () => { clearTimeout(timer); finish(false); };
    img.src = src;
  });
}

function buildPlaceholder(originalSrc: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'html-image-missing';

  const label = document.createElement('span');
  label.textContent = '[Imagen no disponible]';
  wrapper.appendChild(label);

  if (/^https?:\/\//i.test(originalSrc)) {
    const urlLine = document.createElement('div');
    urlLine.className = 'html-image-missing-url';
    urlLine.textContent = originalSrc;
    wrapper.appendChild(urlLine);
  }

  return wrapper;
}

/**
 * Resuelve cada <img> de `container` (mutando el DOM in place), en este orden
 * de prioridad:
 *   1. src data: (embebida en base64) -> se deja tal cual.
 *   2. nombre de archivo del src coincide con alguno de `auxFiles` -> blob URL.
 *   3. si no, se precarga el src tal cual (con timeout); si falla, se reemplaza
 *      el <img> por un placeholder de texto ("[Imagen no disponible]", con la
 *      URL visible debajo si era absoluta).
 * Se usa tanto para actualizar la vista previa en vivo como, antes de
 * convertir, para dejar el DOM que le llega a html2canvas ya resuelto.
 */
export async function resolveHtmlImages(
  container: HTMLElement,
  auxFiles: File[],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<ImageResolutionResult> {
  const images = Array.from(container.querySelectorAll('img'));
  let unavailableCount = 0;
  const createdBlobUrls: string[] = [];

  await Promise.all(images.map(async img => {
    const src = img.getAttribute('src') ?? '';
    if (!src) return;

    if (/^data:/i.test(src)) return; // 1. embebida, sin cambios

    const fileName = basename(src);
    const match = fileName
      ? auxFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase())
      : undefined;

    if (match) { // 2. resuelto con un archivo adjunto
      const blobUrl = URL.createObjectURL(match);
      createdBlobUrls.push(blobUrl);
      img.src = blobUrl;
      return;
    }

    const ok = await preloadImage(src, timeoutMs); // 3. probar tal cual
    if (!ok) {
      unavailableCount++;
      img.replaceWith(buildPlaceholder(src));
    }
  }));

  return { unavailableCount, createdBlobUrls };
}
