import type { ToolId } from '../lib/tools';

/** Text block with a heading (h2), used by tool pages and guides. */
export interface ContentSection {
  title: string;
  /** Numbered steps (<ol>). */
  steps?: string[];
  /** Unordered list (<ul>), after the paragraphs. */
  items?: string[];
  paragraphs?: string[];
}

export interface Guide {
  /** Last URL segment: /guias/<slug>/. */
  slug: string;
  /** <title> without the " | PDF Converter" suffix (checked by seo.test.tsx). */
  title: string;
  /** <meta description>, 150-160 characters (checked by seo.test.tsx). */
  description: string;
  h1: string;
  /** One- or two-line summary for the guides index and related links. */
  summary: string;
  /** YYYY-MM-DD dates for the Article JSON-LD. Bump `updated` when the content changes. */
  published: string;
  updated: string;
  intro: string[];
  sections: ContentSection[];
  /** Site tools the guide recommends (linked at the end). */
  relatedTools: ToolId[];
}
