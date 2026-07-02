import { useState } from 'react';
import SeoHead from '../components/SeoHead';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xqevggaa'; // reemplaza con tu ID de Formspree

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        // fallback: abrir cliente de correo
        window.location.href = `mailto:e3522e@gmail.com?subject=Contacto desde PDF Converter&body=Nombre: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0A${encodeURIComponent(message)}`;
        setSent(true);
      }
    } catch {
      // fallback si Formspree no está configurado
      window.location.href = `mailto:e3522e@gmail.com?subject=Contacto desde PDF Converter&body=Nombre: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0A${encodeURIComponent(message)}`;
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home">
      <SeoHead title="Contacto" description="Contáctanos para preguntas, sugerencias o reportar problemas con las herramientas PDF." path="/contact" />
      <div className="info-section" style={{ marginTop: '2rem', maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Contacto</h1>
        <p style={{ marginBottom: '1.5rem' }}>
          ¿Tienes alguna pregunta, sugerencia o problema con alguna herramienta?
          Escríbenos y te responderemos a la brevedad.
        </p>

        {sent ? (
          <p style={{ color: 'green', fontWeight: 600 }}>✓ Mensaje enviado. ¡Gracias por escribirnos!</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="option-group">
              <label>Nombre</label>
              <input
                type="text" required placeholder="Tu nombre"
                value={name} onChange={e => setName(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
            <div className="option-group">
              <label>Email</label>
              <input
                type="email" required placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </div>
            <div className="option-group">
              <label>Mensaje</label>
              <textarea
                required rows={5} placeholder="Escribe tu mensaje..."
                value={message} onChange={e => setMessage(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--border)', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            {error && <p className="msg-error">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar mensaje'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
