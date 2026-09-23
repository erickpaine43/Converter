import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Faq from './Faq';

const items = [
  { q: '¿Pregunta uno?', a: 'Respuesta uno.' },
  { q: '¿Pregunta dos?', a: 'Respuesta dos.' },
];

describe('Faq — acordeón (hidden attribute, no renderizado condicional)', () => {
  it('arranca colapsado: las respuestas están en el DOM pero ocultas', () => {
    render(<Faq items={items} />);
    const answers = screen.getAllByText(/respuesta (uno|dos)\./i, { selector: '.faq-answer' });
    expect(answers).toHaveLength(2);
    answers.forEach(a => expect(a).not.toBeVisible());
  });

  it('click expande esa respuesta y dejó las demás colapsadas; click de nuevo la vuelve a colapsar', async () => {
    const user = userEvent.setup();
    render(<Faq items={items} />);

    const [q1, q2] = screen.getAllByRole('button');
    await user.click(q1);

    const [a1, a2] = screen.getAllByText(/respuesta (uno|dos)\./i, { selector: '.faq-answer' });
    expect(a1).toBeVisible();
    expect(a2).not.toBeVisible();
    expect(q1).toHaveAttribute('aria-expanded', 'true');
    expect(q2).toHaveAttribute('aria-expanded', 'false');

    await user.click(q1);
    expect(a1).not.toBeVisible();
  });
});
