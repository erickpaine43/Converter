import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import { CONTACT_EMAIL, OPERATOR_COUNTRY, OPERATOR_NAME } from '../lib/site';
import { TOOL_IDS, TOOL_LABELS, TOOL_SHORT_DESCS, pagePath, toolPath } from '../lib/tools';

export default function About() {
  return (
    <main className="home">
      <SeoHead title="Sobre nosotros" description="PDF Converter es un proyecto independiente de Erick Paine: herramientas gratuitas para unir, convertir y extraer contenido de PDFs directamente en el navegador." path={pagePath('about')} />
      <div className="info-section" style={{ marginTop: '2rem' }}>
        <h1 className="page-title">Sobre nosotros</h1>

        <h2>¿Qué es PDF Converter?</h2>
        <p>
          PDF Converter es una plataforma web gratuita diseñada para que cualquier persona
          pueda trabajar con archivos PDF de forma sencilla, rápida y segura, sin necesidad
          de instalar ningún programa ni crear una cuenta.
        </p>

        <h2>Quién está detrás</h2>
        <p>
          PDF Converter es un proyecto independiente creado y mantenido por {OPERATOR_NAME},
          desde {OPERATOR_COUNTRY}. No forma parte de ninguna empresa de software ni vende
          productos de terceros. El desarrollo de las herramientas, la redacción de las guías y
          la respuesta a los mensajes que llegan por el formulario de contacto están a su cargo.
        </p>
        <p>
          Puedes escribir directamente a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> o
          usar la <Link to={pagePath('contact')}>página de contacto</Link> para reportar un error,
          proponer una herramienta nueva o hacer cualquier consulta.
        </p>

        <h2>Nuestra misión</h2>
        <p>
          Creemos que las herramientas de productividad deben ser accesibles para todos. Por eso
          todas las herramientas de PDF Converter son gratuitas, sin registro, sin suscripciones y
          sin límite de conversiones. Los únicos límites son técnicos y por conversión (el tamaño
          y la cantidad de archivos que el navegador puede procesar a la vez), y están indicados en
          cada herramienta.
        </p>

        <h2>¿Por qué en el navegador?</h2>
        <p>
          A diferencia de otros servicios, todo el procesamiento de PDF Converter ocurre
          localmente en tu dispositivo. Esto significa que tus archivos nunca se envían a
          ningún servidor, garantizando total privacidad y seguridad para tus documentos.
        </p>

        <h2>Qué puedes hacer</h2>
        <ul>
          {TOOL_IDS.map(id => (
            <li key={id}><Link to={toolPath(id)}>{TOOL_LABELS[id]}</Link>: {TOOL_SHORT_DESCS[id]}.</li>
          ))}
        </ul>
        <p>
          También publicamos <Link to={pagePath('guides')}>guías prácticas</Link> para resolver los
          problemas más comunes con documentos PDF.
        </p>

        <h2>Cómo se mantiene el sitio</h2>
        <p>
          El sitio es gratuito para quien lo usa. Para cubrir sus costos puede mostrar anuncios de
          Google AdSense; los anuncios nunca tienen acceso a los archivos que procesas, porque esos
          archivos no salen de tu dispositivo. En la <Link to={pagePath('privacy')}>política de
          privacidad</Link> se explica qué cookies se usan y cómo gestionarlas.
        </p>

        <h2>Tecnología</h2>
        <p>
          Usamos tecnologías modernas de código abierto como <strong>pdf-lib</strong> y
          <strong> PDF.js</strong> (pdfjs-dist) para procesar los archivos directamente en el navegador,
          sin depender de infraestructura de backend.
        </p>
      </div>
    </main>
  );
}
