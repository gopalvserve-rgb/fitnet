import Link from 'next/link';
import { notFound } from 'next/navigation';
import EnquiryForm from '@/components/EnquiryForm';
import Media from '@/components/Media';
import Ornament from '@/components/Ornament';
import { api } from '@/lib/api';
import { inr } from '@/lib/format';

const SLUG = /^[a-z0-9-]{1,80}$/;
const load = (slug) => (SLUG.test(slug) ? api(`/venues/${slug}`) : null);

export async function generateMetadata({ params }) {
  const v = await load((await params).slug);
  return v ? { title: `${v.name}, ${v.destination_name}`, description: v.description } : { title: 'Not found' };
}

export default async function VenuePage({ params }) {
  const v = await load((await params).slug);
  if (!v) notFound();
  return (
    <>
      <Media src={v.image} className="hero hero--short" warm={v.destination === 'delhi-ncr'}>
        <div className="hero__content">
          <div className="breadcrumb">
            <Link href="/venues">Venues</Link> / <Link href={`/destinations/${v.destination}`}>{v.destination_name}</Link>
          </div>
          <span className="eyebrow">{v.type}</span>
          <h1>{v.name}</h1>
          <p>{v.description}</p>
        </div>
      </Media>
      <section className="section">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Venue Details</span>
            <h2>At a glance</h2>
            <Ornament />
            <dl className="facts" style={{ marginBottom: 32 }}>
              <div><dt>Guests</dt><dd>{v.capacity_min}–{v.capacity_max}</dd></div>
              <div><dt>Starting at</dt><dd>{inr(v.price_from)}</dd></div>
              <div><dt>Location</dt><dd>{v.destination_name}</dd></div>
            </dl>
            <h3>Highlights</h3>
            <ul className="ticks">{v.features.map((f) => <li key={f}>{f}</li>)}</ul>
            <p className="prose">Prices are indicative for a two-day celebration, including venue and basic décor. Your final quote depends on dates, guest count and inclusions.</p>
          </div>
          <div id="enquire">
            <EnquiryForm defaultDestination={v.destination} note={`Interested in venue: ${v.name}`} />
          </div>
        </div>
      </section>
    </>
  );
}
