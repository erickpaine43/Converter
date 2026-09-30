import { useEffect, useMemo, useRef, useState } from 'react';
import DOMPurify from 'dompurify';
import { convertHtmlToPdf } from '../../converters/htmlToPdf';
import type { PaperSize } from '../../converters/htmlToPdf';
import { resolveHtmlImages } from '../../lib/htmlImageResolver';
import { MAX_HTML_LENGTH, validateFiles } from '../../lib/fileLimits';
import { AppError, toFriendlyErrorMessage } from '../../lib/errors';
import { decodeHtmlBytes } from '../../lib/htmlEncoding';
import { useFileDrop } from '../../lib/useFileDrop';
import { CodeIcon } from '../icons';
import ProgressBar from './ProgressBar';

type Mode = 'upload' | 'paste';

const HTML_EXTENSION_RE = /\.html?$/i;
const IMAGE_EXTENSION_RE = /\.(jpe?g|png|gif|webp)$/i;

export default function HtmlToPdf() {
  const [mode, setMode] = useState<Mode>('upload');
  const [html, setHtml] = useState('');
  const [htmlFileName, setHtmlFileName] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [unavailableImageCount, setUnavailableImageCount] = useState(0);
  const [resolvingImages, setResolvingImages] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageBlobUrlsRef = useRef<string[]>([]);

  const safeHtml = useMemo(() => DOMPurify.sanitize(html), [html]);
  // Memoized by reference (not just the string): dangerouslySetInnerHTML compares
  // the IDENTITY of the {__html} object between renders, not its content. An
  // inline object literal is recreated on every render, so React would reapply
  // innerHTML = safeHtml on EVERY re-render (e.g. when resolvingImages or
  // unavailableImageCount change below), wiping out resolveHtmlImages' mutations
  // (blobs/placeholders) right after they finish.
  const previewHtml = useMemo(() => ({ __html: safeHtml }), [safeHtml]);

  const revokeImageBlobUrls = () => {
    imageBlobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    imageBlobUrlsRef.current = [];
  };

  // Resolves the preview's <img> elements (base64 / attached file / "unavailable"
  // placeholder) whenever the HTML or the attached images change, so the
  // "N images unavailable" notice and the preview show the final result BEFORE
  // the user clicks "Convertir a PDF".
  useEffect(() => {
    const container = previewRef.current;
    if (!container || !html) {
      revokeImageBlobUrls();
      setUnavailableImageCount(0);
      setResolvingImages(false);
      return;
    }

    let cancelled = false;
    setResolvingImages(true);
    // Manually reset to the clean sanitized HTML: if only the attached images
    // changed (not the html), React won't touch this node again because the
    // __html string is the same, and without this reset we'd reprocess <img>
    // elements already replaced by blobs/placeholders in a previous pass.
    container.innerHTML = safeHtml;
    revokeImageBlobUrls();

    resolveHtmlImages(container, imageFiles)
      .then(({ unavailableCount, createdBlobUrls }) => {
        if (cancelled) {
          createdBlobUrls.forEach(url => URL.revokeObjectURL(url));
          return;
        }
        imageBlobUrlsRef.current = createdBlobUrls;
        setUnavailableImageCount(unavailableCount);
      })
      .finally(() => {
        if (!cancelled) setResolvingImages(false);
      });

    return () => { cancelled = true; };
  }, [html, safeHtml, imageFiles]);

  useEffect(() => () => revokeImageBlobUrls(), []);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setHtml('');
    setHtmlFileName(null);
    setImageFiles([]);
    setError(null);
  };

  // Shared flow for the file input and drag & drop. Returns false if rejected.
  const addFiles = (files: File[]): boolean => {
    if (!files.length) return true;

    const htmlCandidates = files.filter(f => HTML_EXTENSION_RE.test(f.name));
    const imageCandidates = files.filter(f => IMAGE_EXTENSION_RE.test(f.name));

    if (htmlCandidates.length === 0) {
      setError('Tienes que incluir un archivo .html o .htm en la selección.');
      return false;
    }
    if (htmlCandidates.length > 1) {
      setError('Solo se puede subir un archivo .html o .htm por conversión.');
      return false;
    }

    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setError(null);
    const mainFile = htmlCandidates[0];
    // Read the raw bytes (not readAsText, which assumes UTF-8) so the charset
    // declared by the HTML itself (e.g. windows-1252) can be honored.
    mainFile.arrayBuffer().then(
      buffer => {
        const text = decodeHtmlBytes(buffer);
        if (!text.trim()) {
          setError('El archivo está vacío.');
          return;
        }
        setHtml(text);
        setHtmlFileName(mainFile.name);
        setImageFiles(imageCandidates);
      },
      () => {
        setError(toFriendlyErrorMessage(new AppError('No se pudo leer el archivo. Inténtalo de nuevo.')));
      }
    );
    return true;
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!addFiles(Array.from(e.target.files ?? []))) e.target.value = '';
  };

  const { isDragging, dropProps } = useFileDrop({ onFiles: addFiles, onReject: setError, multiple: true });

  const handleRemoveFiles = () => {
    setHtml('');
    setHtmlFileName(null);
    setImageFiles([]);
    setError(null);
  };

  const handleConvert = async () => {
    if (!previewRef.current || !html) return;
    if (html.length > MAX_HTML_LENGTH) {
      setError(`El HTML supera el límite de ${Math.round(MAX_HTML_LENGTH / 1000)} KB. Reduce el contenido e inténtalo de nuevo.`);
      return;
    }
    setLoading(true); setError(null); setProgress(null);
    try {
      await convertHtmlToPdf(previewRef.current, paperSize, (done, total) => setProgress({ done, total }));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false); setProgress(null);
    }
  };

  return (
    <div>
      <h2>HTML a PDF</h2>

      <div className="mode-toggle" role="tablist" aria-label="Cómo cargar el HTML">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'upload'}
          className={`mode-toggle-btn ${mode === 'upload' ? 'active' : ''}`}
          onClick={() => switchMode('upload')}
        >
          Subir archivo
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'paste'}
          className={`mode-toggle-btn ${mode === 'paste' ? 'active' : ''}`}
          onClick={() => switchMode('paste')}
        >
          Pegar código
        </button>
      </div>

      {mode === 'upload' ? (
        <>
          <label className={`file-drop${isDragging ? ' file-drop--active' : ''}`} {...dropProps}>
            <input
              type="file"
              multiple
              accept=".html,.htm,text/html,.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFilesChange}
            />
            <div className="file-drop-icon"><CodeIcon /></div>
            <p><span>{isDragging ? 'Suelta los archivos aquí' : 'Selecciona un archivo HTML o arrástralo aquí'}</span></p>
            <p>.html, .htm — puedes incluir además sus imágenes (.jpg, .png, .gif, .webp)</p>
          </label>
          {htmlFileName && (
            <div className="file-list-item">
              <span className="file-name">
                {htmlFileName}
                {imageFiles.length > 0 && ` + ${imageFiles.length} imagen${imageFiles.length === 1 ? '' : 'es'} adjunta${imageFiles.length === 1 ? '' : 's'}`}
              </span>
              <button className="icon-btn danger" onClick={handleRemoveFiles} aria-label="Quitar archivo">✕</button>
            </div>
          )}
        </>
      ) : (
        <textarea
          className="html-textarea"
          rows={10}
          placeholder="Pega tu HTML aquí..."
          value={html}
          onChange={e => setHtml(e.target.value)}
        />
      )}

      <p className="section-label">Opciones</p>
      <div className="options-row">
        <div className="option-group">
          <label>Tamaño de página</label>
          <select value={paperSize} onChange={e => setPaperSize(e.target.value as PaperSize)}>
            <option value="A4">A4</option>
            <option value="Letter">Carta</option>
            <option value="auto">Automático</option>
          </select>
        </div>
      </div>

      {unavailableImageCount > 0 && (
        <p className="msg-info">
          {unavailableImageCount} imagen(es) no se pudieron cargar y se reemplazarán por un aviso de texto en el PDF.
        </p>
      )}

      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={!html || loading || resolvingImages}>
          {loading ? 'Convirtiendo...' : resolvingImages ? 'Revisando imágenes...' : 'Convertir a PDF'}
        </button>
        {progress && <ProgressBar done={progress.done} total={progress.total} label="Generando páginas" />}
      </div>

      {html && (
        <>
          <p className="section-label">Vista previa</p>
          <div ref={previewRef} className="html-preview" dangerouslySetInnerHTML={previewHtml} />
        </>
      )}
    </div>
  );
}
