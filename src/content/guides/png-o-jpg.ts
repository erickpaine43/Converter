import type { Guide } from '../types';

// The example resolutions come from src/converters/pdfToImages.ts: 1x/2x/3x
// scale over the page size in points (A4 = 595 × 842).
const guide: Guide = {
  slug: 'png-o-jpg-al-convertir-un-pdf-a-imagen',
  title: 'PNG o JPG: cuál elegir para convertir un PDF',
  description: 'Diferencias entre PNG y JPG al pasar un PDF a imágenes, qué resolución necesitas según el uso (WhatsApp, redes, web o impresión) y cómo elegir la calidad justa.',
  h1: 'PNG o JPG: qué formato elegir al pasar un PDF a imagen',
  summary: 'Cuándo conviene PNG y cuándo JPG al convertir páginas de un PDF, y qué calidad elegir según dónde vas a usar la imagen.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Al convertir un PDF en imágenes hay dos decisiones que cambian mucho el resultado: el formato del archivo y la resolución. Elegir bien evita imágenes borrosas cuando se imprimen, o archivos innecesariamente pesados cuando solo quieres mandarlas por un chat.',
  ],
  sections: [
    {
      title: 'La diferencia entre PNG y JPG',
      paragraphs: [
        'PNG guarda la imagen sin pérdida: cada píxel queda exactamente igual. Es ideal para páginas con texto, tablas, gráficos y logos, porque los bordes de las letras se mantienen limpios. Su desventaja es el tamaño: con fotografías genera archivos mucho más grandes.',
        'JPG comprime la imagen descartando detalles que el ojo casi no nota. Con fotos funciona muy bien y los archivos pesan varias veces menos. Con texto, en cambio, puede aparecer una especie de "suciedad" alrededor de las letras, sobre todo si la imagen se amplía.',
      ],
      items: [
        'Página con mucho texto, tablas o gráficos: PNG.',
        'Página que es sobre todo una foto (una portada, un folleto, un catálogo): JPG.',
        'Si tienes que respetar un límite de tamaño: JPG.',
      ],
    },
    {
      title: 'Cuánta resolución necesitas',
      paragraphs: [
        'En la herramienta PDF a Imágenes, la opción de calidad multiplica el tamaño de la página. Como referencia, una hoja A4 queda así:',
      ],
      items: [
        'Baja: unos 595 × 842 píxeles. Suficiente para una miniatura o una vista previa en una web.',
        'Media: unos 1190 × 1684 píxeles. Buena para ver en pantalla, compartir por mensajería o insertar en una presentación.',
        'Alta: unos 1786 × 2526 píxeles. Para imprimir, hacer zoom sobre detalles o pasar la imagen por un reconocimiento de texto (OCR).',
      ],
    },
    {
      title: 'Recomendaciones según el uso',
      items: [
        'WhatsApp u otro chat: JPG en calidad Media. La app vuelve a comprimir las imágenes que envías como foto, así que una resolución mayor no se aprovecha. Si necesitas que llegue intacta, envíala como documento.',
        'Redes sociales: JPG en calidad Media; si la página es sobre todo texto, PNG en calidad Media se ve más nítida.',
        'Presentaciones y documentos de Word o Google Docs: PNG en calidad Media o Alta, para que el texto se lea bien al proyectarlo.',
        'Imprimir: PNG en calidad Alta.',
        'Miniatura para una web o un catálogo: JPG en calidad Baja o Media.',
      ],
    },
    {
      title: 'Cómo hacerlo',
      steps: [
        'Abre la herramienta PDF a Imágenes y selecciona el archivo.',
        'Elige el formato (PNG o JPEG) y la calidad según la tabla anterior.',
        'Haz clic en «Convertir» y revisa la vista previa de cada página.',
        'Descarga solo las páginas que necesites, o todas con «Descargar todas».',
      ],
      paragraphs: [
        'Todas las páginas se procesan en tu navegador y quedan en memoria mientras las descargas: con PDFs de muchas páginas en calidad Alta, el proceso puede tardar un poco más, sobre todo en el celular.',
      ],
    },
  ],
  relatedTools: ['pdf-to-images'],
};

export default guide;
