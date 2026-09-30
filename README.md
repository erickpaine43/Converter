# PDF Converter

Free PDF tools that run entirely in the browser (files are never uploaded to a
server): merge PDFs, images to PDF, PDF to images, PDF to text and HTML to PDF,
plus a section of how-to guides. The site is in Spanish.

Live at https://pdf-converter-freee.netlify.app

Built with React 19, TypeScript and Vite, statically pre-rendered per route and
deployed on Netlify.

## Scripts

```bash
npm install
npm run dev      # dev server (no pre-render: #root starts empty)
npm run build    # tsc + client build + SSR build + pre-render + sitemap
npm test         # vitest
npm run lint     # eslint
node scripts/netlify-like-server.mjs   # serves dist/ the way Netlify does (redirects, 404, trailing slashes)
```

## How it's put together

- **Routes**: `src/lib/tools.ts` is the single source of truth (Spanish slugs for
  tools, site pages and guides). Canonical URLs use a trailing slash
  (`/unir-pdf/`, `/contacto/`).
- **Pre-rendering**: `scripts/prerender.mjs` renders every route with the SSR
  bundle (`src/entry-server.tsx`) into `dist/<route>/index.html`, and also writes
  `dist/404.html` and `dist/sitemap.xml` (each `<lastmod>` comes from the last
  commit that touched the page's files). The client hydrates that HTML
  (`src/main.tsx`).
- **Netlify** (`netlify.toml`): 301s from the old English URLs to the new ones and
  a catch-all that returns a real 404. `src/siteConfig.test.ts` checks none are
  missing.
- **Content**: tool page copy lives in `src/pages/ConverterPage.tsx`; guides live
  in `src/content/guides/` (one file per guide, registered in `index.ts`).
- **SEO**: `src/components/SeoHead.tsx` (title, description, canonical, Open
  Graph) plus per-page JSON-LD; `src/seo.test.tsx` checks lengths and structured
  data.
- **Contact form**: Netlify Forms, declared in `public/__forms.html`.

## Analytics, ads and consent

Environment variables (see `.env.example`):

- `VITE_GA_MEASUREMENT_ID`: Google Analytics 4. Only loaded with consent.
- `VITE_ADSENSE_CLIENT`: AdSense client ID (`ca-pub-…`). Empty means no AdSense.

`index.html` sets Google Consent Mode v2 to "denied" before any Google tag loads.
Without `VITE_ADSENSE_CLIENT`, consent is collected by the site's own banner
(`src/components/CookieBanner.tsx`). With it, `vite.config.ts` injects the
AdSense tag and Google's CMP ("Privacy & messaging" in AdSense) handles consent
for visitors in the EEA, UK and Switzerland; everyone else still gets the site's
own banner (see `src/lib/cookieConsent.ts`).

Turning on AdSense:

1. Set `VITE_ADSENSE_CLIENT` in the Netlify environment variables.
2. In AdSense → Privacy & messaging, create and publish a "European regulations"
   message and enable Consent Mode for ads and analytics.
3. Add `public/ads.txt` with the line AdSense provides
   (`google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).
4. Review the privacy policy (`src/pages/Privacy.tsx`) in case anything changed.
