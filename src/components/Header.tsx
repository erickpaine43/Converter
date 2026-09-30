import { useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { TOOL_IDS, TOOL_LABELS, pagePath, toolPath } from '../lib/tools';

// Every link is in the pre-rendered HTML (the tools submenu is only hidden with
// `hidden`), so they're crawlable without JS. On narrow screens the whole menu
// opens with the "Menú" button; on desktop it's always visible (index.css).
const PAGE_LINKS = [
  { to: pagePath('guides'), label: 'Guías' },
  { to: pagePath('about'), label: 'Sobre nosotros' },
  { to: pagePath('contact'), label: 'Contacto' },
  { to: pagePath('privacy'), label: 'Privacidad' },
  { to: pagePath('terms'), label: 'Términos' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const closeAll = () => {
    setMenuOpen(false);
    setToolsOpen(false);
  };

  // Picking any link closes everything (navigation is client-side, so the
  // Header never unmounts).
  const handleNavClick = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('a')) closeAll();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') closeAll();
  };

  // The submenu closes when focus leaves it (click outside, Tab).
  const handleToolsBlur = (e: FocusEvent<HTMLLIElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setToolsOpen(false);
  };

  return (
    <header className="header">
      <Link to="/" className="wordmark">
        <span className="wordmark-accent">PDF</span> Converter
      </Link>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpen(open => !open)}
      >
        {menuOpen ? 'Cerrar' : 'Menú'}
      </button>
      <nav
        id="site-nav"
        className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
        aria-label="Principal"
        onClick={handleNavClick}
        onKeyDown={handleKeyDown}
      >
        <ul className="site-nav-list">
          <li className="site-nav-tools" onBlur={handleToolsBlur}>
            <button
              type="button"
              className="site-nav-link site-nav-tools-toggle"
              aria-expanded={toolsOpen}
              aria-controls="site-nav-tools"
              onClick={() => setToolsOpen(open => !open)}
            >
              Herramientas <span aria-hidden="true">▾</span>
            </button>
            <ul id="site-nav-tools" className="site-nav-submenu" hidden={!toolsOpen}>
              {TOOL_IDS.map(id => (
                <li key={id}><Link to={toolPath(id)}>{TOOL_LABELS[id]}</Link></li>
              ))}
            </ul>
          </li>
          {PAGE_LINKS.map(link => (
            <li key={link.to}><Link to={link.to} className="site-nav-link">{link.label}</Link></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
