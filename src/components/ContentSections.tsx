import type { ContentSection } from '../content/types';

// Text blocks (h2 + steps/paragraphs/list) for tool pages and guides. Rendered
// during pre-render, so they're in the HTML without relying on JS.
export default function ContentSections({ sections }: { sections: ContentSection[] }) {
  return (
    <>
      {sections.map(section => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.steps && (
            <ol className="content-steps">
              {section.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          )}
          {section.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
          {section.items && (
            <ul>
              {section.items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </>
  );
}
