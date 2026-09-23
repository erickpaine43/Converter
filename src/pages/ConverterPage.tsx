import { lazy, Suspense, type ComponentType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Faq from '../components/Faq';
import SeoHead from '../components/SeoHead';

// Lazy: estas librerías (pdfjs-dist, html2canvas, jspdf, pdf-lib) son pesadas y
// solo hacen falta al interactuar con la herramienta, no en la carga inicial.
const converterMap: Record<string, ComponentType> = {
  'images-to-pdf': lazy(() => import('../components/converters/imagesToPdf')),
  'html-to-pdf':   lazy(() => import('../components/converters/HtmlToPdf')),
  'pdf-to-images': lazy(() => import('../components/converters/PdfToImages')),
  'merge-pdfs':    lazy(() => import('../components/converters/MergePdfs')),
  'pdf-to-text':   lazy(() => import('../components/converters/PdfToText')),
};

const descriptions: Record<string, string> = {
  'images-to-pdf': 'Convierte tus imágenes JPG o PNG en un documento PDF. Puedes subir varias imágenes, reordenarlas y elegir el tamaño de página antes de convertir.',
  'html-to-pdf':   'Sube un archivo .html o pega tu código y genera un PDF completo, con paginación real y sin perder contenido. Ideal para esos documentos que llegan "en formato HTML" — guardados desde un navegador — y que no se abren bien en lectores de PDF ni en apps de documentos.',
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
    { q: '¿Puedo subir un archivo en vez de pegar el código?', a: 'Sí. Podés subir directamente un archivo .html o .htm desde tu dispositivo, o pegar el código a mano — las dos opciones usan el mismo proceso de conversión y la misma vista previa.' },
    { q: '¿Qué pasa si el HTML tiene imágenes que no cargan?', a: 'El PDF se genera igual, completo en texto. Donde iba una imagen que no se pudo recuperar, vas a ver un aviso "[Imagen no disponible]" — y si la imagen tenía un link a una fuente externa, ese link queda visible como texto para que lo puedas buscar después si tenés conexión.' },
    { q: '¿Funciona con documentos largos (muchas páginas)?', a: 'Sí. El PDF se pagina automáticamente según el contenido, así que documentos largos (varios capítulos, reportes extensos) se convierten en múltiples páginas, no en una sola imagen cortada.' },
    { q: '¿Necesito internet después de descargar el PDF?', a: 'No. Una vez generado y descargado, el PDF es un archivo normal que podés abrir sin conexión, en cualquier lector o app de documentos.' },
    { q: '¿Cómo subo las imágenes junto con el HTML?', a: 'Simplemente seleccioná el archivo .html y sus imágenes juntos (podés usar Ctrl+clic para elegir varios). La herramienta identifica el archivo HTML principal y conecta automáticamente cada imagen con la que corresponde en el documento, sin que tengas que hacer nada más.' },
    { q: '¿Y si el HTML ya tiene las imágenes incluidas en el propio archivo?', a: 'Perfecto, no hace falta hacer nada extra — si las imágenes están embebidas dentro del HTML (esto pasa cuando se guarda como "página web de un solo archivo"), la herramienta las usa directamente.' },
    { q: '¿Hay un límite de tamaño para documentos muy largos?', a: 'Con tamaño de página A4 o Carta no vas a tener el problema de antes (todo el documento achicado en una sola imagen): el PDF se pagina automáticamente en tantas páginas como haga falta. Documentos extremadamente largos podrían toparse con límites de memoria del navegador al generar la vista previa, aunque es poco común en documentos de uso normal. Si elegís que la página se ajuste exactamente al contenido, ahí sí es más probable encontrar una limitación — para documentos largos te recomendamos A4 o Carta.' },
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

// Contenido explicativo extra, debajo del conversor y antes del FAQ. Solo
// aplica a herramientas que se benefician de más contexto de uso (hoy html-to-pdf).
const extraContent: Record<string, { title: string; paragraphs: string[] }> = {
  'html-to-pdf': {
    title: '¿Por qué tengo un HTML en vez de un PDF?',
    paragraphs: [
      'Es más común de lo que parece: alguien guarda una página o un documento desde el navegador con "Guardar como página web", y el resultado es un archivo .html que dice ser un PDF pero no se comporta como uno — no se abre en lectores de PDF, y muchas apps de documentos ni siquiera lo reconocen.',
      'Esta herramienta convierte ese archivo a un PDF real, respetando el texto completo del documento. Si el HTML es largo, el PDF se pagina correctamente en vez de generar una sola imagen gigante. Y si alguna imagen del documento no se puede recuperar, el PDF lo indica claramente en el lugar donde iba la imagen.',
      'Si tenés las imágenes del documento por separado, podés subirlas junto con el archivo .html — la herramienta las reconoce automáticamente por su nombre y las incluye en el PDF. Si no las tenés, o si la imagen no se puede recuperar, vas a ver un aviso en su lugar, nunca un ícono roto sin explicación.',
    ],
  },
};

// Texto de H1 diferenciado del <title> y del H2 interno de cada herramienta.
const h1Titles: Record<string, string> = {
  'images-to-pdf': 'Convertir Imágenes a PDF Gratis Online',
  'html-to-pdf':   'Convertir HTML a PDF Gratis Online',
  'pdf-to-images': 'Convertir PDF a Imágenes Gratis Online',
  'merge-pdfs':    'Unir PDFs Gratis Online',
  'pdf-to-text':   'Extraer Texto de PDF Gratis Online',
};

export default function ConverterPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const Component = type ? converterMap[type] : null;

  if (!Component) {
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
      <h1 className="page-title">{(type && h1Titles[type]) ?? 'Convertidor PDF'}</h1>
      <div className="converter-card">
        {type && descriptions[type] && (
          <p className="converter-desc">{descriptions[type]}</p>
        )}
        {import.meta.env.SSR ? (
          // En el server nunca se dispara el import() dinámico del widget: son
          // librerías de navegador (pdfjs-dist, html2canvas, jspdf) que no deben
          // evaluarse en Node. El marcado es idéntico al fallback de Suspense de
          // abajo para que la hidratación en cliente no tenga mismatch.
          <div className="converter-loading">Cargando herramienta…</div>
        ) : (
          <Suspense fallback={<div className="converter-loading">Cargando herramienta…</div>}>
            <Component />
          </Suspense>
        )}
      </div>
      {type && extraContent[type] && (
        <div className="info-section converter-extra-content">
          <h2>{extraContent[type].title}</h2>
          {extraContent[type].paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      )}
      {type && faqs[type] && <Faq items={faqs[type]} />}
    </main>
  );
}
