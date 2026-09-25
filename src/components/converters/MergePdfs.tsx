import { useEffect, useRef, useState } from 'react';
import { MAX_FILES_MERGE, validateFiles } from '../../lib/fileLimits';
import { toFriendlyErrorMessage } from '../../lib/errors';
import { useFileDrop } from '../../lib/useFileDrop';
import { ClipIcon } from '../icons';
import ProgressBar from './ProgressBar';

interface PdfItem { file: File; }

const ACCEPT = 'application/pdf';

export default function MergePdfs() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  // Flujo común del input y del drag & drop. Devuelve false si se rechazó.
  const addFiles = (newFiles: File[]): boolean => {
    const validationError = validateFiles(newFiles, { maxCount: MAX_FILES_MERGE, existingCount: items.length });
    if (validationError) {
      setError(validationError);
      return false;
    }
    setError(null);
    setItems(prev => [...prev, ...newFiles.map(file => ({ file }))]);
    setDownloadUrl(null);
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    if (!addFiles(Array.from(e.target.files))) e.target.value = '';
  };

  const { isDragging, dropProps } = useFileDrop({ onFiles: addFiles, onReject: setError, accept: ACCEPT, multiple: true });

  const moveItem = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setItems(next);
  };

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const handleConvert = async () => {
    if (items.length < 2) return;
    setLoading(true); setError(null); setProgress({ done: 0, total: items.length });
    if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    setDownloadUrl(null);
    try {
      // pdf-lib (~510 KB) se baja recién al unir: si se importara arriba, el
      // widget no aparecería hasta terminar de descargarlo.
      const { mergePdfs } = await import('../../converters/MergePdfs');
      const pdfBytes = await mergePdfs(
        items.map(i => i.file),
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
      <h2>Unir PDFs</h2>

      <label className={`file-drop${isDragging ? ' file-drop--active' : ''}`} {...dropProps}>
        <input type="file" accept={ACCEPT} multiple onChange={handleFileChange} />
        <div className="file-drop-icon"><ClipIcon /></div>
        <p><span>{isDragging ? 'Suelta los PDFs aquí' : 'Selecciona PDFs o arrástralos aquí'}</span></p>
        <p>Puedes agregar más después</p>
      </label>

      {items.length > 0 && (
        <>
          <p className="section-label">Orden de archivos</p>
          {items.map((item, i) => (
            <div key={i} className="file-list-item">
              <span className="file-list-index">{i + 1}.</span>
              <span className="file-name">{item.file.name}</span>
              <span className="file-size">{(item.file.size / 1024).toFixed(0)} KB</span>
              <button className="icon-btn" onClick={() => moveItem(i, -1)} disabled={i === 0}>↑</button>
              <button className="icon-btn" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button className="icon-btn danger" onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}
        </>
      )}

      {items.length === 1 && <p className="msg-info">Agrega al menos 2 PDFs para unir.</p>}
      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={items.length < 2 || loading}>
          {loading ? 'Uniendo...' : `Unir ${items.length > 0 ? items.length : ''} PDFs`}
        </button>
        {progress && <ProgressBar done={progress.done} total={progress.total} label="Uniendo" />}
        {downloadUrl && (
          <a className="btn btn-download" href={downloadUrl} download="merged.pdf">
            ⬇ Descargar PDF unido
          </a>
        )}
      </div>
    </div>
  );
}
