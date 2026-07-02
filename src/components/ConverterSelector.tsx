// src/components/ConverterSelector.tsx
import { useState } from 'react';
import ImagesToPdf from './converters/imagesToPdf';
import HtmlToPdf from './converters/HtmlToPdf';

const converters = [
  { id: 'imagesToPdf', label: 'Imágenes a PDF', component: <ImagesToPdf /> },
  { id: 'htmlToPdf', label: 'HTML a PDF', component: <HtmlToPdf /> },
];

export default function ConverterSelector() {
  const [active, setActive] = useState(converters[0].id);

  const current = converters.find(c => c.id === active);

  return (
    <div>
      <nav>
        {converters.map(c => (
          <button
            key={c.id}
            onClick={() => setActive(c.id)}
            style={{ fontWeight: active === c.id ? 'bold' : 'normal' }}
          >
            {c.label}
          </button>
        ))}
      </nav>
      <div>
        {current?.component}
      </div>
    </div>
  );
}
