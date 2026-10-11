import { site } from '@/lib/site';

const tel = site.phone.replace(/[^\d+]/g, '');

export default function FloatingActions() {
  return (
    <div className="fab-stack">
      <a className="fab fab--call" href={`tel:${tel}`} aria-label={`Call us at ${site.phone}`}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1l-2.2 2.2z" />
        </svg>
        <span className="fab__label">Call Now</span>
      </a>
    </div>
  );
}
