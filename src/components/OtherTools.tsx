import { Link } from 'react-router-dom';
import { TOOL_IDS, TOOL_LABELS, TOOL_SHORT_DESCS, toolPath, type ToolId } from '../lib/tools';

// Enlazado interno al pie de cada herramienta: las otras 4, con links reales
// (<a href>) que están en el HTML pre-renderizado.
export default function OtherTools({ current }: { current: ToolId }) {
  return (
    <nav className="other-tools" aria-labelledby="other-tools-title">
      <h2 id="other-tools-title" className="other-tools-title">Otras herramientas</h2>
      <ul className="other-tools-list">
        {TOOL_IDS.filter(id => id !== current).map(id => (
          <li key={id}>
            <Link to={toolPath(id)} className="other-tool-link">
              <span className="other-tool-label">{TOOL_LABELS[id]}</span>
              <span className="other-tool-desc">{TOOL_SHORT_DESCS[id]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
