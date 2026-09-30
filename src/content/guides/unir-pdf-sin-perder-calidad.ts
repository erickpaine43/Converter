import type { Guide } from '../types';

// Mirrors src/converters/MergePdfs.ts: pdf-lib copies the pages (copyPages)
// without rasterizing them; it doesn't copy the source document's bookmarks
// (outline) or form.
const guide: Guide = {
  slug: 'como-unir-pdfs-sin-perder-calidad',
  title: 'Cómo unir PDFs sin perder calidad',
  description: 'Une varios PDFs en uno manteniendo el texto seleccionable y la calidad original. Qué revisar antes de unirlos, qué se conserva y qué no, y cómo ordenarlos.',
  h1: 'Cómo unir PDFs sin perder calidad',
  summary: 'Qué se conserva al combinar PDFs, qué revisar antes de unirlos y cómo evitar que el resultado salga borroso o pesado.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Unir PDFs parece una tarea trivial, pero según cómo se haga el resultado puede salir borroso, con el texto convertido en imagen o mucho más pesado que los originales. Esta guía explica cuándo pasa eso, cómo evitarlo y qué conviene revisar antes y después de combinar los archivos.',
  ],
  sections: [
    {
      title: 'Por qué a veces se pierde calidad',
      paragraphs: [
        'Un PDF puede contener texto, dibujos vectoriales e imágenes. Una unión bien hecha copia cada página tal cual, con todo su contenido. Los problemas aparecen cuando en el proceso las páginas se convierten en imágenes:',
      ],
      items: [
        'Al "imprimir" varios documentos a una impresora virtual con opciones de baja resolución.',
        'Al sacar capturas de pantalla de las páginas y volver a armarlas como PDF.',
        'Con algunas herramientas que, para simplificar, dibujan cada página como una imagen antes de unirlas.',
      ],
    },
    {
      title: 'Cómo lo hace PDF Converter',
      paragraphs: [
        'La herramienta Unir PDFs copia las páginas de cada archivo al documento final sin convertirlas en imágenes, usando la librería de código abierto pdf-lib. Por eso el texto sigue siendo seleccionable y buscable, los gráficos vectoriales se ven nítidos a cualquier zoom y las imágenes mantienen la misma resolución que tenían.',
        'Todo el proceso ocurre en tu navegador: los archivos no se suben a ningún servidor.',
      ],
    },
    {
      title: 'Paso a paso',
      steps: [
        'Abre la herramienta Unir PDFs y selecciona los archivos, o arrástralos a la zona de carga. Puedes agregar más en varias tandas.',
        'Ordénalos con las flechas: el orden de la lista es el orden de las páginas en el documento final.',
        'Haz clic en «Unir PDFs» y espera a que la barra de progreso termine.',
        'Descarga el resultado y ábrelo para revisarlo antes de enviarlo.',
      ],
    },
    {
      title: 'Qué se conserva y qué no',
      items: [
        'Se conserva: el contenido de cada página (texto, imágenes, gráficos), su tamaño y su orientación. Si unes una página A4 vertical con una apaisada, cada una mantiene su formato.',
        'No se conservan los marcadores (el índice lateral que muestran algunos lectores): el PDF unido no tiene esa navegación.',
        'Los formularios rellenables pueden dejar de funcionar como formulario. Si tienes que completar uno, complétalo y guárdalo antes de unirlo.',
        'Los PDFs protegidos con contraseña no se pueden unir: quita la protección antes, con el programa con el que lo abres habitualmente.',
      ],
    },
    {
      title: 'Antes de unir: una lista rápida',
      items: [
        'Nombra los archivos con un número al principio (01-dni.pdf, 02-certificado.pdf…): así es más fácil ordenarlos y detectar si falta alguno.',
        'Verifica que ninguna página esté de costado. La herramienta no rota páginas, así que conviene corregirlo en el original.',
        'Suma los tamaños: el PDF unido pesa aproximadamente lo mismo que todos los originales juntos. Si el destino tiene un límite de tamaño, revisa la guía para reducir el peso de un PDF.',
        'Si alguno de los documentos son fotos, conviértelas primero a PDF con Imágenes a PDF y después únelas con el resto.',
      ],
    },
  ],
  relatedTools: ['merge-pdfs', 'images-to-pdf'],
};

export default guide;
