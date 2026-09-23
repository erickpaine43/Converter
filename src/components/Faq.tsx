import { useState } from 'react';

interface FaqItem { q: string; a: string; }

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-section">
      <h2 className="faq-title">Preguntas frecuentes</h2>
      {items.map((item, i) => (
        <div key={i} className={`faq-item ${open === i ? 'open' : ''}`}>
          <button
            className="faq-question"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? null : i)}
          >
            {item.q}
            <span className="faq-arrow">{open === i ? '▲' : '▼'}</span>
          </button>
          <p className="faq-answer" hidden={open !== i}>{item.a}</p>
        </div>
      ))}
    </div>
  );
}
