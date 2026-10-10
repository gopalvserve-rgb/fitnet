import Link from 'next/link';
import { PackageCard } from '@/components/Cards';
import Media from '@/components/Media';
import { SectionHead } from '@/components/Ornament';
import { api } from '@/lib/api';
import { IMG } from '@/lib/images';

export const metadata = { title: 'Wedding Packages', description: 'All-inclusive destination wedding packages for Jim Corbett and Delhi NCR.' };

export default async function PackagesPage() {
  const packages = await api('/packages');
  return (
    <>
      <Media src={IMG.baraat} className="hero hero--short" warm>
        <div className="hero__content">
          <span className="eyebrow">Transparent Pricing</span>
          <h1>Wedding Packages</h1>
          <p>All-inclusive packages built around your guest list, with nothing hidden.</p>
        </div>
      </Media>
      <section className="section section--cream">
        <div className="container">
          <SectionHead eyebrow="Choose" title="Packages for every celebration" lead="Prices are indicative starting points. Every package is customised after your consultation." />
          <div className="grid grid--3">{packages.map((p) => <PackageCard key={p.slug} pkg={p} />)}</div>
        </div>
      </section>
      <section className="section section--forest cta-band">
        <div className="container">
          <span className="eyebrow">Not sure yet?</span>
          <h2>Let’s design a package just for you</h2>
          <p className="lead">Share your dates and guest count, and we will send you a tailored proposal within 48 hours.</p>
          <Link href="/contact#enquire" className="btn" style={{ marginTop: 20 }}>Request Custom Quote</Link>
        </div>
      </section>
    </>
  );
}
