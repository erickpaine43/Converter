import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { AppRoutes } from './App';
import { GUIDES } from './content/guides';
import { CONTACT_EMAIL } from './lib/site';
import { PAGE_SLUGS, PRERENDER_ROUTES, TOOL_IDS, TOOL_SLUGS, pagePath } from './lib/tools';

// Each page's metadata as it comes out of the pre-render (same render as
// scripts/prerender.mjs): lengths, uniqueness, sharing images and JSON-LD.
const publicDir = path.resolve(__dirname, '..', 'public');
const TOOL_ROUTES = TOOL_IDS.map(id => `/${TOOL_SLUGS[id]}`);
// Site pages keep their short title ("Contacto | PDF Converter"): "Gratis
// Online" makes no sense there.
const TITLE_RANGE_ROUTES = ['/', ...TOOL_ROUTES];
const GUIDE_ROUTES = GUIDES.map(g => `/${PAGE_SLUGS.guides}/${g.slug}`);

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

// React escapes & and " in attributes; count the actual characters.
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
  for (const route of GUIDE_ROUTES) {
    it(`${route}: title de hasta 60 caracteres`, () => {
      const title = unescape(pages[route].title);
      expect(title.length, title).toBeLessThanOrEqual(60);
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
    expect(org.contactPoint).toMatchObject({ email: CONTACT_EMAIL });
  });

  for (const route of GUIDE_ROUTES) {
    it(`${route}: Article con fechas y autor, y BreadcrumbList Inicio > Guías > guía`, () => {
      const { types, jsonLd } = pages[route];
      expect(types).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']));
      const graph = jsonLd[0]['@graph'];
      const article = graph.find(n => n['@type'] === 'Article')!;
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.author).toMatchObject({ '@type': 'Person' });
      const crumbs = graph.find(n => n['@type'] === 'BreadcrumbList')! as { itemListElement: { item: string }[] };
      expect(crumbs.itemListElement.map(c => new URL(c.item).pathname)).toEqual(['/', pagePath('guides'), `${route}/`]);
    });
  }

  for (const route of TOOL_ROUTES) {
    it(`${route}: WebApplication gratis, FAQPage igual al FAQ visible y BreadcrumbList`, () => {
      const { html, types, jsonLd } = pages[route];
      expect(types).toEqual(expect.arrayContaining(['WebApplication', 'FAQPage', 'BreadcrumbList']));
      const graph = jsonLd[0]['@graph'];

      const app = graph.find(n => n['@type'] === 'WebApplication')!;
      expect(app.offers).toMatchObject({ price: '0' });

      // same questions, in the same order, as the visible FAQ buttons
      const faq = graph.find(n => n['@type'] === 'FAQPage')! as { mainEntity: { name: string }[] };
      const visibleQuestions = [...html.matchAll(/class="faq-question"[^>]*>([^<]*)</g)].map(m => unescape(m[1]));
      expect(faq.mainEntity.map(q => q.name)).toEqual(visibleQuestions);

      const crumbs = graph.find(n => n['@type'] === 'BreadcrumbList')! as { itemListElement: { item: string }[] };
      expect(crumbs.itemListElement.map(c => new URL(c.item).pathname)).toEqual(['/', `${route}/`]);
    });
  }

  it('las páginas sin datos estructurados propios no emiten JSON-LD vacío', () => {
    for (const id of ['about', 'contact', 'privacy', 'terms', 'guides'] as const) {
      const route = `/${PAGE_SLUGS[id]}`;
      expect(pages[route].jsonLd).toHaveLength(0);
    }
  });
});
