// Genera HTML estático por ruta (title/description/canonical/H1 ya presentes
// en el marcado crudo, sin depender de que el crawler ejecute JS) a partir del
// bundle SSR construido en dist-ssr/, y dist/sitemap.xml a partir de la misma
// lista de rutas. Se corre después de `vite build`.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const ssrEntry = path.join(ssrDir, 'entry-server.js');

// Cualquier ruta que no matchee en AppRoutes cae en el catch-all <NotFound />;
// se renderiza con esta URL inventada y se escribe como dist/404.html.
const NOT_FOUND_ROUTE = '/__not-found__';

// Cada ruta sale como <ruta>/index.html, que Netlify sirve con 200 en la URL
// CON barra final (/about/); /about responde 301 hacia ahí. Por eso canonical,
// og:url y sitemap.xml usan siempre la forma con barra (ver SeoHead.tsx).
// La 404 es la excepción: va a dist/404.html, que Netlify sirve con status 404.
function outputPathFor(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  if (route === NOT_FOUND_ROUTE) return path.join(distDir, '404.html');
  return path.join(distDir, route.replace(/^\//, ''), 'index.html');
}

// Archivos cuyo contenido define cada página, para el <lastmod> del sitemap.
// Las herramientas comparten ConverterPage.tsx (textos, FAQ, metadata), así que
// un cambio ahí actualiza la fecha de las 5. Si se agrega una ruta sin entrada
// acá, el build falla a propósito.
const TOOL_WIDGETS = {
  'merge-pdfs': 'MergePdfs.tsx',
  'images-to-pdf': 'imagesToPdf.tsx',
  'pdf-to-images': 'PdfToImages.tsx',
  'pdf-to-text': 'PdfToText.tsx',
  'html-to-pdf': 'HtmlToPdf.tsx',
};

function pageSources(toolSlugs) {
  const sources = {
    '/': ['src/pages/Home.tsx'],
    '/about': ['src/pages/About.tsx'],
    '/contact': ['src/pages/Contact.tsx'],
    '/privacy': ['src/pages/Privacy.tsx'],
    '/terms': ['src/pages/Terms.tsx'],
  };
  for (const [id, slug] of Object.entries(toolSlugs)) {
    if (!TOOL_WIDGETS[id]) throw new Error(`Falta el componente de la herramienta "${id}" en TOOL_WIDGETS (scripts/prerender.mjs).`);
    sources[`/${slug}`] = ['src/pages/ConverterPage.tsx', `src/components/converters/${TOOL_WIDGETS[id]}`];
  }
  return sources;
}

const today = () => new Date().toISOString().slice(0, 10);

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// Fecha (YYYY-MM-DD) del último commit que tocó los archivos de la página. Si
// hay cambios sin commitear en ellos (build local), o no hay historial de git
// disponible, se usa la fecha de hoy.
function lastModified(files) {
  for (const file of files) {
    if (!existsSync(path.join(root, file))) throw new Error(`No existe ${file} (pageSources en scripts/prerender.mjs).`);
  }
  try {
    if (git(['status', '--porcelain', '--', ...files])) return today();
    return git(['log', '-1', '--format=%cs', '--', ...files]) || today();
  } catch {
    return today();
  }
}

function buildSitemap(routes, sources, canonicalUrl) {
  const urls = routes.map(route => {
    if (!sources[route]) throw new Error(`La ruta ${route} no tiene archivos fuente en pageSources (scripts/prerender.mjs).`);
    return `  <url><loc>${canonicalUrl(route)}</loc><lastmod>${lastModified(sources[route])}</lastmod></url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

// React 19 hoistea <title>/<meta>/<link> al PRINCIPIO del string de
// renderToString, de forma contigua, sin importar dónde se hayan renderizado
// en el árbol. Los separamos del resto (el HTML real de #root).
const HOISTED_TAG_RE = /^(<title>[\s\S]*?<\/title>|<meta[^>]*\/>|<link[^>]*\/>)/;

function splitHoisted(html) {
  let rest = html;
  const head = [];
  let match;
  while ((match = rest.match(HOISTED_TAG_RE))) {
    head.push(match[1]);
    rest = rest.slice(match[1].length);
  }
  return { head: head.join('\n    '), body: rest };
}

function injectIntoTemplate(template, rendered) {
  const { head, body } = splitHoisted(rendered);

  // saca el <title> estático del shell: el render ya trae el suyo propio.
  let page = template.replace(/<title>[\s\S]*?<\/title>/, '');
  page = page.replace('</head>', `    ${head}\n  </head>`);
  page = page.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  return page;
}

async function main() {
  if (!existsSync(ssrEntry)) {
    throw new Error(`No se encontró el bundle SSR en ${ssrEntry}. Corré "vite build --ssr src/entry-server.tsx --outDir dist-ssr" antes.`);
  }
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');
  // La lista de rutas vive en src/lib/tools.ts y llega re-exportada por el bundle SSR.
  const { render, PRERENDER_ROUTES, TOOL_SLUGS, canonicalUrl } = await import(pathToFileURL(ssrEntry).href);

  for (const route of [...PRERENDER_ROUTES, NOT_FOUND_ROUTE]) {
    const rendered = render(route);
    const page = injectIntoTemplate(template, rendered);
    const outPath = outputPathFor(route);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, page, 'utf-8');
    console.log(`prerendered ${route} -> ${path.relative(root, outPath)}`);
  }

  // Mismas rutas que se acaban de pre-renderizar (la 404 no va al sitemap).
  const sitemap = buildSitemap(PRERENDER_ROUTES, pageSources(TOOL_SLUGS), canonicalUrl);
  await writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8');
  console.log(`sitemap -> dist/sitemap.xml (${PRERENDER_ROUTES.length} URLs)`);

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
