// Generates static HTML per route (title/description/canonical/H1 already in
// the raw markup, without relying on crawlers running JS) from the SSR bundle
// built into dist-ssr/, plus dist/sitemap.xml from the same route list. Runs
// after `vite build`.
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

// Any route that doesn't match in AppRoutes hits the <NotFound /> catch-all; it's
// rendered with this made-up URL and written to dist/404.html.
const NOT_FOUND_ROUTE = '/__not-found__';

// Each route is written as <route>/index.html, which Netlify serves with 200 at
// the URL WITH trailing slash (/contacto/); /contacto 301s there. That's why
// canonical, og:url and sitemap.xml always use the trailing-slash form (see
// SeoHead.tsx). The 404 is the exception: it goes to dist/404.html, which
// Netlify serves with a 404 status.
function outputPathFor(route) {
  if (route === '/') return path.join(distDir, 'index.html');
  if (route === NOT_FOUND_ROUTE) return path.join(distDir, '404.html');
  return path.join(distDir, route.replace(/^\//, ''), 'index.html');
}

// Files whose content defines each page, used for the sitemap's <lastmod>.
// All tools share ConverterPage.tsx (texts, FAQ, metadata), so a change there
// updates the date of all 5. Each guide has its own file in
// src/content/guides/. Adding a route without an entry here fails the build on
// purpose.
const TOOL_WIDGETS = {
  'merge-pdfs': 'MergePdfs.tsx',
  'images-to-pdf': 'imagesToPdf.tsx',
  'pdf-to-images': 'PdfToImages.tsx',
  'pdf-to-text': 'PdfToText.tsx',
  'html-to-pdf': 'HtmlToPdf.tsx',
};

function pageSources(toolSlugs, pageSlugs, guideFiles) {
  const sources = {
    '/': ['src/pages/Home.tsx'],
    [`/${pageSlugs.about}`]: ['src/pages/About.tsx'],
    [`/${pageSlugs.contact}`]: ['src/pages/Contact.tsx'],
    [`/${pageSlugs.privacy}`]: ['src/pages/Privacy.tsx'],
    [`/${pageSlugs.terms}`]: ['src/pages/Terms.tsx'],
    [`/${pageSlugs.guides}`]: ['src/pages/GuidesIndex.tsx', 'src/content/guides/index.ts'],
  };
  for (const [slug, file] of Object.entries(guideFiles)) {
    sources[`/${pageSlugs.guides}/${slug}`] = [`src/content/guides/${file}`];
  }
  for (const [id, slug] of Object.entries(toolSlugs)) {
    if (!TOOL_WIDGETS[id]) throw new Error(`Missing component for tool "${id}" in TOOL_WIDGETS (scripts/prerender.mjs).`);
    sources[`/${slug}`] = ['src/pages/ConverterPage.tsx', `src/components/converters/${TOOL_WIDGETS[id]}`];
  }
  return sources;
}

const today = () => new Date().toISOString().slice(0, 10);

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

// Date (YYYY-MM-DD) of the last commit that touched the page's files. Falls back
// to today's date if they have uncommitted changes (local build) or there's no
// git history available.
function lastModified(files) {
  for (const file of files) {
    if (!existsSync(path.join(root, file))) throw new Error(`${file} does not exist (pageSources in scripts/prerender.mjs).`);
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
    if (!sources[route]) throw new Error(`Route ${route} has no source files in pageSources (scripts/prerender.mjs).`);
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

// React 19 hoists <title>/<meta>/<link> to the START of the renderToString
// output, contiguously, no matter where they were rendered in the tree. They're
// split from the rest (the actual #root HTML).
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

  // drop the shell's static <title>: the render brings its own.
  let page = template.replace(/<title>[\s\S]*?<\/title>/, '');
  page = page.replace('</head>', `    ${head}\n  </head>`);
  page = page.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  return page;
}

async function main() {
  if (!existsSync(ssrEntry)) {
    throw new Error(`SSR bundle not found at ${ssrEntry}. Run "vite build --ssr src/entry-server.tsx --outDir dist-ssr" first.`);
  }
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');
  // The route list lives in src/lib/tools.ts and is re-exported by the SSR bundle.
  const { render, PRERENDER_ROUTES, TOOL_SLUGS, PAGE_SLUGS, GUIDE_FILES, canonicalUrl } = await import(pathToFileURL(ssrEntry).href);

  for (const route of [...PRERENDER_ROUTES, NOT_FOUND_ROUTE]) {
    const rendered = render(route);
    const page = injectIntoTemplate(template, rendered);
    const outPath = outputPathFor(route);
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, page, 'utf-8');
    console.log(`prerendered ${route} -> ${path.relative(root, outPath)}`);
  }

  // Same routes that were just pre-rendered (the 404 isn't in the sitemap).
  const sitemap = buildSitemap(PRERENDER_ROUTES, pageSources(TOOL_SLUGS, PAGE_SLUGS, GUIDE_FILES), canonicalUrl);
  await writeFile(path.join(distDir, 'sitemap.xml'), sitemap, 'utf-8');
  console.log(`sitemap -> dist/sitemap.xml (${PRERENDER_ROUTES.length} URLs)`);

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
