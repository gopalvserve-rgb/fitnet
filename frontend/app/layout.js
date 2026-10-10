import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/jost/300.css';
import '@fontsource/jost/400.css';
import '@fontsource/jost/500.css';
import './globals.css';
import { headers } from 'next/headers';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import WhatsApp from '@/components/WhatsApp';
import { site } from '@/lib/site';

export const metadata = {
  title: { default: `${site.name} | Destination Weddings in Jim Corbett & Delhi NCR`, template: `%s | ${site.name}` },
  description:
    'Luxury destination wedding planners for Jim Corbett resorts and Delhi NCR farmhouses & palaces. Venues, décor, catering and complete wedding planning.',
  keywords: ['Jim Corbett wedding', 'destination wedding Delhi NCR', 'Corbett wedding resorts', 'farmhouse wedding Delhi', 'wedding planner'],
};

export default async function RootLayout({ children }) {
  // Reading headers opts every page into dynamic rendering, which per-request CSP nonces require.
  await headers();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="hp">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <WhatsApp />
      </body>
    </html>
  );
}
