import { useState } from 'react';
import { convertPdfToImages } from '../../converters/pdfToImages';
import type { ImageFormat, ImageQuality } from '../../converters/pdfToImages';
import { validateFiles } from '../../lib/fileLimits';
import { toFriendlyErrorMessage } from '../../lib/errors';
import { DocumentArrowIcon } from '../icons';
import ProgressBar from './ProgressBar';

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<ImageQuality>(2);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true); setError(null); setImages([]); setProgress(null);
    try {
      setImages(await convertPdfToImages(file, format, quality, (done, total) => setProgress({ done, total })));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false); setProgress(null);
    }
  };

  const downloadAll = () => {
    images.forEach((src, i) => {
      const a = document.createElement('a');
      a.href = src; a.download = `pagina-${i + 1}.${format}`; a.click();
    });
  };

  return (
    <div>
      <h2>PDF a Imágenes</h2>

      <label className="file-drop">
        <input type="file" accept="application/pdf"
          onChange={e => {
            const f = e.target.files?.[0] ?? null;
            if (f) {
              const validationError = validateFiles([f]);
              if (validationError) {
                setError(validationError);
                setFile(null);
                e.target.value = '';
                return;
              }
            }
            setError(null);
            setFile(f); setImages([]);
          }} />
        <div className="file-drop-icon"><DocumentArrowIcon /></div>
        <p><span>Selecciona un PDF</span></p>
        {file && <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>{file.name}</p>}
      </label>

      <p className="section-label">Opciones</p>
      <div className="options-row">
        <div className="option-group">
          <label>Formato</label>
          <select value={format} onChange={e => setFormat(e.target.value as ImageFormat)}>
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
          </select>
        </div>
        <div className="option-group">
          <label>Calidad</label>
          <select value={quality} onChange={e => setQuality(Number(e.target.value) as ImageQuality)}>
            <option value={1}>Baja</option>
            <option value={2}>Media</option>
            <option value={3}>Alta</option>
          </select>
        </div>
      </div>

      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={!file || loading}>
          {loading ? 'Convirtiendo...' : 'Convertir'}
        </button>
        {progress && <ProgressBar done={progress.done} total={progress.total} label="Convirtiendo" />}
        {images.length > 0 && (
          <button className="btn btn-download" onClick={downloadAll}>
            ⬇ Descargar todas ({images.length})
          </button>
        )}
      </div>

      {images.length > 0 && (
        <div className="results-grid">
          {images.map((src, i) => (
            <div key={i} className="result-card">
              <img src={src} alt={`Página ${i + 1}`} />
              <div className="result-card-footer">
                <a href={src} download={`pagina-${i + 1}.${format}`}>
                  ⬇ Página {i + 1}
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
