import Link from 'next/link';
import { VenueCard } from '@/components/Cards';
import Media from '@/components/Media';
import { SectionHead } from '@/components/Ornament';
import { api } from '@/lib/api';
import { IMG } from '@/lib/images';

export const metadata = { title: 'Wedding Venues', description: 'Wedding resorts in Jim Corbett and farmhouses & palace hotels in Delhi NCR.' };

const FILTERS = [['', 'All Venues'], ['jim-corbett', 'Jim Corbett'], ['delhi-ncr', 'Delhi NCR']];

export default async function VenuesPage({ searchParams }) {
  const { destination = '' } = await searchParams;
  const active = FILTERS.some(([v]) => v === destination) ? destination : '';
  const venues = await api(active ? `/venues?destination=${active}` : '/venues');

  return (
    <>
      <Media src={IMG.reception} className="hero hero--short">
        <div className="hero__content">
          <span className="eyebrow">Our Collection</span>
          <h1>Wedding Venues</h1>
          <p>Riverside resorts, jungle lodges, palace hotels and grand farmhouses, each one personally vetted.</p>
        </div>
      </Media>
      <section className="section">
        <div className="container">
          <SectionHead eyebrow="Browse" title="Find your perfect setting" />
          <nav className="tabs" aria-label="Filter venues">
            {FILTERS.map(([v, l]) => (
              <Link key={l} href={v ? `/venues?destination=${v}` : '/venues'} className={`btn btn--sm ${active === v ? '' : 'btn--outline'}`} aria-current={active === v ? 'true' : undefined}>
                {l}
              </Link>
            ))}
          </nav>
          <div className="grid grid--3">{venues.map((v) => <VenueCard key={v.slug} venue={v} />)}</div>
        </div>
      </section>
    </>
  );
}
