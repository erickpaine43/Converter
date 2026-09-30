import type { Guide } from '../types';

// The tool details mirror src/converters/imagesToPdf.ts: images are embedded as
// is (not recompressed), so the PDF weighs roughly the sum of the photos.
const guide: Guide = {
  slug: 'como-reducir-el-peso-de-un-pdf',
  title: 'Cómo reducir el peso de un PDF',
  description: 'Por qué un PDF pesa tanto y cómo achicarlo: reduce las fotos antes de convertirlas, quita páginas que sobran y elige bien entre JPG y PNG. Guía paso a paso.',
  h1: 'Cómo reducir el peso de un PDF',
  summary: 'Qué hace que un PDF pese tanto y cómo achicarlo antes de enviarlo por correo o subirlo a un trámite.',
  published: '2026-09-30',
  updated: '2026-09-30',
  intro: [
    'Pocas cosas son tan frustrantes como terminar un documento y descubrir que el portal del trámite no lo acepta porque "supera el tamaño máximo", o que el correo rebota por el adjunto. La buena noticia es que casi siempre el problema tiene una causa concreta y fácil de resolver.',
    'En esta guía vas a ver de dónde sale el peso de un PDF, cómo evitar que crezca cuando lo armas a partir de fotos y qué opciones tienes cuando el archivo ya existe.',
  ],
  sections: [
    {
      title: 'De dónde sale el peso de un PDF',
      paragraphs: [
        'Un PDF con solo texto es muy liviano: un informe de decenas de páginas suele ocupar menos de 1 MB, porque el texto se guarda como caracteres y no como dibujo. Lo que dispara el tamaño son casi siempre las imágenes que lleva adentro.',
      ],
      items: [
        'Fotos sacadas con el celular: una foto de 12 megapíxeles ocupa entre 2 y 5 MB, y un PDF armado con diez fotos así puede pasar fácilmente de 30 MB.',
        'Páginas escaneadas: cada página es en realidad una imagen, y si se escaneó en color y a alta resolución, pesa como una foto.',
        'Capturas de pantalla en PNG: el formato PNG no pierde calidad, pero con fotos y fondos degradados genera archivos mucho más grandes que JPG.',
        'Fuentes incrustadas y elementos gráficos complejos: influyen menos, pero en documentos de diseño también suman.',
      ],
    },
    {
      title: 'Si vas a crear el PDF a partir de fotos: achícalas antes',
      paragraphs: [
        'Es el punto donde más se gana. Nuestra herramienta de Imágenes a PDF inserta cada foto tal cual, sin volver a comprimirla, para no perder calidad: por eso el PDF final pesa aproximadamente lo mismo que la suma de las imágenes. Si reduces las fotos antes, el PDF sale proporcionalmente más liviano.',
        'Para un documento que se va a leer en pantalla o imprimir en A4, no hace falta la resolución completa de la cámara: entre 1500 y 2000 píxeles en el lado más largo alcanza para que el texto se lea con claridad.',
      ],
      steps: [
        'En Windows, abre la foto con Paint y usa «Cambiar tamaño»: elige «Píxeles», deja marcada la opción de mantener la relación de aspecto y escribe 2000 en el lado más largo.',
        'En Mac, ábrela con Vista Previa y usa Herramientas → «Ajustar tamaño».',
        'En el celular, muchas galerías y apps de mensajería permiten exportar o compartir la foto en un tamaño menor; también puedes bajar la resolución de la cámara si vas a fotografiar muchos documentos.',
        'Guarda las fotos como JPG (no como PNG) y conviértelas a PDF con la herramienta de Imágenes a PDF.',
      ],
    },
    {
      title: 'Si el PDF ya existe',
      paragraphs: [
        'Cuando no tienes las imágenes originales, hay que trabajar sobre el propio PDF. Estas son las opciones más habituales, de la más simple a la más completa:',
      ],
      items: [
        'Quitar las páginas que sobran: si solo necesitas algunas, abre el PDF en Chrome o Edge, pulsa Ctrl+P, elige «Guardar como PDF» como destino e indica el rango de páginas. Obtienes un PDF nuevo solo con esas páginas.',
        'Exportar con un filtro de reducción en Mac: en Vista Previa, Archivo → Exportar y, en «Filtro Quartz», elige «Reduce File Size». Achica mucho, pero puede bajar demasiado la calidad de las imágenes: revisa el resultado.',
        'Usar un programa de compresión: aplicaciones de escritorio como Adobe Acrobat tienen una opción para reducir el tamaño del archivo que recomprime las imágenes con distintos niveles de calidad.',
      ],
    },
    {
      title: 'Una advertencia sobre los compresores online',
      paragraphs: [
        'Muchos sitios ofrecen comprimir PDFs gratis, pero la mayoría lo hace subiendo tu archivo a sus servidores. Si el documento tiene datos personales, contratos o información de trabajo, piensa antes si quieres que salga de tu equipo. Por ese motivo todas las herramientas de PDF Converter funcionan dentro de tu navegador: hoy no incluyen un compresor, pero sí te permiten armar el PDF liviano desde el principio.',
      ],
    },
    {
      title: 'Límites de tamaño habituales',
      items: [
        'Correo electrónico: Gmail admite adjuntos de hasta 25 MB; otros servicios tienen límites parecidos o menores.',
        'Portales de trámites y postulaciones: es común que pidan archivos de entre 2 y 10 MB. Revisa el límite antes de armar el PDF para saber cuánto tienes que reducir las fotos.',
        'Mensajería: como documento, WhatsApp acepta archivos grandes, pero quien lo recibe lo tiene que descargar entero; un PDF liviano se abre más rápido.',
      ],
    },
  ],
  relatedTools: ['images-to-pdf', 'merge-pdfs'],
};

export default guide;
