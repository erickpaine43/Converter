import { describe, expect, it } from 'vitest';
import DOMPurify from 'dompurify';

/**
 * Scope note: jsdom has no real resource loading or rendering pipeline
 * (confirmed empirically: neither <img onerror>, <svg onload> nor <script> run
 * anything when inserted via innerHTML, sanitized or not; jsdom never tries to
 * load the image or evaluate the SVG). So "doesn't execute" can't be shown by
 * observing a runtime effect here. What we can and should test is that
 * DOMPurify actually REMOVES the dangerous vectors from the resulting DOM tree
 * (scripts, on* attributes, iframes, javascript: URLs), which is the real
 * control our code applies.
 */
describe('Bloque 1: sanitización de HTML pegado por el usuario (DOMPurify)', () => {
  it('elimina <script> por completo', () => {
    const dirty = '<p>hola</p><script>window.__xss = true;</script>';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean.toLowerCase()).not.toContain('<script');
    expect(clean).toContain('hola');
  });

  it('elimina el atributo onerror de un <img>', () => {
    const dirty = '<img src="x" onerror="window.__xss = true">';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean.toLowerCase()).not.toContain('onerror');
  });

  it('elimina el atributo onload de un <svg>', () => {
    const dirty = '<svg onload="window.__xss = true"></svg>';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean.toLowerCase()).not.toContain('onload');
  });

  it('elimina href/src con esquema javascript:', () => {
    const dirty = '<a href="javascript:window.__xss = true">click</a>';
    const clean = DOMPurify.sanitize(dirty);
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });

  it('al insertar el HTML sanitizado en un DOM real, no queda ningún <script> ni atributo on*', () => {
    const dirty = `
      <div>
        <p>Factura #123</p>
        <script>window.__xss = true;</script>
        <img src="x" onerror="window.__xss = true">
        <svg onload="window.__xss = true"></svg>
      </div>
    `;
    const clean = DOMPurify.sanitize(dirty);
    const container = document.createElement('div');
    container.innerHTML = clean;

    expect(container.querySelectorAll('script').length).toBe(0);
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      for (const attr of Array.from(el.attributes)) {
        expect(attr.name.toLowerCase().startsWith('on')).toBe(false);
      }
    });
    // legitimate content is preserved
    expect(container.textContent).toContain('Factura #123');
  });

  it('preserva HTML/CSS benigno intacto (no rompe el caso de uso normal)', () => {
    const benign = '<div style="color:red;"><strong>Total: $100</strong></div>';
    const clean = DOMPurify.sanitize(benign);
    expect(clean).toContain('Total: $100');
    expect(clean).toContain('<strong>');
  });
});
