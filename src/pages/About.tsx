import SeoHead from '../components/SeoHead';

export default function About() {
  return (
    <main className="home">
      <SeoHead title="Sobre Nosotros" description="Conoce PDF Converter: herramientas gratuitas para unir, convertir y extraer contenido de PDFs que funcionan en tu navegador, sin registro ni servidores." path="/about" />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Sobre Nosotros</h1>

        <h2>¿Qué es PDF Converter?</h2>
        <p>
          PDF Converter es una plataforma web gratuita diseñada para que cualquier persona
          pueda trabajar con archivos PDF de forma sencilla, rápida y segura, sin necesidad
          de instalar ningún programa ni crear una cuenta.
        </p>

        <h2>Nuestra misión</h2>
        <p>
          Creemos que las herramientas de productividad deben ser accesibles para todos.
          Por eso construimos PDF Converter como una solución 100% gratuita que funciona
          directamente en el navegador, sin registro ni suscripciones ocultas — gratis para uso normal.
        </p>

        <h2>¿Por qué en el navegador?</h2>
        <p>
          A diferencia de otros servicios, todo el procesamiento de PDF Converter ocurre
          localmente en tu dispositivo. Esto significa que tus archivos nunca se envían a
          ningún servidor, garantizando total privacidad y seguridad para tus documentos.
        </p>

        <h2>Tecnología</h2>
        <p>
          Usamos tecnologías modernas de código abierto como <strong>pdf-lib</strong> y
          <strong> pdfjs-dist</strong> para procesar los archivos directamente en el navegador,
          sin depender de infraestructura de backend.
        </p>
      </div>
    </main>
  );
}
