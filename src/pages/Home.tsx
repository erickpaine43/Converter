import { useNavigate } from 'react-router-dom';
import SeoHead from '../components/SeoHead';

const tools = [
  { id: 'images-to-pdf', label: 'Imágenes a PDF', icon: '🖼️', desc: 'Convierte JPG y PNG a PDF' },
  { id: 'html-to-pdf',   label: 'HTML a PDF',     icon: '🌐', desc: 'Convierte HTML a PDF' },
  { id: 'pdf-to-images', label: 'PDF a Imágenes', icon: '📄', desc: 'Extrae páginas como imágenes' },
  { id: 'merge-pdfs',    label: 'Unir PDFs',      icon: '📎', desc: 'Combina varios PDFs en uno' },
  { id: 'pdf-to-text',   label: 'PDF a Texto',    icon: '📝', desc: 'Extrae el texto de un PDF' },
];

const features = [
  { icon: '🔒', title: 'Privado', desc: 'Todo se procesa en tu navegador. Tus archivos nunca se suben a ningún servidor.' },
  { icon: '⚡', title: 'Rápido', desc: 'Sin colas de espera ni límites de tamaño. La conversión es instantánea.' },
  { icon: '🆓', title: 'Gratis', desc: 'Sin registro, sin suscripciones. Todas las herramientas son 100% gratuitas.' },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home">
      <SeoHead
        title="Herramientas PDF gratuitas online"
        description="Convierte imágenes a PDF, une PDFs, extrae texto y más. Gratis, sin registro y sin subir archivos a ningún servidor."
        path="/"
      />
      <h1 className="home-title">Herramientas PDF gratuitas y online</h1>
      <p className="home-subtitle">Convierte, une y extrae contenido de PDFs directamente en tu navegador. Sin registros, sin límites.</p>

      <div className="tools-grid">
        {tools.map(tool => (
          <div key={tool.id} className="tool-card" onClick={() => navigate(`/converter/${tool.id}`)}>
            <div className="tool-card-icon">{tool.icon}</div>
            <div className="tool-card-label">{tool.label}</div>
            <div className="tool-card-desc">{tool.desc}</div>
          </div>
        ))}
      </div>

      <div className="features-section">
        {features.map(f => (
          <div key={f.title} className="feature-item">
            <div className="feature-icon">{f.icon}</div>
            <div>
              <h3 className="feature-title">{f.title}</h3>
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
          <li><strong>Convertir imágenes a PDF:</strong> Junta tus fotos JPG o PNG en un único documento PDF. Ideal para crear portafolios, informes o documentos escaneados.</li>
          <li><strong>Convertir HTML a PDF:</strong> Genera un PDF a partir de código HTML. Útil para crear facturas, reportes o cualquier documento con formato personalizado.</li>
          <li><strong>Convertir PDF a imágenes:</strong> Extrae cada página de un PDF como imagen PNG o JPEG en alta resolución.</li>
          <li><strong>Unir PDFs:</strong> Combina múltiples archivos PDF en un solo documento. Puedes reordenarlos antes de unirlos.</li>
          <li><strong>Extraer texto de PDF:</strong> Obtén el contenido de texto de cualquier PDF para copiarlo o editarlo libremente.</li>
        </ul>
      </div>
    </main>
  );
}
