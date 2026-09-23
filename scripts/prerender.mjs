// Genera HTML estático por ruta (title/description/canonical/H1 ya presentes
// en el marcado crudo, sin depender de que el crawler ejecute JS) a partir del
// bundle SSR construido en dist-ssr/. Se corre después de `vite build`.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');
const ssrEntry = path.join(ssrDir, 'entry-server.js');

const ROUTES = [
  '/',
  '/converter/images-to-pdf',
  '/converter/html-to-pdf',
  '/converter/pdf-to-images',
  '/converter/merge-pdfs',
  '/converter/pdf-to-text',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
];

function outputPathFor(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  return path.join(distDir, route.replace(/^\//, ''), 'index.html');
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
  const { render } = await import(pathToFileURL(ssrEntry).href);

  for (const route of ROUTES) {
    const rendered = render(route);
    const page = injectIntoTemplate(template, rendered);
    const outPath = outputPathFor(route);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, page, 'utf-8');
    console.log(`prerendered ${route} -> ${path.relative(root, outPath)}`);
  }

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
