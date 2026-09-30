import { Link } from 'react-router-dom';
import { GUIDES } from '../content/guides';
import { guidePath, type ToolId } from '../lib/tools';

// Internal linking tool -> guides: the guides that recommend this tool. With
// `exclude` it's also used at the bottom of a guide (without listing itself).
export default function RelatedGuides({ tool, exclude, title = 'Guías relacionadas' }: {
  tool: ToolId | ToolId[];
  exclude?: string;
  title?: string;
}) {
  const tools = Array.isArray(tool) ? tool : [tool];
  const guides = GUIDES.filter(g => g.slug !== exclude && g.relatedTools.some(t => tools.includes(t)));
  if (guides.length === 0) return null;

  return (
    <nav className="other-tools" aria-labelledby="related-guides-title">
      <h2 id="related-guides-title" className="other-tools-title">{title}</h2>
      <ul className="other-tools-list">
        {guides.map(g => (
          <li key={g.slug}>
            <Link to={guidePath(g.slug)} className="other-tool-link">
              <span className="other-tool-label">{g.h1}</span>
              <span className="other-tool-desc">{g.summary}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
