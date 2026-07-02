import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <Link to="/about">Sobre Nosotros</Link>
        <Link to="/contact">Contacto</Link>
        <Link to="/privacy">Política de Privacidad</Link>
        <Link to="/terms">Términos y Condiciones</Link>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} PDF Converter. Todos los derechos reservados.</p>
    </footer>
  );
}
