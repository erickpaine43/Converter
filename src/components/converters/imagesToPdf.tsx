import { useEffect, useRef, useState } from 'react';
import { convertImagesToPdf } from '../../converters/imagesToPdf';
import type { PageSize, Orientation } from '../../converters/imagesToPdf';
import { MAX_FILES_IMAGES, validateFiles } from '../../lib/fileLimits';
import { toFriendlyErrorMessage } from '../../lib/errors';
import { ImageIcon } from '../icons';
import ProgressBar from './ProgressBar';

interface ImageItem { file: File; preview: string; }

export default function ImagesToPdf() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('original');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const itemsRef = useRef<ImageItem[]>(items);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach(item => URL.revokeObjectURL(item.preview));
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const validationError = validateFiles(newFiles, { maxCount: MAX_FILES_IMAGES, existingCount: items.length });
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }
    setError(null);
    const newItems = newFiles.map(file => ({
      file, preview: URL.createObjectURL(file),
    }));
    setItems(prev => [...prev, ...newItems]);
    setDownloadUrl(null);
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setItems(next);
  };

  const removeItem = (index: number) => setItems(prev => {
    const target = prev[index];
    if (target) URL.revokeObjectURL(target.preview);
    return prev.filter((_, i) => i !== index);
  });

  const handleConvert = async () => {
    if (!items.length) return;
    setLoading(true); setError(null); setProgress({ done: 0, total: items.length });
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    setDownloadUrl(null);
    try {
      const pdfBytes = await convertImagesToPdf(
        items.map(i => i.file),
        pageSize,
        orientation,
        (done, total) => setProgress({ done, total })
      );
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false); setProgress(null);
    }
  };

  return (
    <div>
      <h2>Imágenes a PDF</h2>

      <label className="file-drop">
        <input type="file" accept="image/jpeg,image/png" multiple onChange={handleFileChange} />
        <div className="file-drop-icon"><ImageIcon /></div>
        <p><span>Selecciona imágenes</span></p>
        <p>JPG, PNG</p>
      </label>

      {items.length > 0 && (
        <>
          <p className="section-label">Orden de páginas</p>
          <div className="image-preview-grid">
            {items.map((item, i) => (
              <div key={i} className="image-preview-item">
                <img src={item.preview} alt={item.file.name} />
                <div className="preview-name">{item.file.name}</div>
                <div className="preview-controls">
                  <button className="icon-btn" onClick={() => moveItem(i, -1)} disabled={i === 0}>↑</button>
                  <button className="icon-btn" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}>↓</button>
                  <button className="icon-btn danger" onClick={() => removeItem(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <p className="section-label">Opciones</p>
          <div className="options-row">
            <div className="option-group">
              <label>Tamaño de página</label>
              <select value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)}>
                <option value="original">Original</option>
                <option value="A4">A4</option>
                <option value="Letter">Carta</option>
              </select>
            </div>
            <div className="option-group">
              <label>Orientación</label>
              <select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)}>
                <option value="portrait">Vertical</option>
                <option value="landscape">Horizontal</option>
              </select>
            </div>
          </div>
        </>
      )}

      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={!items.length || loading}>
          {loading ? 'Convirtiendo...' : 'Convertir a PDF'}
        </button>
        {progress && <ProgressBar done={progress.done} total={progress.total} label="Convirtiendo" />}
        {downloadUrl && (
          <a className="btn btn-download" href={downloadUrl} download="converted.pdf">
            ⬇ Descargar PDF
          </a>
        )}
      </div>
    </div>
  );
}
