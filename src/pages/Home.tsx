import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import JsonLd from '../components/JsonLd';
import { LOGO_URL, SITE_NAME, canonicalUrl } from '../lib/site';
import { TOOL_LABELS, TOOL_SHORT_DESCS, toolPath, type ToolId } from '../lib/tools';
import {
  ClipIcon, ImageIcon, CodeIcon, DocumentArrowIcon, DocumentTextIcon,
  LockIcon, BoltIcon, TagIcon, ShieldCheckIcon,
} from '../components/icons';

const featuredTool: { id: ToolId; Icon: typeof ClipIcon; desc: string } = {
  id: 'merge-pdfs', Icon: ClipIcon,
  desc: 'Combina varios archivos PDF en un único documento, en el orden que definas. La herramienta más usada para armar reportes y expedientes.',
};

const secondaryTools: { id: ToolId; Icon: typeof ClipIcon }[] = [
  { id: 'images-to-pdf', Icon: ImageIcon },
  { id: 'html-to-pdf',   Icon: CodeIcon },
  { id: 'pdf-to-images', Icon: DocumentArrowIcon },
  { id: 'pdf-to-text',   Icon: DocumentTextIcon },
];

const features = [
  { Icon: LockIcon, title: 'Privado', desc: 'Todo se procesa en tu navegador. Tus archivos nunca se suben a ningún servidor.' },
  { Icon: BoltIcon, title: 'Rápido', desc: 'Sin colas de espera ni subidas a servidores: la conversión ocurre directamente en tu dispositivo.' },
  { Icon: TagIcon, title: 'Gratis', desc: 'Sin registro, sin suscripciones. Todas las herramientas son 100% gratuitas.' },
];

export default function Home() {
  return (
    <main className="home">
      <SeoHead
        title="Herramientas PDF Gratis Online sin Registro"
        description="Une PDFs, convierte imágenes a PDF, pasa un PDF a imágenes o a texto y convierte HTML a PDF. Gratis, sin registro y sin subir tus archivos a ningún servidor."
        path="/"
      />
      <JsonLd data={{
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${canonicalUrl('/')}#organization`,
            name: SITE_NAME,
            url: canonicalUrl('/'),
            logo: LOGO_URL,
          },
          {
            '@type': 'WebSite',
            '@id': `${canonicalUrl('/')}#website`,
            name: SITE_NAME,
            url: canonicalUrl('/'),
            inLanguage: 'es',
            publisher: { '@id': `${canonicalUrl('/')}#organization` },
          },
        ],
      }} />

      <section className="hero">
        <h1 className="hero-title">Herramientas PDF para tu negocio</h1>
        <p className="hero-subtitle">Convertí, unificá y extraé contenido de tus documentos directamente en el navegador. Sin registro, sin suscripciones — gratis para uso normal.</p>
        <span className="hero-trust">
          <ShieldCheckIcon width={16} height={16} />
          <span>100% en tu navegador — ningún archivo se sube a un servidor</span>
        </span>
      </section>

      <div className="tools-grid">
        <Link to={toolPath(featuredTool.id)} className="tool-card tool-card--featured">
          <span className="tool-card-badge">Más usada</span>
          <div className="tool-card-icon"><featuredTool.Icon /></div>
          <div className="tool-card-label">{TOOL_LABELS[featuredTool.id]}</div>
          <div className="tool-card-desc">{featuredTool.desc}</div>
        </Link>

        {secondaryTools.map(tool => (
          <Link key={tool.id} to={toolPath(tool.id)} className="tool-card">
            <div className="tool-card-icon"><tool.Icon /></div>
            <div className="tool-card-label">{TOOL_LABELS[tool.id]}</div>
            <div className="tool-card-desc">{TOOL_SHORT_DESCS[tool.id]}</div>
          </Link>
        ))}
      </div>

      <div className="features-section">
        {features.map(f => (
          <div key={f.title} className="feature-item">
            <div className="feature-icon"><f.Icon /></div>
            <div>
              {/* No es un heading: son etiquetas cortas, y un h3 acá saltaba del h1 al h3 */}
              <p className="feature-title">{f.title}</p>
              <p className="feature-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="info-section">
        <h2>¿Cómo funciona?</h2>
        <p>
          PDF Converter es una herramienta online gratuita que te permite trabajar con archivos PDF
          sin necesidad de instalar ningún programa. Selecciona la herramienta que necesitas, sube
          tu archivo y descarga el resultado en segundos.
        </p>
        <p>
          A diferencia de otros servicios, <strong>todo el procesamiento ocurre en tu propio navegador</strong>.
          Tus documentos nunca abandonan tu dispositivo, lo que garantiza total privacidad y seguridad.
        </p>

        <h2>¿Qué puedes hacer con PDF Converter?</h2>
        <ul>
          <li><strong>Unir PDFs:</strong> Combina múltiples archivos PDF en un solo documento. Puedes reordenarlos antes de unirlos.</li>
          <li><strong>Convertir imágenes a PDF:</strong> Junta tus fotos JPG o PNG en un único documento PDF. Ideal para crear portafolios, informes o documentos escaneados.</li>
          <li><strong>Convertir HTML a PDF:</strong> Genera un PDF a partir de código HTML. Útil para crear facturas, reportes o cualquier documento con formato personalizado.</li>
          <li><strong>Convertir PDF a imágenes:</strong> Extrae cada página de un PDF como imagen PNG o JPEG en alta resolución.</li>
          <li><strong>Extraer texto de PDF:</strong> Obtén el contenido de texto de cualquier PDF para copiarlo o editarlo libremente.</li>
        </ul>
      </div>
    </main>
  );
}
