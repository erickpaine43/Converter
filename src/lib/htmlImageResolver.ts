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
 * Resolves every <img> in `container` (mutating the DOM in place), in this
 * order of precedence:
 *   1. data: src (embedded base64) -> left as is.
 *   2. src file name matches one of `auxFiles` -> blob URL.
 *   3. otherwise the src is preloaded as is (with a timeout); if that fails,
 *      the <img> is replaced with a text placeholder ("[Imagen no disponible]",
 *      with the URL shown below it if it was absolute).
 * Used both to update the live preview and, before converting, to hand
 * html2canvas an already-resolved DOM.
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

    if (/^data:/i.test(src)) return; // 1. embedded, unchanged

    const fileName = basename(src);
    const match = fileName
      ? auxFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase())
      : undefined;

    if (match) { // 2. resolved from an attached file
      const blobUrl = URL.createObjectURL(match);
      createdBlobUrls.push(blobUrl);
      img.src = blobUrl;
      return;
    }

    const ok = await preloadImage(src, timeoutMs); // 3. try it as is
    if (!ok) {
      unavailableCount++;
      img.replaceWith(buildPlaceholder(src));
    }
  }));

  return { unavailableCount, createdBlobUrls };
}
