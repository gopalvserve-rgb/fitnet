import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { parseJsonCols } from '../db.js';
import { enquiryLimiter } from '../middleware/security.js';
import { enquirySchema, formatZodError, slugParam } from '../validation.js';

const DEST_COLS = 'id, slug, name, region, tagline, description, highlights, best_season, distance, image';
const VENUE_COLS = `v.id, v.slug, v.name, v.type, v.capacity_min, v.capacity_max, v.price_from,
  v.description, v.features, v.image, d.slug AS destination, d.name AS destination_name`;

export function publicRoutes(db) {
  const r = Router();
  const q = {
    destinations: db.prepare(`SELECT ${DEST_COLS} FROM destinations ORDER BY sort`),
    destination: db.prepare(`SELECT ${DEST_COLS} FROM destinations WHERE slug = ?`),
    venues: db.prepare(`SELECT ${VENUE_COLS} FROM venues v JOIN destinations d ON d.id = v.destination_id ORDER BY d.sort, v.price_from`),
    venuesByDest: db.prepare(`SELECT ${VENUE_COLS} FROM venues v JOIN destinations d ON d.id = v.destination_id WHERE d.slug = ? ORDER BY v.price_from`),
    venue: db.prepare(`SELECT ${VENUE_COLS} FROM venues v JOIN destinations d ON d.id = v.destination_id WHERE v.slug = ?`),
    packages: db.prepare('SELECT id, slug, name, price_from, guests, nights, inclusions, featured FROM packages ORDER BY sort'),
    testimonials: db.prepare(`SELECT t.id, t.couple, t.quote, t.wedding_month, d.slug AS destination, d.name AS destination_name
      FROM testimonials t LEFT JOIN destinations d ON d.id = t.destination_id ORDER BY t.id`),
    recentByEmail: db.prepare(`SELECT COUNT(*) AS n FROM enquiries WHERE email = ? AND created_at > datetime('now', '-1 day')`),
    insertEnquiry: db.prepare(`INSERT INTO enquiries (name,email,phone,destination,wedding_date,guests,budget,message,ip_hash)
      VALUES (?,?,?,?,?,?,?,?,?)`),
  };
  const venue = (row) => parseJsonCols(row, ['features']);

  r.get('/destinations', (_req, res) => {
    res.json(q.destinations.all().map((d) => parseJsonCols(d, ['highlights'])));
  });

  r.get('/destinations/:slug', (req, res) => {
    const slug = slugParam.safeParse(req.params.slug);
    const row = slug.success && q.destination.get(slug.data);
    if (!row) return res.status(404).json({ error: 'Destination not found' });
    res.json({ ...parseJsonCols(row, ['highlights']), venues: q.venuesByDest.all(slug.data).map(venue) });
  });

  r.get('/venues', (req, res) => {
    const { destination } = req.query;
    if (destination === undefined) return res.json(q.venues.all().map(venue));
    const slug = slugParam.safeParse(destination);
    if (!slug.success) return res.status(400).json({ error: 'Invalid destination' });
    res.json(q.venuesByDest.all(slug.data).map(venue));
  });

  r.get('/venues/:slug', (req, res) => {
    const slug = slugParam.safeParse(req.params.slug);
    const row = slug.success && q.venue.get(slug.data);
    if (!row) return res.status(404).json({ error: 'Venue not found' });
    res.json(venue(row));
  });

  r.get('/packages', (_req, res) => {
    res.json(q.packages.all().map((p) => ({ ...parseJsonCols(p, ['inclusions']), featured: !!p.featured })));
  });

  r.get('/testimonials', (_req, res) => res.json(q.testimonials.all()));

  r.post('/enquiries', enquiryLimiter(), (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Validation failed', details: formatZodError(parsed.error) });
    const e = parsed.data;
    // Bots fill the hidden honeypot; pretend success so they learn nothing.
    if (e.website) return res.status(201).json({ ok: true });
    // IP limits can be dodged; also cap per email address.
    if (q.recentByEmail.get(e.email).n >= 3) {
      return res.status(429).json({ error: 'We already have your enquiry and will be in touch shortly.' });
    }
    const ipHash = crypto.createHmac('sha256', config.ipHashSalt).update(req.ip || '').digest('hex').slice(0, 32);
    q.insertEnquiry.run(e.name, e.email, e.phone, e.destination, e.wedding_date ?? null, e.guests ?? null,
      e.budget ?? null, e.message ?? null, ipHash);
    res.status(201).json({ ok: true });
  });

  return r;
}
