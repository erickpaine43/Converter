// Minimal server for local checks ONLY: mimics what Netlify does with this
// dist/ and netlify.toml. Not used in production.
//  - [[redirects]] are read from the real netlify.toml and applied in order: the
//    first match wins; without `force` they're skipped if a static file exists
//    at that path (shadowing)
//  - a directory with index.html requested WITHOUT trailing slash -> 301 to the
//    slashed URL (Netlify pretty URLs: /contacto -> /contacto/)
//  - no file and no rule -> 404
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const port = Number(process.argv[2] ?? 4174);

const toml = await readFile(path.join(__dirname, '..', 'netlify.toml'), 'utf-8');
const redirects = toml.split('[[redirects]]').slice(1).map(block => ({
  from: /from\s*=\s*"([^"]+)"/.exec(block)[1],
  to: /to\s*=\s*"([^"]+)"/.exec(block)[1],
  status: Number(/status\s*=\s*(\d+)/.exec(block)[1]),
  force: /force\s*=\s*true/.test(block),
}));

function matches(rule, pathname) {
  if (rule.from.endsWith('/*')) return pathname.startsWith(rule.from.slice(0, -1));
  return pathname === rule.from;
}

const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mjs': 'text/javascript', '.xml': 'application/xml', '.txt': 'text/plain', '.svg': 'image/svg+xml', '.png': 'image/png' };

async function isFile(p) {
  try {
    return (await stat(p)).isFile();
  } catch {
    return false;
  }
}

async function resolveStatic(clean, query) {
  const direct = path.join(distDir, clean);
  if (!clean.endsWith('/') && await isFile(direct)) return { status: 200, file: direct };
  if (await isFile(path.join(direct, 'index.html'))) {
    if (!clean.endsWith('/')) return { status: 301, location: `${clean}/${query ? `?${query}` : ''}` };
    return { status: 200, file: path.join(direct, 'index.html') };
  }
  return null;
}

async function resolve(urlPath) {
  const [clean, query = ''] = urlPath.split('?');
  const staticResult = await resolveStatic(clean, query);
  for (const rule of redirects) {
    if (!matches(rule, clean) || (!rule.force && staticResult)) continue;
    if (rule.status === 301 || rule.status === 302) return { status: rule.status, location: rule.to };
    return { status: rule.status, file: path.join(distDir, rule.to) };
  }
  return staticResult ?? { status: 404, file: path.join(distDir, '404.html') };
}

createServer(async (req, res) => {
  const result = await resolve(req.url ?? '/');
  if (result.status === 301 || result.status === 302) {
    res.writeHead(result.status, { Location: result.location });
    res.end();
    return;
  }
  const body = await readFile(result.file);
  const ext = path.extname(result.file);
  res.writeHead(result.status, { 'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream' });
  res.end(body);
}).listen(port, () => console.log(`netlify-like server on http://localhost:${port}`));
