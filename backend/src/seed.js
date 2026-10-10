import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';

// Venue names are illustrative placeholders; replace them with your real partner venues.
const destinations = [
  {
    slug: 'jim-corbett',
    name: 'Jim Corbett',
    region: 'Uttarakhand',
    tagline: 'Vows beneath the sal forest, by the Kosi river',
    description:
      'India’s oldest national park sets the stage for weddings wrapped in wilderness. Exchange vows on a riverside lawn as the sun dips behind the Shivalik hills, host a haldi under ancient sal trees and send your guests on a dawn jungle safari before the sangeet. Corbett is just a five-hour drive from Delhi, which makes it ideal for intimate weekend celebrations of 50 to 300 guests.',
    highlights: [
      'Riverside mandaps on the Kosi',
      'Jungle safari & bonfire mehendi nights',
      'Luxury resorts with 40–120 rooms',
      '5–6 hrs drive / 4 hrs by train from Delhi',
    ],
    best_season: 'October – March',
    distance: '260 km from Delhi',
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/Jdzbg4YclP1VJBw0jivZq/KKAS9WriAzCJJgjUbFgYL.jpg',
    sort: 1,
  },
  {
    slug: 'delhi-ncr',
    name: 'Delhi NCR',
    region: 'Delhi · Gurugram · Noida',
    tagline: 'Grand farmhouse & palace weddings in the capital',
    description:
      'From sprawling Chhattarpur farmhouses to Mughal-inspired palace hotels on the Gurugram–Jaipur highway, Delhi NCR lets you host a royal wedding without asking guests to travel far. Expect lavish décor, world-class catering and seamless logistics for 200 to 2,000 guests, all close to the international airport.',
    highlights: [
      'Farmhouses in Chhattarpur & Mehrauli',
      'Palace hotels in Gurugram & Manesar',
      '15–45 mins from IGI Airport',
      'Celebrations for 200 to 2,000 guests',
    ],
    best_season: 'October – March',
    distance: 'In the city',
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/gj4kEuKGavc07FD99bgTW/P4wXqg-oJLfjHh7YuL9jM.jpg',
    sort: 2,
  },
];

