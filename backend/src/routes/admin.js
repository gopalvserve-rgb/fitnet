import bcrypt from 'bcryptjs';
import { Router } from 'express';
import {
  COOKIE_NAME, loginLimiter, requireAdmin, sessionCookieOptions, signSession,
} from '../middleware/security.js';
import { formatZodError, idParam, loginSchema, statusSchema } from '../validation.js';

// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

export function authRoutes(db) {
  const r = Router();
  const findAdmin = db.prepare('SELECT id, email, password_hash FROM admins WHERE email = ?');

  r.post('/login', loginLimiter(), async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid credentials' });
    const admin = findAdmin.get(parsed.data.email);
    const ok = await bcrypt.compare(parsed.data.password, admin?.password_hash ?? DUMMY_HASH);
    if (!admin || !ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.cookie(COOKIE_NAME, signSession(admin), sessionCookieOptions());
    res.json({ email: admin.email });
  });

  r.post('/logout', (_req, res) => {
    const { maxAge, ...opts } = sessionCookieOptions();
    res.clearCookie(COOKIE_NAME, opts);
    res.json({ ok: true });
  });

  r.get('/me', requireAdmin, (req, res) => res.json({ email: req.admin.email }));
  return r;
}

export function adminRoutes(db) {
  const r = Router();
  r.use(requireAdmin);
  r.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const q = {
    count: db.prepare('SELECT COUNT(*) AS n FROM enquiries'),
    countByStatus: db.prepare('SELECT COUNT(*) AS n FROM enquiries WHERE status = ?'),
    list: db.prepare(`SELECT id,name,email,phone,destination,wedding_date,guests,budget,message,status,created_at
      FROM enquiries ORDER BY id DESC LIMIT ? OFFSET ?`),
    listByStatus: db.prepare(`SELECT id,name,email,phone,destination,wedding_date,guests,budget,message,status,created_at
      FROM enquiries WHERE status = ? ORDER BY id DESC LIMIT ? OFFSET ?`),
    stats: db.prepare('SELECT status, COUNT(*) AS n FROM enquiries GROUP BY status'),
    setStatus: db.prepare('UPDATE enquiries SET status = ? WHERE id = ?'),
    del: db.prepare('DELETE FROM enquiries WHERE id = ?'),
  };

  r.get('/enquiries', (req, res) => {
    const page = Math.max(1, Math.min(10000, parseInt(req.query.page, 10) || 1));
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize, 10) || 20));
    const offset = (page - 1) * pageSize;
    let status;
    if (req.query.status) {
      const s = statusSchema.safeParse({ status: req.query.status });
      if (!s.success) return res.status(400).json({ error: 'Invalid status' });
      status = s.data.status;
    }
    const items = status ? q.listByStatus.all(status, pageSize, offset) : q.list.all(pageSize, offset);
    const total = (status ? q.countByStatus.get(status) : q.count.get()).n;
    const stats = Object.fromEntries(q.stats.all().map((s) => [s.status, s.n]));
    res.json({ items, total, page, pageSize, stats });
  });

  r.patch('/enquiries/:id', (req, res) => {
    const id = idParam.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ error: 'Invalid id' });
    const body = statusSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ error: 'Validation failed', details: formatZodError(body.error) });
    const { changes } = q.setStatus.run(body.data.status, id.data);
    if (!changes) return res.status(404).json({ error: 'Enquiry not found' });
    res.json({ ok: true });
  });

  r.delete('/enquiries/:id', (req, res) => {
    const id = idParam.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ error: 'Invalid id' });
    const { changes } = q.del.run(id.data);
    if (!changes) return res.status(404).json({ error: 'Enquiry not found' });
    res.status(204).end();
  });

  return r;
}
