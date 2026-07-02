import type { ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImagesToPdf from '../components/converters/imagesToPdf';
import HtmlToPdf from '../components/converters/HtmlToPdf';
import PdfToImages from '../components/converters/PdfToImages';
import MergePdfs from '../components/converters/MergePdfs';
import PdfToText from '../components/converters/PdfToText';
import Faq from '../components/Faq';
import SeoHead from '../components/SeoHead';

const converterMap: Record<string, ReactElement> = {
  'images-to-pdf': <ImagesToPdf />,
  'html-to-pdf':   <HtmlToPdf />,
  'pdf-to-images': <PdfToImages />,
  'merge-pdfs':    <MergePdfs />,
  'pdf-to-text':   <PdfToText />,
};

const descriptions: Record<string, string> = {
  'images-to-pdf': 'Convierte tus imágenes JPG o PNG en un documento PDF. Puedes subir varias imágenes, reordenarlas y elegir el tamaño de página antes de convertir.',
  'html-to-pdf':   'Pega tu código HTML y genera un PDF con el diseño exacto que ves en la vista previa. Ideal para facturas, reportes y documentos con formato personalizado.',
  'pdf-to-images': 'Extrae cada página de tu PDF como imagen independiente en formato PNG o JPEG. Elige la calidad según tus necesidades.',
  'merge-pdfs':    'Combina varios archivos PDF en un único documento. Sube los archivos, ordénalos como quieras y descarga el PDF unificado.',
  'pdf-to-text':   'Extrae el contenido de texto de cualquier PDF. Puedes seleccionar un rango de páginas y descargar el texto resultante como archivo .txt.',
};

const faqs: Record<string, { q: string; a: string }[]> = {
  'images-to-pdf': [
    { q: '¿Qué formatos de imagen puedo convertir?', a: 'Actualmente soportamos JPG/JPEG y PNG. Otros formatos como WEBP o GIF no están soportados por las limitaciones de la librería de procesamiento.' },
    { q: '¿Hay límite de imágenes que puedo subir?', a: 'No hay un límite fijo, pero ten en cuenta que imágenes muy grandes pueden ralentizar el proceso ya que todo se ejecuta en tu navegador.' },
    { q: '¿Mis imágenes se suben a algún servidor?', a: 'No. Todo el procesamiento ocurre localmente en tu dispositivo. Tus imágenes nunca abandonan tu navegador.' },
    { q: '¿Puedo cambiar el orden de las imágenes?', a: 'Sí, una vez que subes las imágenes aparecen miniaturas con botones para reordenarlas antes de convertir.' },
  ],
  'html-to-pdf': [
    { q: '¿Qué tan complejo puede ser el HTML?', a: 'Funciona bien con HTML estático y estilos CSS en línea. Hojas de estilo externas o JavaScript dentro del HTML no se procesarán correctamente.' },
    { q: '¿El PDF resultante tendrá el mismo aspecto que la vista previa?', a: 'En la mayoría de los casos sí. La conversión captura visualmente el contenido como lo renderiza el navegador.' },
    { q: '¿Mis archivos se envían a un servidor?', a: 'No. Todo se procesa en tu navegador, sin enviar ningún dato al servidor.' },
    { q: '¿Qué tamaños de página están disponibles?', a: 'Puedes elegir entre A4, Carta o automático (ajusta el PDF al tamaño del contenido).' },
  ],
  'pdf-to-images': [
    { q: '¿En qué formatos puedo exportar las imágenes?', a: 'Puedes elegir entre PNG (sin pérdida de calidad) y JPEG (menor tamaño de archivo).' },
    { q: '¿Qué significa la opción de calidad?', a: 'Controla la escala de renderizado: Baja (1x), Media (2x) y Alta (3x). Mayor calidad genera imágenes más grandes y nítidas.' },
    { q: '¿Puedo descargar todas las páginas a la vez?', a: 'Sí, hay un botón "Descargar todas" que descarga todas las páginas en secuencia.' },
    { q: '¿Funciona con PDFs protegidos con contraseña?', a: 'No, actualmente solo se pueden procesar PDFs sin contraseña.' },
  ],
  'merge-pdfs': [
    { q: '¿Cuántos PDFs puedo unir?', a: 'No hay un límite estricto, pero archivos muy pesados pueden consumir bastante memoria del navegador.' },
    { q: '¿Puedo cambiar el orden de los PDFs antes de unirlos?', a: 'Sí, puedes reordenarlos con los botones de subir y bajar antes de hacer clic en Unir.' },
    { q: '¿Se conservan las páginas originales de cada PDF?', a: 'Sí, todas las páginas de todos los PDFs se incluyen en el documento final en el orden que hayas definido.' },
    { q: '¿Mis PDFs se suben a algún servidor?', a: 'No. Todo el proceso ocurre en tu dispositivo. Nadie más tiene acceso a tus archivos.' },
  ],
  'pdf-to-text': [
    { q: '¿Funciona con PDFs escaneados?', a: 'No. Esta herramienta extrae texto digital. Los PDFs generados a partir de imágenes escaneadas no contienen texto seleccionable, por lo que el resultado estará vacío.' },
    { q: '¿Puedo extraer solo algunas páginas?', a: 'Sí, puedes indicar desde qué página hasta qué página quieres extraer el texto.' },
    { q: '¿En qué formato se descarga el texto?', a: 'El texto se descarga como un archivo .txt con marcadores de página.' },
    { q: '¿Se conserva el formato del texto (tablas, columnas)?', a: 'El texto se extrae de forma lineal. Tablas y columnas pueden no conservar su estructura visual original.' },
  ],
};

const titles: Record<string, string> = {
  'images-to-pdf': 'Convertir Imágenes a PDF',
  'html-to-pdf':   'Convertir HTML a PDF',
  'pdf-to-images': 'Convertir PDF a Imágenes',
  'merge-pdfs':    'Unir PDFs',
  'pdf-to-text':   'Extraer Texto de PDF',
};

export default function ConverterPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const component = type ? converterMap[type] : null;

  if (!component) {
    return (
      <main className="converter-page">
        <p>Conversión no encontrada.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>Volver</button>
      </main>
    );
  }

  return (
    <main className="converter-page">
      {type && (
        <SeoHead
          title={titles[type] ?? 'Convertidor PDF'}
          description={descriptions[type] ?? 'Herramienta gratuita para trabajar con archivos PDF.'}
          path={`/converter/${type}`}
        />
      )}
      <button className="back-btn" onClick={() => navigate('/')}>← Volver</button>
      <div className="converter-card">
        {type && descriptions[type] && (
          <p className="converter-desc">{descriptions[type]}</p>
        )}
        {component}
      </div>
      {type && faqs[type] && <Faq items={faqs[type]} />}
    </main>
  );
}
