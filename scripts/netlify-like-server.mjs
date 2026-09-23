// Servidor mínimo SOLO para verificación local: replica la regla de
// netlify.toml (redirect "/*" -> "/index.html" status 200, SIN force, lo que
// en Netlify significa "si existe un archivo estático en esa ruta, sirvelo
// tal cual, sin aplicar el redirect"). No se usa en producción.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const port = Number(process.argv[2] ?? 4174);

const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mjs': 'text/javascript' };

async function resolveFile(urlPath) {
  const clean = urlPath.split('?')[0];
  const candidates = [
    path.join(distDir, clean),
    path.join(distDir, clean, 'index.html'),
  ];
  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isFile()) return candidate;
    } catch { /* not found, try next */ }
  }
  return null;
}

createServer(async (req, res) => {
  const found = await resolveFile(req.url ?? '/');
  const filePath = found ?? path.join(distDir, 'index.html');
  const body = await readFile(filePath);
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': CONTENT_TYPES[ext] ?? 'application/octet-stream' });
  res.end(body);
}).listen(port, () => console.log(`netlify-like server on http://localhost:${port}`));
