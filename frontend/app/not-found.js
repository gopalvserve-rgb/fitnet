import Link from 'next/link';
import Ornament from '@/components/Ornament';

export default function NotFound() {
  return (
    <section className="section center">
      <div className="container">
        <span className="eyebrow">404</span>
        <h1>Page not found</h1>
        <Ornament />
        <p className="lead">The page you are looking for has wandered off into the jungle.</p>
        <Link href="/" className="btn">Back to home</Link>
      </div>
    </section>
  );
}
