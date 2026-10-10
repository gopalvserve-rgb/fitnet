import Link from 'next/link';
import Media from '@/components/Media';
import Ornament, { SectionHead } from '@/components/Ornament';

export const metadata = { title: 'About Us', description: 'Meet the destination wedding planners behind unforgettable Jim Corbett and Delhi NCR weddings.' };

export default function AboutPage() {
  return (
    <>
      <Media src="https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=2000&q=80" className="hero hero--short">
        <div className="hero__content">
          <span className="eyebrow">Our Story</span>
          <h1>Planners, dreamers, storytellers</h1>
        </div>
      </Media>
      <section className="section">
        <div className="container split">
          <div>
            <span className="eyebrow">Who We Are</span>
            <h2>A decade of weddings in the wild &amp; the city</h2>
            <Ornament />
            <p className="prose">We started with a single riverside wedding in Corbett. Since then we have planned hundreds of celebrations across Uttarakhand’s forests and Delhi NCR’s grandest venues.</p>
            <p className="prose">We combine deep local relationships with resorts, décor artisans, caterers and transport partners, so you get premium experiences at honest prices.</p>
            <Link href="/contact#enquire" className="btn">Meet Our Planners</Link>
          </div>
          <Media src="https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1400&q=80" className="split__media" warm label="Wedding décor" />
        </div>
      </section>
      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Our Promise" title="What makes us different" />
          <div className="grid grid--3 steps">
            <div className="step"><h3>Local expertise</h3><p>On-ground teams in both Corbett and Delhi NCR who know every venue inside out.</p></div>
            <div className="step"><h3>Honest pricing</h3><p>Itemised quotes with no hidden markups, plus flexible payment milestones.</p></div>
            <div className="step"><h3>Guest-first care</h3><p>Travel desks, welcome hampers and 24×7 hospitality for all your guests.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
