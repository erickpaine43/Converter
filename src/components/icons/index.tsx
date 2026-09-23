import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Imágenes a PDF */
export function ImageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5.5-5.5L11 15l-3-3-5 5" />
    </Base>
  );
}

/** HTML a PDF */
export function CodeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <polyline points="8.5 6 3 12 8.5 18" />
      <polyline points="15.5 6 21 12 15.5 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </Base>
  );
}

/** PDF a Imágenes */
export function DocumentArrowIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 3h7l4 4v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M13.5 3v4h4" />
      <path d="M8.5 12.5h5M8.5 15.5h3.5" />
      <path d="M14.5 15.5l3 3m0 0l-3 3m3-3h-5.5" />
    </Base>
  );
}

/** Unir PDFs */
export function ClipIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.5 5.5 8 12a3 3 0 0 0 4.24 4.24l6-6a5 5 0 0 0-7.07-7.07L4.5 9.83" />
    </Base>
  );
}

/** PDF a Texto */
export function DocumentTextIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 3h7l4 4v13a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M13.5 3v4h4" />
      <path d="M8.5 12h7M8.5 15h7M8.5 18h4.5" />
    </Base>
  );
}

/** Privacidad (features) */
export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </Base>
  );
}

/** Velocidad (features) */
export function BoltIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </Base>
  );
}

/** Gratis (features) */
export function TagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M11.5 2H19a1 1 0 0 1 1 1v7.5a1 1 0 0 1-.29.71l-9 9a1 1 0 0 1-1.42 0l-7-7a1 1 0 0 1 0-1.42l9-9a1 1 0 0 1 .21-.17z" />
      <circle cx="16" cy="7" r="1.4" />
    </Base>
  );
}

/** Confianza — check circular (hero) */
export function ShieldCheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 2.5 5 5.5v5.4c0 4.6 3 7.9 7 9.1 4-1.2 7-4.5 7-9.1V5.5z" />
      <path d="M9 12l2 2 4-4.5" />
    </Base>
  );
}
