import Link from 'next/link';
import { site } from '@/lib/site';

// Emblem: two interlocking wedding rings beneath a pair of leaves that form a "V" (forest + vows).
export function Emblem({ size = 52, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--logo-gold, #b8945f)" strokeWidth="2.2">
        <circle cx="25" cy="39" r="13" />
        <circle cx="39" cy="39" r="13" />
      </g>
      <g fill="var(--logo-leaf, #1f3a2f)">
        <path d="M32 24 C 24 22, 19 15, 20 7 C 27 9, 31 16, 32 24 Z" />
        <path d="M32 24 C 40 22, 45 15, 44 7 C 37 9, 33 16, 32 24 Z" />
      </g>
      <circle cx="32" cy="26" r="2.2" fill="var(--logo-gold, #b8945f)" />
    </svg>
  );
}

export default function Logo({ light = false }) {
  return (
    <Link href="/" className={`logo ${light ? 'logo--light' : ''}`} aria-label={`${site.name} home`}>
      <Emblem />
      <span className="logo__text">
        <span className="logo__name">Vows<em>7</em></span>
        <span className="logo__sub">Destination Weddings</span>
      </span>
    </Link>
  );
}
