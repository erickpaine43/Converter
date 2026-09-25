// Datos estructurados (Schema.org) como JSON-LD. React no hoistea <script> al
// <head>, así que queda en el <body>: Google lo lee igual desde ahí, y como se
// renderiza en el pre-render está en el HTML sin depender de JS.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // "<" escapado: un texto con "</script>" no puede cerrar el tag antes de tiempo.
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
