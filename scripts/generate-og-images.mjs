// Genera las imágenes para compartir en redes (Open Graph / Twitter, 1200x630)
// y el logo cuadrado de los datos estructurados, renderizando HTML en Chrome
// headless. Los PNG resultantes se versionan en public/: NO corre en el build.
//
// Correrlo solo si cambian los nombres de las herramientas o el diseño:
//   npm i --no-save puppeteer-core
//   node scripts/generate-og-images.mjs
// Usa el Chrome instalado (CHROME_PATH para otra ruta). Necesita Node >= 22.18
// para importar src/lib/tools.ts directamente (type stripping nativo).
import puppeteer from 'puppeteer-core';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOOL_IDS, TOOL_LABELS, toolOgImage, SITE_OG_IMAGE } from '../src/lib/tools.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const CHROME_PATH = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// Mismos trazos que src/components/icons/index.tsx (viewBox 0 0 24 24).
const ICONS = {
  'merge-pdfs': '<path d="M14.5 5.5 8 12a3 3 0 0 0 4.24 4.24l6-6a5 5 0 0 0-7.07-7.07L4.5 9.83" />',
  'images-to-pdf': '<rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 16l-5.5-5.5L11 15l-3-3-5 5" />',
  'pdf-to-images': '<path d="M6.5 3h7l4 4v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M13.5 3v4h4" /><path d="M8.5 12.5h5M8.5 15.5h3.5" /><path d="M14.5 15.5l3 3m0 0l-3 3m3-3h-5.5" />',
  'pdf-to-text': '<path d="M6.5 3h7l4 4v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M13.5 3v4h4" /><path d="M8.5 12h7M8.5 15h7M8.5 18h4.5" />',
  'html-to-pdf': '<polyline points="8.5 6 3 12 8.5 18" /><polyline points="15.5 6 21 12 15.5 18" /><line x1="14" y1="4" x2="10" y2="20" />',
  site: '<path d="M12 2.5 5 5.5v5.4c0 4.6 3 7.9 7 9.1 4-1.2 7-4.5 7-9.1V5.5z" /><path d="M9 12l2 2 4-4.5" />',
};

const SUBTITLES = {
  'merge-pdfs': 'Combina varios PDFs en un solo archivo, en el orden que elijas.',
  'images-to-pdf': 'Convierte tus fotos JPG y PNG en un documento PDF.',
  'pdf-to-images': 'Convierte cada página de un PDF en una imagen PNG o JPG.',
  'pdf-to-text': 'Extrae el texto de un PDF para copiarlo o descargarlo.',
  'html-to-pdf': 'Convierte un archivo o código HTML en un PDF real, paginado.',
};

function banner({ icon, title, subtitle }) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #12213F; color: #FAF9F5; font-family: 'IBM Plex Sans', sans-serif;
         display: flex; flex-direction: column; justify-content: space-between; padding: 64px 80px; border-bottom: 10px solid #A8823D; }
  .wordmark { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: 40px; }
  .wordmark span { color: #A8823D; }
  .main { display: flex; align-items: center; gap: 48px; }
  .icon { flex-shrink: 0; width: 168px; height: 168px; border: 2px solid rgba(168,130,61,.6); border-radius: 24px;
          display: flex; align-items: center; justify-content: center; color: #A8823D; }
  h1 { font-family: 'Source Serif 4', serif; font-weight: 700; font-size: 76px; line-height: 1.05; margin-bottom: 20px; }
  p { font-size: 30px; line-height: 1.35; color: #D8DCE6; max-width: 780px; }
  .footer { display: flex; justify-content: space-between; font-size: 24px; color: #B9BFCC; }
  .footer strong { color: #FAF9F5; font-weight: 600; }
</style></head><body>
  <div class="wordmark"><span>PDF</span> Converter</div>
  <div class="main">
    <div class="icon"><svg width="104" height="104" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></div>
    <div><h1>${title}</h1><p>${subtitle}</p></div>
  </div>
  <div class="footer"><strong>Gratis · Sin registro · Sin subir tus archivos</strong><span>100% en tu navegador</span></div>
</body></html>`;
}

const pages = [
  { out: SITE_OG_IMAGE, html: banner({ icon: ICONS.site, title: 'Herramientas PDF gratis', subtitle: 'Une, convierte y extrae contenido de tus PDFs directamente en el navegador.' }) },
  ...TOOL_IDS.map(id => ({ out: toolOgImage(id), html: banner({ icon: ICONS[id], title: TOOL_LABELS[id], subtitle: SUBTITLES[id] }) })),
];

const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });
  for (const { out, html } of pages) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fontsOk = await page.evaluate(() =>
      document.fonts.check("700 76px 'Source Serif 4'") && document.fonts.check("400 30px 'IBM Plex Sans'"));
    if (!fontsOk) throw new Error(`No cargaron las fuentes de Google Fonts para ${out} (¿sin conexión?)`);
    const file = path.join(publicDir, out);
    await mkdir(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, type: 'png' });
    console.log(`og image -> ${path.relative(root, file)}`);
  }

  // Logo cuadrado para Organization.logo (Google pide >= 112x112): el mismo
  // favicon.svg del sitio, rasterizado.
  const favicon = await readFile(path.join(publicDir, 'favicon.svg'), 'utf-8');
  await page.setViewport({ width: 512, height: 512 });
  await page.setContent(`<html><body style="margin:0">${favicon.replace('<svg ', '<svg width="512" height="512" ')}</body></html>`);
  await page.screenshot({ path: path.join(publicDir, 'logo-512.png'), type: 'png', omitBackground: true });
  console.log('logo -> public/logo-512.png');
} finally {
  await browser.close();
}
