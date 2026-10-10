import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Testimonials, VenueCard } from '@/components/Cards';
import EnquiryForm from '@/components/EnquiryForm';
import Media from '@/components/Media';
import Ornament, { SectionHead } from '@/components/Ornament';
import { api } from '@/lib/api';

const SLUG = /^[a-z0-9-]{1,80}$/;

async function load(slug) {
  return SLUG.test(slug) ? api(`/destinations/${slug}`) : null;
}

export async function generateMetadata({ params }) {
  const d = await load((await params).slug);
  return d ? { title: `${d.name} Destination Weddings`, description: d.tagline } : { title: 'Not found' };
}

const EXPERIENCES = {
  'jim-corbett': [
    ['Riverside Pheras', 'Take your vows on the banks of the Kosi as the sun sets over the hills.'],
    ['Jungle Safari Brunch', 'Morning jeep safaris for the family, followed by a forest-side brunch.'],
    ['Bonfire Sangeet', 'Starlit sangeet nights with folk musicians and a crackling bonfire.'],
  ],
  'delhi-ncr': [
    ['Royal Baraat', 'Horse-drawn carriages, dhol and a fireworks entry through palace gates.'],
    ['Farmhouse Mehendi', 'Floral, colourful daytime mehendi on sprawling farmhouse lawns.'],
    ['Grand Reception', 'Pillarless ballrooms for receptions of up to 2,000 guests.'],
  ],
};

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  const d = await load(slug);
  if (!d) notFound();
  const testimonials = (await api('/testimonials')).filter((t) => t.destination === d.slug);

  return (
    <>
      <Media src={d.image} className="hero hero--short" warm={d.slug === 'delhi-ncr'}>
        <div className="hero__content">
          <div className="breadcrumb"><Link href="/">Home</Link> / Destinations</div>
          <span className="eyebrow">{d.region}</span>
          <h1>{d.name} Weddings</h1>
          <p>{d.tagline}</p>
          <Link href="#enquire" className="btn">Get a Quote</Link>
        </div>
      </Media>

      <section className="section">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">The Destination</span>
            <h2>Why {d.name}?</h2>
            <Ornament />
            <p className="prose">{d.description}</p>
          </div>
          <div>
            <ul className="ticks">{d.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
            <dl className="facts">
              <div><dt>Best season</dt><dd>{d.best_season}</dd></div>
              <div><dt>Distance</dt><dd>{d.distance}</dd></div>
              <div><dt>Venues</dt><dd>{d.venues.length}+ curated</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Experiences" title={`Signature ${d.name} moments`} />
          <div className="grid grid--3 steps">
            {(EXPERIENCES[d.slug] || []).map(([t, desc]) => <div className="step" key={t}><h3>{t}</h3><p>{desc}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Venues" title={`Wedding venues in ${d.name}`} />
          <div className="grid grid--3">{d.venues.map((v) => <VenueCard key={v.slug} venue={v} />)}</div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="section section--cream">
          <div className="container">
            <SectionHead eyebrow="Love Notes" title={`${d.name} couples`} />
            <Testimonials items={testimonials} />
          </div>
        </section>
      )}

      <section className="section" id="enquire">
        <div className="container" style={{ maxWidth: 900 }}>
          <SectionHead eyebrow="Enquire" title={`Plan your ${d.name} wedding`} />
          <EnquiryForm defaultDestination={d.slug} />
        </div>
      </section>
    </>
  );
}
