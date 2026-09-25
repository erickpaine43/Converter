import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { AppRoutes } from './App';
import { PRERENDER_ROUTES, TOOL_IDS, TOOL_SLUGS } from './lib/tools';

// Metadata de cada página tal como sale en el pre-render (mismo render que
// scripts/prerender.mjs): largos, unicidad, imágenes para compartir y JSON-LD.
const publicDir = path.resolve(__dirname, '..', 'public');
const TOOL_ROUTES = TOOL_IDS.map(id => `/${TOOL_SLUGS[id]}`);
// Las institucionales conservan su título corto ("Contacto | PDF Converter"):
// "Gratis Online" no tiene sentido ahí.
const TITLE_RANGE_ROUTES = ['/', ...TOOL_ROUTES];

function renderRoute(route: string) {
  const html = renderToString(
    <StaticRouter location={route}>
      <AppRoutes />
    </StaticRouter>
  );
  const attr = (re: RegExp) => re.exec(html)?.[1];
  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(m => JSON.parse(m[1]) as { '@graph': Record<string, unknown>[] });
  return {
    html,
    title: attr(/<title>([^<]*)<\/title>/),
    description: attr(/<meta name="description" content="([^"]*)"/),
    ogImage: attr(/<meta property="og:image" content="([^"]*)"/),
    twitterCard: attr(/<meta name="twitter:card" content="([^"]*)"/),
    twitterImage: attr(/<meta name="twitter:image" content="([^"]*)"/),
    jsonLd,
    types: jsonLd.flatMap(d => d['@graph'].map(n => n['@type'])),
  };
}

// React escapa & y " en los atributos; se cuentan los caracteres reales.
const unescape = (s = '') => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");

const pages = Object.fromEntries(PRERENDER_ROUTES.map(r => [r, renderRoute(r)]));

describe('title y meta description', () => {
  for (const route of PRERENDER_ROUTES) {
    it(`${route}: description de 150-160 caracteres`, () => {
      const len = unescape(pages[route].description).length;
      expect(len, pages[route].description).toBeGreaterThanOrEqual(150);
      expect(len, pages[route].description).toBeLessThanOrEqual(160);
    });
  }
  for (const route of TITLE_RANGE_ROUTES) {
    it(`${route}: title de 50-60 caracteres con "Gratis Online"`, () => {
      const title = unescape(pages[route].title);
      expect(title.length, title).toBeGreaterThanOrEqual(50);
      expect(title.length, title).toBeLessThanOrEqual(60);
      expect(title).toContain('Gratis Online');
    });
  }
  it('titles y descriptions únicos entre páginas', () => {
    const all = Object.values(pages);
    expect(new Set(all.map(p => p.title)).size).toBe(all.length);
    expect(new Set(all.map(p => p.description)).size).toBe(all.length);
  });
});

describe('Open Graph / Twitter', () => {
  for (const route of PRERENDER_ROUTES) {
    it(`${route}: og:image y twitter:image apuntan a un PNG que existe en public/`, () => {
      const { ogImage, twitterImage, twitterCard } = pages[route];
      expect(twitterCard).toBe('summary_large_image');
      expect(twitterImage).toBe(ogImage);
      const file = new URL(ogImage!).pathname;
      expect(existsSync(path.join(publicDir, file)), file).toBe(true);
    });
  }
  it('cada herramienta tiene su propia imagen', () => {
    const images = TOOL_ROUTES.map(r => pages[r].ogImage);
    expect(new Set(images).size).toBe(TOOL_ROUTES.length);
  });
});

describe('JSON-LD', () => {
  it('la Home declara Organization y WebSite', () => {
    expect(pages['/'].types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
    const org = pages['/'].jsonLd[0]['@graph'].find(n => n['@type'] === 'Organization')!;
    expect(existsSync(path.join(publicDir, new URL(org.logo as string).pathname))).toBe(true);
  });

  for (const route of TOOL_ROUTES) {
    it(`${route}: WebApplication gratis, FAQPage igual al FAQ visible y BreadcrumbList`, () => {
      const { html, types, jsonLd } = pages[route];
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage', 'BreadcrumbList']));
      const graph = jsonLd[0]['@graph'];

      const app = graph.find(n => n['@type'] === 'WebApplication')!;
      expect(app.offers).toMatchObject({ price: '0' });

      // mismas preguntas, en el mismo orden, que los botones del FAQ visible
      const faq = graph.find(n => n['@type'] === 'FAQPage')! as { mainEntity: { name: string }[] };
      const visibleQuestions = [...html.matchAll(/class="faq-question"[^>]*>([^<]*)</g)].map(m => unescape(m[1]));
      expect(faq.mainEntity.map(q => q.name)).toEqual(visibleQuestions);

      const crumbs = graph.find(n => n['@type'] === 'BreadcrumbList')! as { itemListElement: { item: string }[] };
      expect(crumbs.itemListElement.map(c => new URL(c.item).pathname)).toEqual(['/', `${route}/`]);
    });
  }

  it('las páginas sin datos estructurados propios no emiten JSON-LD vacío', () => {
    for (const route of ['/about', '/contact', '/privacy', '/terms']) {
      expect(pages[route].jsonLd).toHaveLength(0);
    }
  });
});
