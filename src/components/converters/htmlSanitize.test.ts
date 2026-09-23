import { describe, expect, it } from 'vitest';
import DOMPurify from 'dompurify';

/**
 * Nota sobre el alcance de este test: en jsdom no hay pipeline real de carga de
 * recursos ni de renderizado (confirmado empíricamente: ni <img onerror>, ni
 * <svg onload>, ni <script> ejecutan nada al insertarlos vía innerHTML, sanitizados
 * o no — jsdom no llega a intentar cargar la imagen ni evalúa SVG). Por eso no se
 * puede demostrar "no ejecuta" observando un efecto en tiempo de ejecución acá.
 * Lo que sí podemos —y debemos— probar es que DOMPurify efectivamente ELIMINA los
 * vectores peligrosos del árbol DOM resultante (scripts, atributos on*, iframes,
 * javascript: URLs), que es el control real que aplica nuestro código.
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
    // el contenido legítimo se preserva
    expect(container.textContent).toContain('Factura #123');
  });

  it('preserva HTML/CSS benigno intacto (no rompe el caso de uso normal)', () => {
    const benign = '<div style="color:red;"><strong>Total: $100</strong></div>';
    const clean = DOMPurify.sanitize(benign);
    expect(clean).toContain('Total: $100');
    expect(clean).toContain('<strong>');
  });
});
