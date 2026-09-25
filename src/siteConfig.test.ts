import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LEGACY_TOOL_PATHS, PRERENDER_ROUTES } from './lib/tools';

// sitemap.xml y netlify.toml son archivos estáticos: este test los mantiene
// sincronizados con src/lib/tools.ts (la lista de rutas real de la app).
const root = path.resolve(__dirname, '..');
const BASE_URL = 'https://pdf-converter-freee.netlify.app';

interface Redirect { from: string; to: string; status: number; force: boolean }

function readRedirects(): Redirect[] {
  const toml = readFileSync(path.join(root, 'netlify.toml'), 'utf-8');
  return toml.split('[[redirects]]').slice(1).map(block => ({
    from: /from\s*=\s*"([^"]+)"/.exec(block)![1],
    to: /to\s*=\s*"([^"]+)"/.exec(block)![1],
    status: Number(/status\s*=\s*(\d+)/.exec(block)![1]),
    force: /force\s*=\s*true/.test(block),
  }));
}

describe('sitemap.xml', () => {
  it('lista exactamente las rutas pre-renderizadas, con barra final', () => {
    const xml = readFileSync(path.join(root, 'public/sitemap.xml'), 'utf-8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
    const expected = PRERENDER_ROUTES.map(r => `${BASE_URL}${r === '/' ? '/' : `${r}/`}`);
    expect([...locs].sort()).toEqual([...expected].sort());
    expect(locs.some(l => l.includes('/converter/'))).toBe(false);
  });
});

describe('netlify.toml', () => {
  const redirects = readRedirects();
  const catchAllIndex = redirects.findIndex(r => r.from === '/*');

  it('tiene el catch-all 404 como última regla', () => {
    expect(redirects[catchAllIndex]).toMatchObject({ to: '/404.html', status: 404 });
    expect(catchAllIndex).toBe(redirects.length - 1);
  });

  for (const [oldPath, newPath] of Object.entries(LEGACY_TOOL_PATHS)) {
    it(`redirige ${oldPath} (con y sin barra) con 301 a ${newPath}`, () => {
      for (const from of [oldPath, `${oldPath}/`]) {
        const index = redirects.findIndex(r => r.from === from);
        expect(index, from).toBeGreaterThanOrEqual(0);
        expect(redirects[index]).toMatchObject({ to: newPath, status: 301, force: true });
        expect(index).toBeLessThan(catchAllIndex);
      }
    });
  }
});