const venues = [
  {
    slug: 'kosi-riverside-retreat', destination: 'jim-corbett', name: 'Kosi Riverside Retreat',
    type: 'Riverside Resort', capacity_min: 50, capacity_max: 300, price_from: 1800000,
    description: 'A riverfront lawn for pheras at sunset, with 60 cottages tucked among mango orchards.',
    features: ['Riverside mandap', '60 cottages', 'Infinity pool', 'In-house safari desk'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/XtxNCRylHYEjhkY3HkTaY/W0htQoBfuJ0pGC7_mOPBl.jpg',
  },
  {
    slug: 'sal-forest-lodge', destination: 'jim-corbett', name: 'Sal Forest Lodge',
    type: 'Jungle Lodge', capacity_min: 30, capacity_max: 150, price_from: 1200000,
    description: 'An intimate jungle lodge on the edge of the buffer zone, built for boutique weddings.',
    features: ['Forest-view banquet', '32 luxury tents', 'Bonfire courtyard', 'Spa'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/Hf3yODIxBMclbh6IHcYIO/WR5fntRjkiFn9FJu2T02a.jpg',
  },
  {
    slug: 'shivalik-hills-palace', destination: 'jim-corbett', name: 'Shivalik Hills Palace',
    type: 'Heritage Resort', capacity_min: 100, capacity_max: 450, price_from: 2800000,
    description: 'A colonial-style estate with manicured lawns and views across the Shivalik range.',
    features: ['3 event lawns', '110 rooms', 'Ballroom', 'Helipad access'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/h88bQ5AV94iCH0KpJguhf/bGUvWdUzsAtr-cehL9_97.jpg',
  },
  {
    slug: 'chhattarpur-grand-farms', destination: 'delhi-ncr', name: 'Chhattarpur Grand Farms',
    type: 'Farmhouse', capacity_min: 200, capacity_max: 1500, price_from: 2500000,
    description: 'Eight acres of lawns and a glass pavilion in South Delhi’s farmhouse belt.',
    features: ['8-acre lawns', 'Glass pavilion', 'Valet for 400 cars', 'Bridal suite'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/SdjERbkZMGvCs7v4MNQ4r/JFHsEkgnHsXh85AOB_gkF.jpg',
  },
  {
    slug: 'aravali-palace-gurugram', destination: 'delhi-ncr', name: 'Aravali Palace, Gurugram',
    type: 'Palace Hotel', capacity_min: 150, capacity_max: 1200, price_from: 4500000,
    description: 'Mughal arches, fountains and 200 suites on the Delhi–Jaipur highway.',
    features: ['200 suites', 'Courtyard mandap', 'Pillarless ballroom', 'Royal baraat route'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/gj4kEuKGavc07FD99bgTW/P4wXqg-oJLfjHh7YuL9jM.jpg',
  },
  {
    slug: 'yamuna-banks-noida', destination: 'delhi-ncr', name: 'Yamuna Banks Estate, Noida',
    type: 'Luxury Lawn', capacity_min: 300, capacity_max: 2000, price_from: 2000000,
    description: 'A sprawling estate in Greater Noida with river views and a dedicated sangeet arena.',
    features: ['Sangeet arena', 'Multiple lawns', 'Close to expressway', 'Ample parking'],
    image: 'https://cdn.gamma.app/yqnjlktvyepx0zq/design-anything/gRv3q6TR1CimzuULaELHt/pFVL4CEIxARJNMi5MwnsX.jpg',
  },
];

const packages = [
  {
    slug: 'intimate-wilds', name: 'Intimate Wilds', price_from: 1500000, guests: 'Up to 100 guests', nights: 2,
    inclusions: ['Venue & 2-night stay', 'Décor for 3 functions', 'Jungle safari for family', 'Photography', 'Wedding planner'],
    featured: 0, sort: 1,
  },
  {
    slug: 'royal-celebration', name: 'Royal Celebration', price_from: 3500000, guests: '100 – 300 guests', nights: 3,
    inclusions: ['Venue & 3-night stay', 'Theme décor for 5 functions', 'Gourmet catering', 'Photo + cinematic film', 'Guest hospitality desk', 'Sangeet entertainment'],
    featured: 1, sort: 2,
  },
  {
    slug: 'grand-signature', name: 'Grand Signature', price_from: 7500000, guests: '300+ guests', nights: 3,
    inclusions: ['Palace/premium venue', 'Celebrity décor designer', 'Live counters & bar', 'Celebrity performer', 'Logistics & transfers', 'End-to-end planning team'],
    featured: 0, sort: 3,
  },
];

const testimonials = [
  { couple: 'Ananya & Rohan', destination: 'jim-corbett', wedding_month: 'Feb 2026',
    quote: 'Our pheras by the river at golden hour felt like a dream. The team handled 180 guests, safaris and three functions flawlessly.' },
  { couple: 'Simran & Kabir', destination: 'delhi-ncr', wedding_month: 'Dec 2025',
    quote: 'They turned a Gurugram palace into a royal fairytale for 900 guests, and we didn’t have to worry about a single thing.' },
  { couple: 'Meera & Arjun', destination: 'jim-corbett', wedding_month: 'Nov 2025',
    quote: 'Bonfire mehendi, a forest haldi and the most beautiful décor. Our friends still talk about that weekend.' },
];

export async function seed(db, { adminEmail, adminPassword } = {}) {
  db.exec('BEGIN');
  try {
    const insDest = db.prepare(`INSERT INTO destinations (slug,name,region,tagline,description,highlights,best_season,distance,image,sort)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET image = excluded.image`);
    for (const d of destinations) {
      insDest.run(d.slug, d.name, d.region, d.tagline, d.description, JSON.stringify(d.highlights), d.best_season, d.distance, d.image, d.sort);
    }
    const destId = db.prepare('SELECT id FROM destinations WHERE slug = ?');
    const insVenue = db.prepare(`INSERT INTO venues (slug,destination_id,name,type,capacity_min,capacity_max,price_from,description,features,image)
      VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO UPDATE SET image = excluded.image`);
    for (const v of venues) {
      insVenue.run(v.slug, destId.get(v.destination).id, v.name, v.type, v.capacity_min, v.capacity_max, v.price_from, v.description, JSON.stringify(v.features), v.image);
    }
    const insPkg = db.prepare(`INSERT INTO packages (slug,name,price_from,guests,nights,inclusions,featured,sort)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(slug) DO NOTHING`);
    for (const p of packages) {
      insPkg.run(p.slug, p.name, p.price_from, p.guests, p.nights, JSON.stringify(p.inclusions), p.featured, p.sort);
    }
    if (db.prepare('SELECT COUNT(*) AS n FROM testimonials').get().n === 0) {
      const insT = db.prepare('INSERT INTO testimonials (couple,destination_id,quote,wedding_month) VALUES (?,?,?,?)');
      for (const t of testimonials) insT.run(t.couple, destId.get(t.destination).id, t.quote, t.wedding_month);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters');
    const hash = await bcrypt.hash(adminPassword, 12);
    db.prepare(`INSERT INTO admins (email,password_hash) VALUES (?,?)
      ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash`).run(adminEmail, hash);
  }
}

// CLI: `npm run seed` (reads ADMIN_EMAIL / ADMIN_PASSWORD).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const db = openDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  let adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(12).toString('base64url');
    console.log(`No ADMIN_PASSWORD set; generated one for ${adminEmail}: ${adminPassword}`);
  }
  await seed(db, { adminEmail, adminPassword });
  console.log('Database seeded.');
}
