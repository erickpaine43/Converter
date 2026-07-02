import { useRef, useState } from 'react';
import { convertHtmlToPdf } from '../../converters/htmlToPdf';
import type { PaperSize } from '../../converters/htmlToPdf';

export default function HtmlToPdf() {
  const [html, setHtml] = useState('');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleConvert = async () => {
    if (!previewRef.current || !html) return;
    setLoading(true); setError(null);
    try {
      await convertHtmlToPdf(previewRef.current, paperSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al convertir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>HTML a PDF</h2>

      <textarea
        className="html-textarea"
        rows={10}
        placeholder="Pega tu HTML aquí..."
        value={html}
        onChange={e => setHtml(e.target.value)}
      />

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

      {error && <p className="msg-error">{error}</p>}

      <div className="actions-row">
        <button className="btn btn-primary" onClick={handleConvert} disabled={!html || loading}>
          {loading ? 'Convirtiendo...' : 'Convertir a PDF'}
        </button>
      </div>

      {html && (
        <>
          <p className="section-label">Vista previa</p>
          <div ref={previewRef} className="html-preview" dangerouslySetInnerHTML={{ __html: html }} />
        </>
      )}
    </div>
  );
}
