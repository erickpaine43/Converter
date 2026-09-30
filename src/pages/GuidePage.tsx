import { Link } from 'react-router-dom';
import SeoHead from '../components/SeoHead';
import JsonLd from '../components/JsonLd';
import ContentSections from '../components/ContentSections';
import RelatedGuides from '../components/RelatedGuides';
import type { Guide } from '../content/types';
import { OPERATOR_NAME, canonicalUrl } from '../lib/site';
import { TOOL_LABELS, TOOL_SHORT_DESCS, guidePath, pagePath, toolPath } from '../lib/tools';

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function formatDate(isoDate: string): string {
  return dateFormat.format(new Date(`${isoDate}T00:00:00Z`));
}

function guideStructuredData(guide: Guide): Record<string, unknown> {
  const url = canonicalUrl(guidePath(guide.slug));
  return {
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: guide.h1,
        description: guide.description,
        url,
        mainEntityOfPage: url,
        inLanguage: 'es',
        datePublished: guide.published,
        dateModified: guide.updated,
        author: { '@type': 'Person', name: OPERATOR_NAME },
        publisher: { '@id': `${canonicalUrl('/')}#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: canonicalUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Guías', item: canonicalUrl(pagePath('guides')) },
          { '@type': 'ListItem', position: 3, name: guide.h1, item: url },
        ],
      },
    ],
  };
}

export default function GuidePage({ guide }: { guide: Guide }) {
  return (
    <main className="converter-page">
      <SeoHead title={guide.title} description={guide.description} path={guidePath(guide.slug)} type="article" />
      <JsonLd data={guideStructuredData(guide)} />
      <nav aria-label="Ruta de navegación" className="breadcrumb">
        <Link to="/">Inicio</Link> <span aria-hidden="true">/</span> <Link to={pagePath('guides')}>Guías</Link>
      </nav>
      <article className="info-section guide-article">
        <h1 className="page-title">{guide.h1}</h1>
        <p className="guide-meta">
          Por {OPERATOR_NAME} · Actualizado el <time dateTime={guide.updated}>{formatDate(guide.updated)}</time>
        </p>
        {guide.intro.map((p, i) => <p key={i}>{p}</p>)}
        <ContentSections sections={guide.sections} />
      </article>
      <nav className="other-tools" aria-labelledby="guide-tools-title">
        <h2 id="guide-tools-title" className="other-tools-title">Herramientas que se usan en esta guía</h2>
        <ul className="other-tools-list">
          {guide.relatedTools.map(id => (
            <li key={id}>
              <Link to={toolPath(id)} className="other-tool-link">
                <span className="other-tool-label">{TOOL_LABELS[id]}</span>
                <span className="other-tool-desc">{TOOL_SHORT_DESCS[id]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <RelatedGuides tool={guide.relatedTools} exclude={guide.slug} title="Otras guías" />
    </main>
  );
}
