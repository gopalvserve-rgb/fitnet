import EnquiryForm from '@/components/EnquiryForm';
import Ornament from '@/components/Ornament';
import { site } from '@/lib/site';

export const metadata = { title: 'Contact Us', description: 'Get a free consultation for your Jim Corbett or Delhi NCR destination wedding.' };

const PACKAGE = /^[a-z0-9-]{1,40}$/;

export default async function ContactPage({ searchParams }) {
  const { package: pkg } = await searchParams;
  const note = typeof pkg === 'string' && PACKAGE.test(pkg) ? `Interested in package: ${pkg}` : '';
  return (
    <section className="section" id="enquire">
      <div className="container split" style={{ alignItems: 'start' }}>
        <div>
          <span className="eyebrow">Contact</span>
          <h1 style={{ fontSize: 'clamp(2.4rem,5vw,3.6rem)' }}>Let’s plan something beautiful</h1>
          <Ornament />
          <p className="prose">Whether you dream of pheras by a jungle river or a grand palace reception, we would love to hear from you.</p>
          <dl className="facts" style={{ gridTemplateColumns: '1fr' }}>
            <div><dt>Call</dt><dd><a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`}>{site.phone}</a></dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></div>
            <div><dt>Studio</dt><dd>{site.addressLines.map((l) => <span key={l} style={{ display: 'block' }}>{l}</span>)}</dd></div>
          </dl>
        </div>
        <EnquiryForm note={note} />
      </div>
    </section>
  );
}
