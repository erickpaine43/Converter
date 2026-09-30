import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { GUIDES } from '../content/guides';
import { guidePath, pagePath } from '../lib/tools';

export default function GuidesIndex() {
  return (
    <main className="home">
      <SeoHead
        title="Guías para trabajar con PDF"
        description="Guías prácticas para trabajar con PDF: cómo reducir su peso, unirlos sin perder calidad, pasar fotos a PDF, sacar texto de un escaneo y elegir formatos."
        path={pagePath('guides')}
      />
      <h1 className="page-title" style={{ marginTop: '2rem' }}>Guías para trabajar con PDF</h1>
      <p className="page-lead">
        Explicaciones paso a paso para resolver los problemas más comunes con documentos PDF: qué
        hacer, por qué pasa y qué herramientas usar, gratuitas y sin subir tus archivos a ningún servidor.
      </p>
      <ul className="guides-list">
        {GUIDES.map(g => (
          <li key={g.slug}>
            <Link to={guidePath(g.slug)} className="other-tool-link">
              <span className="other-tool-label">{g.h1}</span>
              <span className="other-tool-desc">{g.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
