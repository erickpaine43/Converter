import type { Guide } from '../types';

// PDF to Text doesn't do OCR (src/converters/pdfToText.ts reads the text layer
// with PDF.js); this guide depends on that.
const guide: Guide = {
  slug: 'que-hacer-si-un-pdf-esta-escaneado',
  title: 'PDF escaneado: cómo saberlo y qué hacer',
  description: 'Si no puedes seleccionar ni copiar el texto de un PDF, probablemente es un escaneo. Cómo comprobarlo y cómo sacar el texto con reconocimiento óptico (OCR).',
  h1: 'Qué hacer si un PDF está escaneado',
  summary: 'Cómo saber si un PDF es un escaneo, por qué no se puede copiar su texto y qué herramientas de OCR usar para recuperarlo.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Abres un PDF, intentas copiar un párrafo y no se selecciona nada. O usas la búsqueda del lector y no encuentra una palabra que estás viendo en pantalla. En casi todos los casos la explicación es la misma: el PDF es un escaneo.',
    'Un PDF escaneado no contiene texto, sino fotos de las páginas. Para la computadora es lo mismo que una imagen: puede mostrarla, pero no sabe qué letras hay dibujadas en ella.',
  ],
  sections: [
    {
      title: 'Cómo comprobar si un PDF es un escaneo',
      steps: [
        'Intenta seleccionar una línea de texto con el mouse (o manteniendo el dedo en el celular). Si se marca un rectángulo sobre toda la página en vez de las palabras, es una imagen.',
        'Usa la búsqueda del lector (Ctrl+F) con una palabra que se vea en la página. Si no aparece ningún resultado, el texto no está en forma digital.',
        'Si lo pasas por la herramienta PDF a Texto y el resultado sale vacío, confirma lo mismo: esa herramienta lee el texto digital del PDF y no hace reconocimiento de imágenes.',
      ],
      paragraphs: [
        'Algunos PDFs son mixtos: un escaneo al que ya se le aplicó OCR, con una capa de texto invisible encima de la imagen. En ese caso sí puedes seleccionar y copiar, aunque puede haber errores donde el reconocimiento falló.',
      ],
    },
    {
      title: 'La solución: reconocimiento óptico de caracteres (OCR)',
      paragraphs: [
        'El OCR analiza la imagen de la página, identifica las letras y genera texto que sí se puede copiar, editar o buscar. Hay varias formas gratuitas de hacerlo:',
      ],
      items: [
        'Google Drive: sube el PDF, haz clic derecho sobre él y elige «Abrir con» → «Documentos de Google». Drive crea un documento nuevo con el texto reconocido debajo de cada imagen. Funciona mejor con archivos livianos y de pocas páginas.',
        'Google Lens (Android, iPhone o el navegador Chrome): apunta a una página o abre una imagen, toca «Texto» y copia lo que necesites.',
        'Texto en vivo del iPhone o iPad: en una foto o captura, mantén el dedo sobre el texto para seleccionarlo y copiarlo.',
        'Programas de escritorio: Adobe Acrobat (de pago) tiene una función de reconocimiento de texto que agrega la capa de texto al propio PDF, sin cambiar su aspecto.',
      ],
    },
    {
      title: 'Un flujo práctico para PDFs de varias páginas',
      steps: [
        'Convierte el PDF en imágenes con la herramienta PDF a Imágenes, en calidad Media o Alta y formato PNG (el texto queda más nítido y el OCR comete menos errores).',
        'Pasa cada imagen por Google Lens o Texto en vivo y copia el texto a un documento; o sube el PDF entero a Google Drive si no es muy pesado.',
        'Revisa el resultado con el documento original al lado: el OCR suele confundir la «l» con el «1», la «O» con el «0» y separar mal las columnas.',
      ],
    },
    {
      title: 'Cómo obtener mejores resultados',
      items: [
        'Si todavía puedes volver a escanear, hazlo a 300 ppp (puntos por pulgada): es la resolución que mejor equilibra calidad y tamaño para el OCR.',
        'Que las páginas estén derechas y bien iluminadas, sin sombras ni reflejos. Una página torcida o con poco contraste es la principal causa de errores.',
        'Las tablas y los textos a dos columnas se reconocen peor: puede convenir recortar la imagen por partes.',
        'La letra manuscrita se reconoce con mucha menos precisión que la impresa.',
      ],
    },
    {
      title: '¿Y si no necesitas el texto?',
      paragraphs: [
        'Si solo tienes que enviar, archivar o imprimir el documento, un PDF escaneado sirve perfectamente tal como está. Puedes unirlo con otros PDFs sin problema. Solo si pesa demasiado conviene prestarle atención a la resolución del escaneo: en la guía para reducir el peso de un PDF tienes opciones.',
      ],
    },
  ],
  relatedTools: ['pdf-to-text', 'pdf-to-images'],
};

export default guide;
