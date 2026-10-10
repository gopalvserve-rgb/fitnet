import Link from 'next/link';
import { inr } from '@/lib/format';
import Media from './Media';

export function VenueCard({ venue }) {
  return (
    <article className="card" data-testid="venue-card">
      <Media src={venue.image} className="card__media" label={venue.name} warm={venue.destination === 'delhi-ncr'} />
      <div className="card__body">
        <span className="card__tag">{venue.type} · {venue.destination_name}</span>
        <h3><Link href={`/venues/${venue.slug}`}>{venue.name}</Link></h3>
        <p>{venue.description}</p>
        <ul className="chips">{venue.features.slice(0, 3).map((f) => <li key={f}>{f}</li>)}</ul>
        <div className="card__footer">
          <span>{venue.capacity_min}–{venue.capacity_max} guests</span>
          <span className="price">from {inr(venue.price_from)}</span>
        </div>
      </div>
    </article>
  );
}

export function PackageCard({ pkg }) {
  return (
    <article className={`pkg ${pkg.featured ? 'pkg--featured' : ''}`} data-testid="package-card">
      {pkg.featured && <span className="pkg__badge">Most Loved</span>}
      <h3>{pkg.name}</h3>
      <div className="pkg__sub">{pkg.guests} · {pkg.nights} nights</div>
      <div className="price">{inr(pkg.price_from)}</div>
      <div className="pkg__sub">starting price</div>
      <ul>{pkg.inclusions.map((i) => <li key={i}>{i}</li>)}</ul>
      <Link href={`/contact?package=${pkg.slug}#enquire`} className={`btn ${pkg.featured ? '' : 'btn--outline'}`}>
        Enquire Now
      </Link>
    </article>
  );
}

export function Testimonials({ items }) {
  return (
    <div className="grid grid--3">
      {items.map((t) => (
        <figure className="quote" key={t.id} style={{ margin: 0 }}>
          <blockquote>{t.quote}</blockquote>
          <cite>{t.couple} · {t.destination_name} · {t.wedding_month}</cite>
        </figure>
      ))}
    </div>
  );
}
