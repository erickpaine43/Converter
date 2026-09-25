import { lazy, Suspense, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import Faq from '../components/Faq';
import SeoHead from '../components/SeoHead';
import OtherTools from '../components/OtherTools';
import JsonLd from '../components/JsonLd';
import { MAX_FILE_SIZE_MB, MAX_FILES_IMAGES, MAX_FILES_MERGE } from '../lib/fileLimits';
import { TOOL_LABELS, toolOgImage, toolPath, type ToolId } from '../lib/tools';
import { BASE_URL, SITE_NAME, canonicalUrl } from '../lib/site';

// Lazy: estas librerías (pdfjs-dist, html2canvas, jspdf, pdf-lib) son pesadas y
// solo hacen falta al interactuar con la herramienta, no en la carga inicial.
const converterMap: Record<ToolId, ComponentType> = {
  'images-to-pdf': lazy(() => import('../components/converters/imagesToPdf')),
  'html-to-pdf':   lazy(() => import('../components/converters/HtmlToPdf')),
  'pdf-to-images': lazy(() => import('../components/converters/PdfToImages')),
  'merge-pdfs':    lazy(() => import('../components/converters/MergePdfs')),
  'pdf-to-text':   lazy(() => import('../components/converters/PdfToText')),
};

// Texto visible arriba del conversor. La <meta description> es otra (metaDescriptions).
const descriptions: Record<string, string> = {
  'images-to-pdf': 'Convierte tus imágenes JPG o PNG en un documento PDF. Puedes subir varias imágenes, reordenarlas y elegir el tamaño de página antes de convertir.',
  'html-to-pdf':   'Sube un archivo .html o pega tu código y genera un PDF completo, con paginación real y sin perder contenido. Ideal para esos documentos que llegan "en formato HTML" — guardados desde un navegador — y que no se abren bien en lectores de PDF ni en apps de documentos.',
  'pdf-to-images': 'Extrae cada página de tu PDF como imagen independiente en formato PNG o JPEG. Elige la calidad según tus necesidades.',
  'merge-pdfs':    'Combina varios archivos PDF en un único documento. Sube los archivos, ordénalos como quieras y descarga el PDF unificado.',
  'pdf-to-text':   'Extrae el contenido de texto de cualquier PDF. Puedes seleccionar un rango de páginas y descargar el texto resultante como archivo .txt.',
};

const faqs: Record<ToolId, { q: string; a: string }[]> = {
  'images-to-pdf': [
    { q: '¿Qué formatos de imagen puedo convertir?', a: 'Actualmente soportamos JPG/JPEG y PNG. Otros formatos como WEBP o GIF no están soportados por las limitaciones de la librería de procesamiento.' },
    { q: '¿Hay límite de imágenes que puedo subir?', a: `Puedes subir hasta ${MAX_FILES_IMAGES} imágenes por conversión, de hasta ${MAX_FILE_SIZE_MB} MB cada una. Ten en cuenta que imágenes muy grandes pueden ralentizar el proceso ya que todo se ejecuta en tu navegador.` },
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
    { q: '¿Cuántos PDFs puedo unir?', a: `Hasta ${MAX_FILES_MERGE} PDFs por vez, de hasta ${MAX_FILE_SIZE_MB} MB cada uno. Archivos muy pesados pueden consumir bastante memoria del navegador.` },
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

// <title> (sin el sufijo " | PDF Converter" que agrega SeoHead): 50-60 caracteres
// en total, lo controla seo.test.tsx.
const titles: Record<ToolId, string> = {
  'images-to-pdf': 'Convertir Imágenes a PDF Gratis Online',
  'html-to-pdf':   'Convertir HTML a PDF Gratis Online',
  'pdf-to-images': 'Convertir PDF a Imágenes Gratis Online',
  'merge-pdfs':    'Unir PDFs Gratis Online en un Solo Archivo',
  'pdf-to-text':   'Extraer Texto de PDF Gratis Online',
};

// <meta description> (y og/twitter:description), 150-160 caracteres; lo
// controla seo.test.tsx. Distinta del texto visible de `descriptions`.
const metaDescriptions: Record<ToolId, string> = {
  'merge-pdfs':    'Une varios PDFs en un solo archivo, gratis y online. Ordénalos antes de combinarlos, sin registro y sin subir nada: todo se procesa en tu propio navegador.',
  'images-to-pdf': 'Convierte imágenes JPG y PNG a PDF gratis. Ordena tus fotos, elige A4, Carta o el tamaño original y descarga el PDF. Sin registro y sin subir tus archivos.',
  'pdf-to-images': 'Convierte cada página de un PDF en una imagen PNG o JPG, gratis y online. Elige la calidad y descarga las páginas. Sin registro y sin subir tus archivos.',
  'pdf-to-text':   'Extrae el texto de un PDF digital gratis y online: elige el rango de páginas, cópialo o descárgalo como archivo .txt. Sin registro y sin subir tus archivos.',
  'html-to-pdf':   'Convierte un archivo o código HTML a PDF gratis, con paginación real e imágenes incluidas. Sin registro y sin subir nada: todo ocurre en tu navegador.',
};

// Contenido explicativo debajo del conversor y antes del FAQ: cómo se usa,
// para qué sirve y cómo funciona/límites. Se renderiza fuera del Suspense del
// widget, así que está en el HTML pre-renderizado (visible sin JS y para Google).
// Los datos concretos (formatos, límites, escalas) reflejan lo que hace el código
// de cada conversor: si cambia el comportamiento, actualizar también este texto.
interface ContentSection {
  title: string;
  /** Pasos numerados (<ol>). */
  steps?: string[];
  /** Lista sin orden (<ul>), después de los párrafos. */
  items?: string[];
  paragraphs?: string[];
}

const extraContent: Record<ToolId, ContentSection[]> = {
  'merge-pdfs': [
    {
      title: 'Cómo unir PDFs paso a paso',
      steps: [
        'Selecciona los PDFs que quieres combinar o arrástralos a la zona de carga. Puedes agregar más archivos después, en varias tandas.',
        'Ordénalos con las flechas ↑ y ↓: el orden de la lista es el orden en que aparecerán en el documento final. Si agregaste un archivo por error, quítalo con ✕.',
        'Haz clic en «Unir PDFs». Una barra de progreso te muestra cuántos archivos van procesados.',
        'Descarga el resultado con «Descargar PDF unido».',
      ],
    },
    {
      title: '¿Para qué sirve unir PDFs?',
      paragraphs: ['Es la forma más simple de entregar un solo archivo en lugar de muchos sueltos. Algunos usos típicos:'],
      items: [
        'Armar un expediente o legajo a partir de varios PDFs sueltos: documento de identidad, constancias, certificados y formularios en un único archivo para presentar en un trámite.',
        'Juntar las facturas o comprobantes del mes en un solo adjunto para enviárselos a tu contador.',
        'Unir los capítulos o anexos de un informe que se exportaron por separado.',
        'Combinar páginas que escaneaste en distintos momentos en un único documento ordenado.',
      ],
    },
    {
      title: 'Cómo funciona y qué límites tiene',
      paragraphs: [
        'La unión se hace completamente en tu navegador con pdf-lib, una librería de código abierto: tus archivos no se suben a ningún servidor y nadie más puede verlos, así que puedes usarla también con documentos confidenciales.',
        'Las páginas se copian tal cual, sin convertirlas en imágenes: el texto sigue siendo seleccionable y la calidad es la misma que en los PDFs originales.',
        `Puedes unir hasta ${MAX_FILES_MERGE} PDFs de hasta ${MAX_FILE_SIZE_MB} MB cada uno. Como todo ocurre en tu dispositivo, con archivos muy pesados la velocidad depende de la memoria de tu computadora o teléfono. Los PDFs protegidos con contraseña no se pueden unir: quita la protección antes de subirlos.`,
      ],
    },
  ],
  'images-to-pdf': [
    {
      title: 'Cómo convertir imágenes a PDF paso a paso',
      steps: [
        'Selecciona tus fotos o imágenes JPG o PNG, o arrástralas a la zona de carga.',
        'Revisa el orden en las miniaturas y ajústalo con las flechas: cada imagen será una página del PDF, en ese mismo orden.',
        'Elige el tamaño de página («Original», A4 o Carta) y la orientación, vertical u horizontal. Con «Original», cada página toma el tamaño de su imagen.',
        'Haz clic en «Convertir a PDF» y descarga el documento.',
      ],
    },
    {
      title: '¿Para qué sirve?',
      items: [
        'Convertir fotos de documentos sacadas con el celular (un contrato, un recibo, apuntes de clase) en un PDF para enviar por correo o subir a un trámite que solo acepta PDF.',
        'Juntar varias capturas de pantalla, por ejemplo de un comprobante de pago o una conversación, en un único archivo.',
        'Armar un portafolio o catálogo sencillo a partir de imágenes de tus trabajos o productos.',
      ],
    },
    {
      title: 'Cómo funciona y qué límites tiene',
      paragraphs: [
        'La conversión ocurre en tu navegador: las imágenes no se suben a ningún servidor.',
        'Cada imagen se escala para entrar completa en la página, centrada, sin deformarse ni recortarse. Las fotos se insertan sin pérdida de calidad, sin volver a comprimirlas con pérdida.',
        `Solo se admiten JPG y PNG. Otros formatos, como WEBP, GIF o las fotos HEIC del iPhone, hay que convertirlos antes a JPG. Puedes subir hasta ${MAX_FILES_IMAGES} imágenes de hasta ${MAX_FILE_SIZE_MB} MB cada una.`,
      ],
    },
  ],
  'pdf-to-images': [
    {
      title: 'Cómo convertir un PDF a imágenes paso a paso',
      steps: [
        'Selecciona el PDF o arrástralo a la zona de carga.',
        'Elige el formato: PNG (sin pérdida, ideal para texto y gráficos) o JPEG (archivos más livianos, ideal para fotos).',
        'Elige la calidad: Baja, Media o Alta. Cuanto más alta, más nítida y más pesada es cada imagen.',
        'Haz clic en «Convertir»: vas a ver una vista previa de cada página.',
        'Descarga solo las páginas que necesites, o todas con «Descargar todas».',
      ],
    },
    {
      title: '¿Para qué sirve?',
      items: [
        'Publicar una página de un PDF en redes sociales, en una presentación o en un sitio web, donde no se puede insertar un PDF directamente.',
        'Enviar una página puntual por WhatsApp u otro chat como imagen, que se ve sin tener que abrir otro programa.',
        'Sacar la portada de un informe o de un libro para usarla como miniatura.',
        'Pegar una página de un PDF dentro de un documento de Word o de Google Docs.',
      ],
    },
    {
      title: 'Cómo funciona y qué límites tiene',
      paragraphs: [
        'Cada página se dibuja en tu navegador con PDF.js, el mismo motor que usa Firefox para mostrar PDFs, y se exporta como imagen. El archivo no sale de tu dispositivo.',
        'Como referencia, una página A4 sale de unos 595 × 842 píxeles en calidad Baja, 1190 × 1684 en Media y 1786 × 2526 en Alta.',
        'Todas las páginas se convierten de una vez y quedan en memoria: con PDFs de muchas páginas en calidad Alta el proceso puede tardar y consumir bastante memoria, sobre todo en el celular. Al usar «Descargar todas», algunos navegadores piden permiso para descargar varios archivos a la vez. Los PDFs protegidos con contraseña no se pueden convertir.',
      ],
    },
  ],
  'pdf-to-text': [
    {
      title: 'Cómo extraer el texto de un PDF paso a paso',
      steps: [
        'Selecciona el PDF o arrástralo a la zona de carga. La herramienta te muestra cuántas páginas tiene.',
        'Si solo necesitas una parte, indica el rango de páginas (desde y hasta).',
        'Haz clic en «Extraer Texto»: el texto aparece debajo, listo para copiar.',
        'Si quieres guardarlo, descárgalo como archivo .txt con «Descargar .txt».',
      ],
    },
    {
      title: '¿Para qué sirve?',
      items: [
        'Copiar el contenido de un PDF para editarlo en un procesador de texto, sin tener que seleccionarlo página por página.',
        'Buscar, citar o resumir fragmentos de un informe, un contrato o un trabajo académico largo.',
        'Pasar el texto a un traductor, a un lector de pantalla o a cualquier herramienta que solo acepte texto plano.',
      ],
    },
    {
      title: 'Cómo funciona y qué límites tiene',
      paragraphs: [
        'El texto se lee directamente de la capa digital del PDF con PDF.js, en tu navegador: el archivo no se sube a ningún servidor.',
        'El resultado es texto plano, con un separador «--- Página N ---» al comienzo de cada página. El formato se pierde: negritas, tablas y columnas se convierten en texto corrido.',
        'No incluye reconocimiento óptico de caracteres (OCR): si el PDF es un escaneo o una foto, no tiene texto digital y el resultado va a salir vacío. Una forma rápida de saberlo: si en tu lector de PDF no puedes seleccionar el texto con el mouse, esta herramienta tampoco va a poder extraerlo.',
      ],
    },
  ],
  'html-to-pdf': [
    {
      title: '¿Por qué tengo un HTML en vez de un PDF?',
      paragraphs: [
        'Es más común de lo que parece: alguien guarda una página o un documento desde el navegador con "Guardar como página web", y el resultado es un archivo .html que dice ser un PDF pero no se comporta como uno — no se abre en lectores de PDF, y muchas apps de documentos ni siquiera lo reconocen.',
        'Esta herramienta convierte ese archivo a un PDF real, respetando el texto completo del documento. Si el HTML es largo, el PDF se pagina correctamente en vez de generar una sola imagen gigante. Y si alguna imagen del documento no se puede recuperar, el PDF lo indica claramente en el lugar donde iba la imagen.',
        'Si tenés las imágenes del documento por separado, podés subirlas junto con el archivo .html — la herramienta las reconoce automáticamente por su nombre y las incluye en el PDF. Si no las tenés, o si la imagen no se puede recuperar, vas a ver un aviso en su lugar, nunca un ícono roto sin explicación.',
      ],
    },
  ],
};

// Texto de H1 diferenciado del <title> y del H2 interno de cada herramienta.
const h1Titles: Record<string, string> = {
  'images-to-pdf': 'Convertir Imágenes a PDF Gratis Online',
  'html-to-pdf':   'Convertir HTML a PDF Gratis Online',
  'pdf-to-images': 'Convertir PDF a Imágenes Gratis Online',
  'merge-pdfs':    'Unir PDFs Gratis Online',
  'pdf-to-text':   'Extraer Texto de PDF Gratis Online',
};

// Cada herramienta tiene su propia ruta explícita en AppRoutes (slug en
// español, ver lib/tools.ts); cualquier otra URL cae en el catch-all <NotFound />.
// Schema.org de cada herramienta: la app (gratis), el FAQ visible (mismos datos
// que <Faq>, no una copia) y la miga de pan Inicio > Herramienta.
function toolStructuredData(type: ToolId): Record<string, unknown> {
  const url = canonicalUrl(toolPath(type));
  return {
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: TOOL_LABELS[type],
        description: metaDescriptions[type],
        url,
        image: `${BASE_URL}${toolOgImage(type)}`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Cualquiera (navegador web)',
        browserRequirements: 'Requiere JavaScript y un navegador actualizado',
        inLanguage: 'es',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: canonicalUrl('/') },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: faqs[type].map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: TOOL_LABELS[type], item: url },
        ],
      },
    ],
  };
}

export default function ConverterPage({ tool: type }: { tool: ToolId }) {
  const Component = converterMap[type];

  return (
    <main className="converter-page">
      <SeoHead
        title={titles[type]}
        description={metaDescriptions[type]}
        path={toolPath(type)}
        image={toolOgImage(type)}
      />
      <JsonLd data={toolStructuredData(type)} />
      <Link to="/" className="back-btn">← Volver</Link>
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
      <div className="info-section converter-extra-content">
        {extraContent[type].map(section => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.steps && (
              <ol className="content-steps">
                {section.steps.map((step, i) => <li key={i}>{step}</li>)}
              </ol>
            )}
            {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
            {section.items && (
              <ul>
                {section.items.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      {faqs[type] && <Faq items={faqs[type]} />}
      <OtherTools current={type} />
    </main>
  );
}
