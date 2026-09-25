import SeoHead from '../components/SeoHead';

export default function Privacy() {
  return (
    <main className="home">
      <SeoHead title="Política de Privacidad" description="Lee nuestra política de privacidad. Tus archivos se procesan localmente y nunca se suben a ningún servidor." path="/privacy" />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Política de Privacidad</h1>
        {/* Actualizar a mano cada vez que cambie algo relevante del comportamiento del sitio. */}
        <p><em>Última actualización: septiembre de 2026</em></p>

        <h2>1. Procesamiento de archivos</h2>
        <p>
          PDF Converter procesa todos los archivos <strong>localmente en tu navegador</strong>.
          Ningún archivo que subas es enviado, almacenado ni procesado en servidores externos.
          Tus documentos nunca abandonan tu dispositivo.
        </p>

        <h2>2. Datos que recopilamos</h2>
        <p>
          No recopilamos datos personales identificables. Podemos utilizar cookies de análisis
          anónimas (como Google Analytics) para entender cómo se usa el sitio de manera agregada,
          sin identificar a usuarios individuales.
        </p>
        <p>
          Si nos escribes a través del formulario de contacto, recibimos el nombre, email y
          mensaje que ingreses (el envío se gestiona con Netlify Forms, el servicio donde está
          alojado el sitio). Solo usamos esos datos para responderte.
        </p>

        <h2>3. Google AdSense</h2>
        <p>
          {/* AdSense aún no está activo: volver a redactar en afirmativo cuando se active. */}
          Este sitio puede utilizar Google AdSense para mostrar publicidad en el futuro. Si se
          activa, Google podrá usar cookies para mostrar anuncios relevantes basados en tus
          visitas anteriores. Puedes gestionar
          tus preferencias de anuncios en{' '}
          <a href="https://adssettings.google.com" target="_blank" rel="noreferrer">adssettings.google.com</a>.
        </p>

        <h2>4. Cookies</h2>
        <p>
          Usamos cookies estrictamente necesarias para el funcionamiento del sitio, cookies de
          análisis (Google Analytics) y, si en el futuro se activa la publicidad, cookies de
          terceros relacionadas con ella (AdSense). No usamos cookies para rastrear
          tu actividad fuera de este sitio.
        </p>

        <h2>5. Seguridad</h2>
        <p>
          Al procesar todo en el navegador, no existe riesgo de filtración de tus archivos
          desde nuestros sistemas, ya que no los almacenamos. Te recomendamos usar conexiones
          seguras (HTTPS) al acceder al sitio.
        </p>

        <h2>6. Cambios en esta política</h2>
        <p>
          Podemos actualizar esta política ocasionalmente. Los cambios se publicarán en esta
          misma página con la fecha de actualización correspondiente.
        </p>

        <h2>7. Contacto</h2>
        <p>
          Si tienes preguntas sobre esta política, puedes contactarnos a través de nuestra
          página de contacto.
        </p>
      </div>
    </main>
  );
}
