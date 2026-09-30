import type { Guide } from '../types';

// Mirrors src/components/converters/HtmlToPdf.tsx and src/lib/htmlImageResolver.ts:
// accepts .html/.htm (not .mhtml), resolves attached images by name or embedded
// base64 images, and doesn't run JavaScript or load external CSS.
const guide: Guide = {
  slug: 'como-abrir-un-archivo-html-y-pasarlo-a-pdf',
  title: 'Cómo abrir un archivo HTML y pasarlo a PDF',
  description: 'Te enviaron un documento .html que no se abre como un PDF. Qué es ese archivo, cómo verlo en el navegador y dos formas de convertirlo en PDF con sus imágenes.',
  h1: 'Me enviaron un archivo HTML: cómo abrirlo y pasarlo a PDF',
  summary: 'Qué es un archivo .html, por qué no se abre en un lector de PDF y cómo convertirlo en un PDF con sus imágenes.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Alguien te manda "el documento" y resulta que es un archivo terminado en .html. El lector de PDF no lo abre, la app de documentos del celular no lo reconoce y, si lo abres, a veces faltan las imágenes. No está roto: es una página web guardada como archivo.',
  ],
  sections: [
    {
      title: 'Qué es un archivo HTML',
      paragraphs: [
        'HTML es el formato de las páginas web. Cuando alguien usa «Guardar como» en el navegador, o cuando un sistema genera facturas, reportes o comprobantes, muchas veces el resultado es un archivo .html en lugar de un PDF.',
        'Si se guardó como «Página web completa», el navegador crea además una carpeta con el mismo nombre (normalmente terminada en «_files») donde están las imágenes. Si te enviaron solo el .html sin esa carpeta, las imágenes no van a aparecer.',
      ],
    },
    {
      title: 'Cómo verlo',
      paragraphs: [
        'En una computadora, basta con hacer doble clic: se abre en tu navegador (Chrome, Edge, Firefox o Safari) como cualquier página web. En el celular es más complicado, porque muchas apps no ofrecen abrir un .html descargado; ahí conviene convertirlo a PDF directamente.',
      ],
    },
    {
      title: 'Opción 1: imprimir a PDF desde el navegador',
      steps: [
        'Abre el archivo .html en el navegador.',
        'Pulsa Ctrl+P (Cmd+P en Mac).',
        'En «Destino», elige «Guardar como PDF».',
        'Ajusta el tamaño de papel y los márgenes, y guarda.',
      ],
      paragraphs: [
        'Es la opción más rápida cuando el documento se ve bien en el navegador. Su limitación: el resultado depende de cómo la página esté preparada para imprimirse, y a veces se cortan tablas o aparecen menús y botones que no querías.',
      ],
    },
    {
      title: 'Opción 2: la herramienta HTML a PDF',
      paragraphs: [
        'Con la herramienta HTML a PDF de este sitio subes el archivo (o pegas el código) y obtienes un PDF paginado en A4, Carta o del tamaño del contenido, con una vista previa antes de descargar. Funciona igual desde el celular y todo se procesa en tu navegador, sin subir el documento a ningún servidor.',
        'Sirve tanto para esos documentos guardados como página web como para facturas o reportes que un sistema genera en HTML.',
      ],
      steps: [
        'Abre la herramienta HTML a PDF.',
        'Selecciona el archivo .html y, si las tienes, también sus imágenes (con Ctrl+clic eliges varios archivos a la vez). La herramienta conecta cada imagen con su lugar en el documento por el nombre del archivo.',
        'Elige el tamaño de página y revisa la vista previa.',
        'Haz clic en «Convertir a PDF» y descarga el resultado.',
      ],
    },
    {
      title: 'Si faltan imágenes o el formato no se ve bien',
      items: [
        'Imágenes que no aparecen: pide a quien te lo envió la carpeta de imágenes y súbelas junto con el .html. Las imágenes que están publicadas en internet se intentan cargar desde su dirección original. Si una imagen no se puede recuperar, el PDF muestra un aviso en su lugar en vez de un ícono roto.',
        'Imágenes incrustadas: si el HTML ya trae las imágenes dentro del propio archivo (codificadas en base64), no hace falta nada más.',
        'Archivos .mhtml: el formato «Página web, un solo archivo» de Chrome y Edge no es HTML. Ábrelo en el navegador y usa la opción 1.',
        'Estilos o partes que dependen de JavaScript: por seguridad, la herramienta no ejecuta scripts ni descarga hojas de estilo externas, así que el diseño puede verse más simple. El texto completo del documento siempre se conserva.',
      ],
    },
  ],
  relatedTools: ['html-to-pdf'],
};

export default guide;
