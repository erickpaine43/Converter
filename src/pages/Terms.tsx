import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { MAX_FILE_SIZE_MB } from '../lib/fileLimits';
import { CONTACT_EMAIL, OPERATOR_COUNTRY, OPERATOR_NAME } from '../lib/site';
import { pagePath } from '../lib/tools';

export default function Terms() {
  return (
    <main className="home">
      <SeoHead title="Términos y condiciones" description="Términos de uso de PDF Converter: quién opera el servicio gratuito, el uso aceptable de las herramientas, los límites de responsabilidad y la ley aplicable." path={pagePath('terms')} />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Términos y condiciones</h1>
        {/* Bump this date whenever the terms change. */}
        <p><em>Última actualización: 30 de septiembre de 2026</em></p>

        <h2>1. Quién ofrece el servicio</h2>
        <p>
          PDF Converter es un sitio web operado por {OPERATOR_NAME}, con residencia en {OPERATOR_COUNTRY}
          (en adelante, «el operador»). Puedes comunicarte escribiendo
          a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o desde
          la <Link to={pagePath('contact')}>página de contacto</Link>.
        </p>

        <h2>2. Aceptación de los términos</h2>
        <p>
          Al usar PDF Converter aceptas estos términos. Si no estás de acuerdo, por favor
          no uses el servicio.
        </p>

        <h2>3. Descripción del servicio</h2>
        <p>
          PDF Converter es una herramienta gratuita que permite convertir, unir y extraer
          contenido de archivos PDF directamente en el navegador del usuario, sin necesidad
          de crear una cuenta ni instalar software. Los archivos se procesan en tu dispositivo y
          no se suben a los servidores del sitio.
        </p>
        <p>
          El uso es gratuito y no tiene un límite de conversiones. Cada herramienta tiene límites
          técnicos por conversión (por ejemplo, archivos de hasta {MAX_FILE_SIZE_MB} MB y una cantidad
          máxima de archivos a la vez), que se indican en su propia página. Además, la velocidad y el
          tamaño máximo que se puede procesar dependen de la memoria de tu dispositivo.
        </p>

        <h2>4. Uso aceptable</h2>
        <p>
          Te comprometes a usar este servicio únicamente con archivos sobre los que tienes
          los derechos necesarios, y a no utilizarlo para fines ilícitos. No está permitido usar
          PDF Converter para procesar documentos de terceros sin su autorización, ni intentar
          interferir con el funcionamiento del sitio.
        </p>

        <h2>5. Publicidad y servicios de terceros</h2>
        <p>
          El sitio puede mostrar anuncios de Google AdSense y usa Google Analytics para medir su uso,
          según se explica en la <Link to={pagePath('privacy')}>política de privacidad</Link>. Los
          anuncios y los enlaces a sitios externos son responsabilidad de sus anunciantes o titulares;
          el operador no controla ni respalda su contenido.
        </p>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          PDF Converter se proporciona «tal cual» y «según disponibilidad». No garantizamos la
          precisión del resultado en todos los casos, especialmente con documentos muy complejos, ni
          que el servicio esté disponible sin interrupciones. Te recomendamos conservar siempre una
          copia de tus archivos originales. En la medida en que lo permita la ley, el operador no
          será responsable de pérdidas de datos ni de daños derivados del uso del servicio.
        </p>

        <h2>7. Propiedad intelectual</h2>
        <p>
          Los textos, las guías y el diseño del sitio pertenecen al operador. Las librerías de código
          abierto que usa el sitio (como pdf-lib y PDF.js) mantienen sus propias licencias. Los
          archivos que procesas son de tu exclusiva propiedad y responsabilidad.
        </p>

        <h2>8. Modificaciones</h2>
        <p>
          El operador puede modificar o interrumpir el servicio, o actualizar estos términos, en
          cualquier momento. Los cambios se publicarán en esta página con su fecha de actualización.
        </p>

        <h2>9. Ley aplicable y jurisdicción</h2>
        <p>
          Estos términos se rigen por las leyes de la República de {OPERATOR_COUNTRY}. Cualquier
          controversia se someterá a los tribunales competentes de {OPERATOR_COUNTRY}, sin perjuicio
          de los derechos que te reconozcan como consumidor las normas imperativas de tu país de
          residencia.
        </p>
      </div>
    </main>
  );
}
