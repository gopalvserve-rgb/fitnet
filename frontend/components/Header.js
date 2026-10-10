'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { nav, site } from '@/lib/site';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label={`${site.name} home`}>
      <span className="logo__name">{site.name}</span>
      <span className="logo__sub">Destination Weddings</span>
    </Link>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="header">
      <div className="container header__inner">
        <Logo />
        <button
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
        <nav id="main-nav" className="nav" data-open={open} aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={pathname === n.href ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
          <Link href="/contact#enquire" className="btn btn--sm">Plan Your Wedding</Link>
        </nav>
      </div>
    </header>
  );
}
