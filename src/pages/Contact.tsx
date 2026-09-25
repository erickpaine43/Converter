import { useState } from 'react';
import SeoHead from '../components/SeoHead';

// Netlify Forms: el formulario se registra en build time a partir de
// public/__forms.html (el HTML prerenderizado de esta página no se usa para
// detección). Se envía por fetch a esa ruta estática para no pasar por el
// redirect SPA "/*" -> "/index.html" de netlify.toml.
const CONTACT_FORM_NAME = 'contact';
const CONTACT_FORM_ENDPOINT = '/__forms.html';
const CONTACT_EMAIL = 'e3522e@gmail.com';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const inputStyle = { padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-hairline)' };

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [botField, setBotField] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          'form-name': CONTACT_FORM_NAME,
          'bot-field': botField,
          name,
          email,
          message,
        }).toString(),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  };

  const mailtoHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Contacto desde PDF Converter')}&body=${encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\n\n${message}`)}`;

  return (
    <main className="home">
      <SeoHead title="Contacto" description="Contáctanos para preguntas, sugerencias o reportar problemas con las herramientas PDF." path="/contact" />
      <div className="info-section" style={{ marginTop: '2rem', maxWidth: 560 }}>
        <h1 className="page-title" style={{ marginBottom: 'var(--space-2)' }}>Contacto</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          ¿Tienes alguna pregunta, sugerencia o problema con alguna herramienta?
          Escríbenos y te responderemos a la brevedad.
        </p>

        {status === 'sent' ? (
          <p className="msg-success" role="status">Mensaje enviado. ¡Gracias por escribirnos!</p>
        ) : (
          <form
            name={CONTACT_FORM_NAME}
            method="POST"
            action={CONTACT_FORM_ENDPOINT}
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input type="hidden" name="form-name" value={CONTACT_FORM_NAME} />
            <p hidden>
              <label htmlFor="contact-bot-field">No completes este campo</label>
              <input
                id="contact-bot-field" name="bot-field" tabIndex={-1} autoComplete="off"
                value={botField} onChange={e => setBotField(e.target.value)}
              />
            </p>
            <div className="option-group">
              <label htmlFor="contact-name">Nombre</label>
              <input
                id="contact-name" name="name" type="text" required placeholder="Tu nombre" autoComplete="name"
                value={name} onChange={e => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="option-group">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email" name="email" type="email" required placeholder="tu@email.com" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="option-group">
              <label htmlFor="contact-message">Mensaje</label>
              <textarea
                id="contact-message" name="message" required rows={5} placeholder="Escribe tu mensaje..."
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            {status === 'error' && (
              <p className="msg-error" role="alert">
                No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos o escríbenos
                directamente a <a href={mailtoHref}>{CONTACT_EMAIL}</a>.
              </p>
            )}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={status === 'sending'}>
              {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
