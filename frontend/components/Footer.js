import Link from 'next/link';
import { nav, site } from '@/lib/site';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo light />
            <p style={{ marginTop: 22 }}>
              Curating unforgettable destination weddings in the wilderness of Jim Corbett and the grandeur of Delhi NCR since {site.founded}.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>{nav.map((n) => <li key={n.href}><Link href={n.href}>{n.label}</Link></li>)}</ul>
          </div>
          <div>
            <h4>Destinations</h4>
            <ul>
              <li><Link href="/destinations/jim-corbett">Jim Corbett Weddings</Link></li>
              <li><Link href="/destinations/delhi-ncr">Delhi NCR Weddings</Link></li>
              <li><Link href="/venues?destination=jim-corbett">Corbett Resorts</Link></li>
              <li><Link href="/venues?destination=delhi-ncr">NCR Farmhouses & Palaces</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li><a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></li>
              <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
              <li style={{ marginTop: 6 }}>{site.addressLines.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}</li>
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {site.name} by {site.company}. All rights reserved.</span>
          <span>Jim Corbett · Delhi · Gurugram · Noida</span>
        </div>
      </div>
    </footer>
  );
}
