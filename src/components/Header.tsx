import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="wordmark">
        <span className="wordmark-accent">PDF</span> Converter
      </Link>
    </header>
  );
}
