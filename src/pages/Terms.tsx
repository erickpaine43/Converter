import SeoHead from '../components/SeoHead';

export default function Terms() {
  return (
    <main className="home">
      <SeoHead title="Términos y Condiciones" description="Términos y condiciones de uso de PDF Converter." path="/terms" />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Términos y Condiciones</h1>
        <p><em>Última actualización: julio de 2025</em></p>

        <h2>1. Aceptación de los términos</h2>
        <p>
          Al usar PDF Converter aceptas estos términos. Si no estás de acuerdo, por favor
          no uses el servicio.
        </p>

        <h2>2. Descripción del servicio</h2>
        <p>
          PDF Converter es una herramienta gratuita que permite convertir, unir y extraer
          contenido de archivos PDF directamente en el navegador del usuario, sin necesidad
          de crear una cuenta ni instalar software.
        </p>

        <h2>3. Uso aceptable</h2>
        <p>
          Te comprometes a usar este servicio únicamente con archivos sobre los que tienes
          los derechos necesarios. No está permitido usar PDF Converter para procesar
          documentos de terceros sin su autorización.
        </p>

        <h2>4. Limitación de responsabilidad</h2>
        <p>
          PDF Converter se proporciona "tal cual". No garantizamos la precisión del resultado
          en todos los casos, especialmente con documentos muy complejos. No somos responsables
          de pérdidas de datos ni daños derivados del uso del servicio.
        </p>

        <h2>5. Propiedad intelectual</h2>
        <p>
          Todo el contenido del sitio (textos, diseño, código) es propiedad de PDF Converter.
          Los archivos que procesas son de tu exclusiva propiedad y responsabilidad.
        </p>

        <h2>6. Modificaciones</h2>
        <p>
          Nos reservamos el derecho de modificar o interrumpir el servicio en cualquier momento
          sin previo aviso.
        </p>

        <h2>7. Ley aplicable</h2>
        <p>
          Estos términos se rigen por la legislación vigente en el país de residencia del operador
          del servicio.
        </p>
      </div>
    </main>
  );
}
