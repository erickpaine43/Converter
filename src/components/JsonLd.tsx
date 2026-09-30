// Structured data (Schema.org) as JSON-LD. React doesn't hoist <script> into
// <head>, so it stays in <body>; Google reads it from there just fine, and since
// it's pre-rendered it's in the HTML without relying on JS.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escaped "<": text containing "</script>" can't close the tag early.
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
