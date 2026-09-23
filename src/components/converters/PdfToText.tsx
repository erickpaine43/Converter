import { useState } from 'react';
import { convertPdfToText, getPdfPageCount } from '../../converters/pdfToText';
import { validateFiles } from '../../lib/fileLimits';
import { toFriendlyErrorMessage } from '../../lib/errors';
import { DocumentTextIcon } from '../icons';
import ProgressBar from './ProgressBar';

export default function PdfToText() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [fromPage, setFromPage] = useState(1);
  const [toPage, setToPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f) {
      const validationError = validateFiles([f]);
      if (validationError) {
        setError(validationError);
        setFile(null); setText(null);
        e.target.value = '';
        return;
      }
    }
    setError(null);
    setFile(f); setText(null); setPageCount(0);
    if (f) {
      try {
        const count = await getPdfPageCount(f);
        setPageCount(count); setFromPage(1); setToPage(count);
      } catch (err) {
        setError(toFriendlyErrorMessage(err));
        setFile(null);
      }
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true); setError(null); setText(null); setProgress(null);
    try {
      setText(await convertPdfToText(file, fromPage, toPage, (done, total) => setProgress({ done, total })));
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setLoading(false); setProgress(null);
    }
  };

  const handleDownload = () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'extracted.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2>PDF a Texto</h2>

      <label className="file-drop">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <div className="file-drop-icon"><DocumentTextIcon /></div>
        <p><span>Selecciona un PDF</span></p>
        {file && <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>{file.name} — {pageCount} página(s)</p>}
      </label>

      {pageCount > 0 && (
        <>
          <p className="section-label">Rango de páginas</p>
          <div className="options-row">
            <div className="option-group">
              <label>Desde</label>
              <input type="number" min={1} max={toPage} value={fromPage}
                onChange={e => setFromPage(Math.max(1, Math.min(Number(e.target.value), toPage)))}
                style={{ width: 70 }} />
            </div>
            <div className="option-group">
              <label>Hasta</label>
              <input type="number" min={fromPage} max={pageCount} value={toPage}
                onChange={e => setToPage(Math.max(fromPage, Math.min(Number(e.target.value), pageCount)))}
                style={{ width: 70 }} />
            </div>
            <div className="option-group" style={{ justifyContent: 'flex-end' }}>
              <label>&nbsp;</label>
              <span className="msg-info" style={{ margin: 0 }}>{toPage - fromPage + 1} página(s)</span>
            </div>
          </div>
        </>
      )}

      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={!file || loading}>
          {loading ? 'Extrayendo...' : 'Extraer Texto'}
        </button>
        {progress && <ProgressBar done={progress.done} total={progress.total} label="Extrayendo" />}
        {text && (
          <button className="btn btn-download" onClick={handleDownload}>
            ⬇ Descargar .txt
          </button>
        )}
      </div>

      {text && <pre className="text-preview">{text}</pre>}
    </div>
  );
}
