import type { Guide } from '../types';

// Mirrors src/converters/imagesToPdf.ts: JPG and PNG only, Original/A4/Letter
// page sizes, each image scaled to fit entirely and centered on the page.
const guide: Guide = {
  slug: 'como-pasar-fotos-del-celular-a-pdf',
  title: 'Cómo pasar fotos del celular a PDF',
  description: 'Pasa fotos de documentos del celular a un PDF: cómo fotografiarlos bien, qué hacer con las fotos HEIC del iPhone y cómo evitar que el archivo pese demasiado.',
  h1: 'Cómo pasar fotos del celular a un PDF',
  summary: 'Cómo fotografiar documentos para que se lean bien y convertir las fotos en un PDF listo para enviar, desde el mismo celular.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Un contrato firmado, un recibo, los apuntes de una clase o el DNI de ambos lados: muchas veces el celular es el único "escáner" que tenemos a mano. Con unas pocas precauciones al sacar las fotos, el PDF resultante se ve prolijo y se lee sin problemas.',
  ],
  sections: [
    {
      title: '1. Saca buenas fotos',
      items: [
        'Apoya el documento sobre una superficie plana y de color distinto al papel, para que se distingan los bordes.',
        'Busca luz pareja, idealmente natural. Evita el flash: genera un reflejo blanco que puede tapar parte del texto.',
        'Pon el celular paralelo a la hoja, justo encima, para que la página no quede con forma de trapecio.',
        'Encuadra la página completa y deja un pequeño margen: es mejor que sobre un poco de fondo a que se corte una línea.',
        'Revisa cada foto con zoom antes de seguir. Si no puedes leer la letra más chica, repítela.',
      ],
    },
    {
      title: '2. Comprueba el formato de las fotos',
      paragraphs: [
        'La herramienta de Imágenes a PDF acepta JPG y PNG, que son los formatos de casi todos los celulares Android. El iPhone, en cambio, guarda las fotos por defecto en formato HEIC.',
        'Para que el iPhone saque las fotos nuevas en JPG, entra en Ajustes → Cámara → Formatos y elige «Más compatible». Las fotos que ya tomaste en HEIC hay que convertirlas a JPG antes de usarlas.',
      ],
    },
    {
      title: '3. Conviértelas en PDF desde el navegador',
      steps: [
        'Abre la herramienta Imágenes a PDF en el navegador del celular. No necesitas instalar nada ni crear una cuenta.',
        'Toca la zona de carga y elige las fotos de tu galería. Puedes seleccionar varias a la vez.',
        'Revisa el orden en las miniaturas y ajústalo con las flechas: cada foto será una página, en ese orden.',
        'Elige el tamaño de página. A4 o Carta dan un documento con hojas del mismo tamaño, cómodo para imprimir; «Original» respeta el tamaño de cada foto.',
        'Toca «Convertir a PDF» y descarga el archivo. Queda en la carpeta de descargas de tu celular.',
      ],
      paragraphs: [
        'Cada foto se ajusta para entrar completa en la página, centrada y sin deformarse. Las fotos no se suben a ningún servidor: la conversión ocurre en tu propio teléfono.',
      ],
    },
    {
      title: '4. Cuida el tamaño del archivo',
      paragraphs: [
        'Las fotos de un celular actual pesan entre 2 y 5 MB cada una, y la herramienta las inserta sin recomprimirlas para no perder calidad. Un PDF de diez fotos puede superar el límite de muchos formularios online. Si te pasa, reduce la resolución de las fotos antes de convertirlas: en la guía para reducir el peso de un PDF está explicado paso a paso.',
      ],
    },
    {
      title: 'Alternativa: las apps de escaneo',
      paragraphs: [
        'Si digitalizas documentos a menudo, vale la pena conocer las funciones de escaneo que ya traen los teléfonos: la app Archivos y la app Notas del iPhone tienen «Escanear documentos», y Google Drive para Android incluye un botón para escanear. Recortan los bordes y enderezan la hoja automáticamente, y generan el PDF directamente. Para unir ese PDF con otros documentos, puedes usar después la herramienta Unir PDFs.',
      ],
    },
  ],
  relatedTools: ['images-to-pdf', 'merge-pdfs'],
};

export default guide;
