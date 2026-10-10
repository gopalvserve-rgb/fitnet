import Link from 'next/link';
import Media from '@/components/Media';
import Ornament, { SectionHead } from '@/components/Ornament';
import { IMG } from '@/lib/images';
import { site, yearsOfLegacy } from '@/lib/site';

export const metadata = { title: 'About Us', description: 'Meet the destination wedding planners behind unforgettable Jim Corbett and Delhi NCR weddings.' };

export default function AboutPage() {
  return (
    <>
      <Media src={IMG.haldi} className="hero hero--short">
        <div className="hero__content">
          <span className="eyebrow">Our Story</span>
          <h1>Planners, dreamers, storytellers</h1>
        </div>
      </Media>
      <section className="section">
        <div className="container split">
          <div>
            <span className="eyebrow">Who We Are</span>
            <h2>{yearsOfLegacy()} years of legacy in the wild &amp; the city</h2>
            <Ornament />
            <p className="prose">Vows7 is a brand of {site.company}. Since {site.founded} we have grown from a single riverside wedding in Corbett to hundreds of celebrations across Uttarakhand’s forests and Delhi NCR’s grandest venues.</p>
            <p className="prose">We combine deep local relationships with resorts, décor artisans, caterers and transport partners, so you get premium experiences at honest prices.</p>
            <Link href="/contact#enquire" className="btn">Meet Our Planners</Link>
          </div>
          <Media src={IMG.sangeet} className="split__media" warm label="Sangeet night by the bonfire" />
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
