import Link from 'next/link';
import { PackageCard, Testimonials, VenueCard } from '@/components/Cards';
import EnquiryForm from '@/components/EnquiryForm';
import Media from '@/components/Media';
import Ornament, { SectionHead } from '@/components/Ornament';
import { api } from '@/lib/api';
import { yearsOfTrust } from '@/lib/site';

import { IMG } from '@/lib/images';

export default async function Home() {
  const [destinations, venues, packages, testimonials] = await Promise.all([
    api('/destinations'), api('/venues'), api('/packages'), api('/testimonials'),
  ]);
  const featured = [venues.find((v) => v.destination === 'jim-corbett'), venues.find((v) => v.destination === 'delhi-ncr'), venues[2]]
    .filter((v, i, a) => v && a.indexOf(v) === i);

  return (
    <>
      <Media src={IMG.hero} className="hero" label="Indian bride and groom at a riverside mandap">
        <div className="hero__content">
          <span className="eyebrow">{yearsOfTrust()} Years of Trust · Jim Corbett · Delhi NCR</span>
          <h1>Where forever begins, <em>wild &amp; regal</em></h1>
          <p>Luxury destination weddings in the forests of Jim Corbett and the palaces of Delhi NCR, planned end to end by one dedicated team.</p>
          <div className="hero__actions">
            <Link href="/contact#enquire" className="btn">Plan Your Wedding</Link>
            <Link href="#destinations" className="btn btn--light">Explore Destinations</Link>
          </div>
        </div>
      </Media>

      <section className="section" id="destinations">
        <div className="container">
          <SectionHead eyebrow="Our Destinations" title="Two worlds, one perfect day"
            lead="Choose the untamed romance of a riverside jungle wedding, or the timeless grandeur of a capital celebration." />
          <div className="grid grid--2">
            {destinations.map((d) => (
              <Link key={d.slug} href={`/destinations/${d.slug}`} className="dest-card" data-testid="destination-card">
                <Media src={d.image} className="media-zoom" warm={d.slug === 'delhi-ncr'} />
                <div className="dest-card__body">
                  <span className="dest-card__meta">{d.region}</span>
                  <h3>{d.name}</h3>
                  <p>{d.tagline}</p>
                  <span className="btn btn--light btn--sm">Discover {d.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container split">
          <Media src={IMG.mehendi} className="split__media" label="Bride's mehendi hands with bangles" />
          <div>
            <span className="eyebrow">Why Choose Us</span>
            <h2>Crafted with heart, delivered with precision</h2>
            <Ornament />
            <p className="prose">For {yearsOfTrust()} years, our Delhi-based team of planners, designers and hospitality experts has crafted celebrations. We know every riverside lawn in Corbett and every palace ballroom in NCR, and we handle all of it: venue, stay, décor, food, entertainment and guest logistics.</p>
            <ul className="ticks">
              <li>Handpicked partner resorts, palaces and farmhouses</li>
              <li>Transparent, all-inclusive packages with no hidden costs</li>
              <li>Dedicated planner plus an on-ground hospitality team</li>
              <li>Guest transfers from Delhi to Corbett by road or rail</li>
            </ul>
            <Link href="/about" className="btn btn--outline">Our Story</Link>
          </div>
        </div>
      </section>

      <section className="section section--forest">
        <div className="container stats">
          {[['350+', 'Weddings planned'], ['40+', 'Partner venues'], [String(yearsOfTrust()), 'Years of trust'], ['4.9★', 'Couple rating']].map(([n, l]) => (
            <div key={l}><div className="stat__num">{n}</div><div className="stat__label">{l}</div></div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Signature Venues" title="Handpicked for your celebration" />
          <div className="grid grid--3">{featured.map((v) => <VenueCard key={v.slug} venue={v} />)}</div>
          <div className="center" style={{ marginTop: 48 }}><Link href="/venues" className="btn btn--outline">View All Venues</Link></div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Wedding Packages" title="Thoughtfully curated packages" lead="Every package can be tailored to your guest list, rituals and style." />
          <div className="grid grid--3" style={{ alignItems: 'stretch' }}>{packages.map((p) => <PackageCard key={p.slug} pkg={p} />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHead eyebrow="How It Works" title="From hello to happily ever after" />
          <div className="grid grid--4 steps">
            {[
              ['Consultation', 'Share your vision, guest count and budget on a free call with our planner.'],
              ['Venue & Design', 'Visit shortlisted venues and approve a décor and theme concept.'],
              ['Planning', 'We handle vendors, menus, rooms, transfers and the run-of-show.'],
              ['Celebrate', 'Our on-ground team runs every function while you enjoy the moment.'],
            ].map(([t, d]) => <div className="step" key={t}><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Love Notes" title="Words from our couples" />
          <Testimonials items={testimonials} />
        </div>
      </section>

      <section className="section" id="enquire">
        <div className="container split" style={{ alignItems: 'start' }}>
          <div>
            <span className="eyebrow">Start Planning</span>
            <h2>Let’s create your story</h2>
            <Ornament />
            <p className="prose">Tell us a little about your celebration and a wedding specialist will reach out within 24 hours with venue options and a tailored estimate.</p>
            <ul className="ticks"><li>Free consultation</li><li>Venue recce assistance</li><li>Custom quote in 48 hours</li></ul>
          </div>
          <EnquiryForm />
        </div>
      </section>
    </>
  );
}
