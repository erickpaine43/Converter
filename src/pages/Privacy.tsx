import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { openCookiePreferences } from '../lib/cookieConsent';
import { CONTACT_EMAIL, OPERATOR_COUNTRY, OPERATOR_NAME, SITE_NAME } from '../lib/site';
import { pagePath } from '../lib/tools';

// Section 5 holds the disclosures AdSense requires: third parties such as Google
// use cookies to serve ads based on prior visits, Google's advertising cookies,
// and how to opt out (Ads Settings and aboutads.info). See
// https://support.google.com/adsense/answer/1348695. The GA durations come from
// the GA4 property's data retention settings and must match them.
const ext = { target: '_blank', rel: 'noreferrer' } as const;

export default function Privacy() {
  return (
    <main className="home">
      <SeoHead title="Política de privacidad" description="Privacidad en PDF Converter: tus archivos se procesan en tu navegador. Qué datos se recogen, qué cookies usan Google Analytics y AdSense, y tus derechos." path={pagePath('privacy')} />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Política de privacidad</h1>
        {/* Bump this date whenever the site's data handling changes. */}
        <p><em>Última actualización: 30 de septiembre de 2026</em></p>

        <p>
          Esta política explica qué datos personales se tratan cuando visitas {SITE_NAME}, con qué
          finalidad, durante cuánto tiempo y qué derechos tienes. Aplica a todas las páginas de este
          sitio.
        </p>

        <h2>1. Responsable del tratamiento</h2>
        <p>
          El responsable del tratamiento de los datos es {OPERATOR_NAME}, operador de {SITE_NAME},
          con residencia en {OPERATOR_COUNTRY}. Para cualquier consulta sobre privacidad o para ejercer
          tus derechos, escribe a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>2. Tus archivos no salen de tu dispositivo</h2>
        <p>
          Todas las herramientas procesan los archivos <strong>localmente en tu navegador</strong>.
          Los PDFs, imágenes y documentos HTML que eliges no se envían, almacenan ni procesan en
          ningún servidor, y ni el operador ni terceros (incluidos los anunciantes) tienen acceso a
          su contenido.
        </p>

        <h2>3. Datos que se recogen</h2>
        <p>Aunque tus archivos no se recogen, al usar el sitio sí se tratan algunos datos personales:</p>

        <h3>a) Datos técnicos del alojamiento</h3>
        <p>
          El sitio está alojado en Netlify. Como cualquier servidor web, al servir las páginas
          procesa datos técnicos de la conexión, como la dirección IP, el navegador y la página
          solicitada, con el fin de entregar el contenido y proteger el servicio frente a abusos.
        </p>

        <h3>b) Estadísticas de uso (Google Analytics)</h3>
        <p>
          Si lo aceptas en el aviso de cookies, usamos Google Analytics 4 para saber de forma
          agregada qué páginas y herramientas se usan. Google Analytics utiliza cookies con un
          identificador aleatorio y recibe datos como las páginas visitadas, el tipo de dispositivo
          y navegador y la ubicación aproximada, derivada de la dirección IP. Según Google, Google
          Analytics 4 no registra ni almacena las direcciones IP. No enviamos a Google Analytics el
          nombre ni el contenido de tus archivos. Si rechazas las cookies, Google Analytics no se carga.
        </p>

        <h3>c) Formulario de contacto</h3>
        <p>
          Si nos escribes desde la <Link to={pagePath('contact')}>página de contacto</Link>, recibimos
          el nombre, el email y el mensaje que ingreses. El envío se gestiona con Netlify Forms, del
          proveedor de alojamiento. Esos datos solo se usan para responderte.
        </p>

        <h3>d) Publicidad (Google AdSense)</h3>
        <p>
          El sitio puede mostrar anuncios de Google AdSense. Los datos que se tratan con ese fin se
          describen en la sección siguiente.
        </p>

        <h2>4. Finalidades y bases legales</h2>
        <ul>
          <li><strong>Servir el sitio y mantenerlo seguro</strong> (datos técnicos): interés legítimo en que el servicio funcione.</li>
          <li><strong>Estadísticas de uso</strong> (Google Analytics): tu consentimiento, que puedes retirar en cualquier momento.</li>
          <li><strong>Publicidad</strong> (Google AdSense): tu consentimiento para el uso de cookies y, cuando corresponda, para los anuncios personalizados.</li>
          <li><strong>Responder consultas</strong> (formulario de contacto): tu consentimiento al enviarnos el mensaje.</li>
        </ul>

        <h2>5. Publicidad de Google y cookies de terceros</h2>
        <p>
          Los proveedores externos, incluido Google, utilizan cookies para mostrar anuncios basados
          en las visitas anteriores que un usuario ha hecho a este sitio web o a otros sitios web.
        </p>
        <p>
          El uso de cookies publicitarias por parte de Google permite que Google y sus socios
          muestren anuncios a los usuarios en función de sus visitas a este sitio web y a otros
          sitios de Internet. Por lo tanto, sí es posible que las cookies de publicidad se usen para
          reconocer tu navegador fuera de este sitio.
        </p>
        <p>
          Puedes inhabilitar la publicidad personalizada en
          la <a href="https://adssettings.google.com" {...ext}>Configuración de anuncios de Google</a>.
          También puedes inhabilitar las cookies que usan otros proveedores externos para la
          publicidad personalizada en <a href="https://www.aboutads.info/choices/" {...ext}>www.aboutads.info</a> y,
          en Europa, en <a href="https://www.youronlinechoices.eu/" {...ext}>www.youronlinechoices.eu</a>.
          Para saber cómo usa Google los datos de los sitios que utilizan sus servicios,
          consulta <a href="https://policies.google.com/technologies/partner-sites" {...ext}>esta página de Google</a>.
        </p>
        <p>
          Si visitas el sitio desde el Espacio Económico Europeo, el Reino Unido o Suiza, el
          consentimiento para la publicidad se gestiona con la plataforma de gestión de
          consentimiento de Google, certificada según el Marco de Transparencia y Consentimiento
          (TCF) de IAB Europe, que muestra la lista de proveedores publicitarios y te permite
          aceptar o rechazar cada finalidad. Sin tu consentimiento, solo pueden mostrarse anuncios
          no personalizados.
        </p>

        <h2>6. Cookies y almacenamiento local</h2>
        <p>
          Estas son las cookies y datos que se guardan en tu navegador. Las de análisis y publicidad
          solo se activan si las aceptas.
        </p>
        <div className="table-scroll">
          <table className="legal-table">
            <thead>
              <tr><th>Nombre</th><th>Proveedor</th><th>Finalidad</th><th>Duración</th></tr>
            </thead>
            <tbody>
              <tr><td>cookie-consent (almacenamiento local)</td><td>{SITE_NAME}</td><td>Recordar tu respuesta al aviso de cookies.</td><td>Hasta que la borres o cambies tus preferencias.</td></tr>
              <tr><td>_ga, _ga_*</td><td>Google Analytics</td><td>Distinguir visitas de forma anónima para las estadísticas.</td><td>Hasta 2 años.</td></tr>
              <tr><td>__gads, __gpi, __eoi</td><td>Google AdSense</td><td>Mostrar anuncios y medir su rendimiento; limitar cuántas veces ves el mismo anuncio.</td><td>Hasta 13 meses.</td></tr>
              <tr><td>IDE, otras de doubleclick.net</td><td>Google</td><td>Publicidad personalizada, solo con tu consentimiento.</td><td>Hasta 13 meses.</td></tr>
              <tr><td>FCCDCF, FCNEC</td><td>Google (gestión del consentimiento)</td><td>Guardar tus preferencias de consentimiento en el EEE, Reino Unido y Suiza.</td><td>Hasta 13 meses.</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          Puedes cambiar tu decisión en cualquier momento desde{' '}
          <button type="button" className="inline-link-button" onClick={openCookiePreferences}>Preferencias de cookies</button>{' '}
          (también en el pie de cada página), o borrar las cookies desde la configuración de tu navegador.
        </p>

        <h2>7. Plazos de conservación</h2>
        <ul>
          <li><strong>Google Analytics:</strong> los datos de eventos se conservan 2 meses; los datos asociados al usuario y a sus cookies, 14 meses, y ese plazo se reinicia con cada nueva visita.</li>
          <li><strong>Mensajes del formulario de contacto:</strong> los conservamos el tiempo necesario para responder tu consulta y los eliminamos periódicamente. También puedes pedir en cualquier momento que borremos los tuyos (ver sección 9).</li>
          <li><strong>Datos técnicos del alojamiento:</strong> los plazos que aplica Netlify en sus registros de servidor.</li>
          <li><strong>Publicidad:</strong> los plazos de las cookies indicados en la tabla anterior y los que fija Google en su política de privacidad.</li>
        </ul>

        <h2>8. Con quién se comparten los datos</h2>
        <p>
          No vendemos datos personales. Solo intervienen los proveedores necesarios para que el sitio
          funcione: Netlify (alojamiento y formulario de contacto) y Google (Google Analytics y Google
          AdSense). Estos proveedores pueden tratar los datos en Estados Unidos y en otros países;
          Google y Netlify aplican garantías para las transferencias internacionales, como las
          cláusulas contractuales tipo de la Comisión Europea.
        </p>

        <h2>9. Tus derechos</h2>
        <p>
          Según la Ley 81 de 2019 de protección de datos personales de {OPERATOR_COUNTRY} y, si
          visitas el sitio desde el Espacio Económico Europeo, el Reglamento General de Protección
          de Datos (RGPD), tienes derecho a:
        </p>
        <ul>
          <li>acceder a tus datos y saber cómo se tratan;</li>
          <li>rectificarlos si son inexactos;</li>
          <li>pedir que se eliminen (cancelación o supresión);</li>
          <li>oponerte a su tratamiento o pedir que se limite;</li>
          <li>recibirlos en un formato portable;</li>
          <li>retirar tu consentimiento en cualquier momento, sin que eso afecte al tratamiento previo.</li>
        </ul>
        <p>
          Para ejercerlos, escribe a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Te
          responderemos en un plazo máximo de un mes. Si consideras que no se respetaron tus
          derechos, puedes presentar un reclamo ante la Autoridad Nacional de Transparencia y Acceso
          a la Información (ANTAI) de {OPERATOR_COUNTRY} o, si resides en el Espacio Económico
          Europeo, ante la autoridad de protección de datos de tu país.
        </p>

        <h2>10. Menores de edad</h2>
        <p>
          El sitio no está dirigido a menores de 16 años y no recoge a sabiendas datos de menores.
        </p>

        <h2>11. Seguridad</h2>
        <p>
          Al procesar los archivos en el navegador, no existe riesgo de filtración de tus documentos
          desde nuestros sistemas, porque no los almacenamos. El sitio se sirve siempre mediante una
          conexión cifrada (HTTPS).
        </p>

        <h2>12. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política cuando cambie el funcionamiento del sitio o la normativa.
          Los cambios se publicarán en esta misma página con la fecha de actualización correspondiente.
        </p>
      </div>
    </main>
  );
}
