process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = '1';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import request from 'supertest';
import { makeApp, login, validEnquiry, ORIGIN, ADMIN } from './helpers.js';

let app, db;
before(async () => ({ app, db } = await makeApp()));

describe('public content API', () => {
  it('lists both destinations with parsed highlights', async () => {
    const res = await request(app).get('/api/destinations').expect(200);
    assert.deepEqual(res.body.map((d) => d.slug), ['jim-corbett', 'delhi-ncr']);
    assert.ok(Array.isArray(res.body[0].highlights));
  });

  it('returns a destination with its venues', async () => {
    const res = await request(app).get('/api/destinations/jim-corbett').expect(200);
    assert.equal(res.body.name, 'Jim Corbett');
    assert.ok(res.body.venues.length >= 3);
    assert.ok(res.body.venues.every((v) => v.destination === 'jim-corbett'));
  });

  it('404s an unknown destination', async () => {
    await request(app).get('/api/destinations/goa').expect(404);
  });

  it('filters venues by destination', async () => {
    const res = await request(app).get('/api/venues?destination=delhi-ncr').expect(200);
    assert.ok(res.body.length >= 3 && res.body.every((v) => v.destination === 'delhi-ncr'));
    const all = await request(app).get('/api/venues').expect(200);
    assert.equal(all.body.length, 6);
  });

  it('returns a venue by slug, packages and testimonials', async () => {
    const v = await request(app).get('/api/venues/sal-forest-lodge').expect(200);
    assert.ok(Array.isArray(v.body.features));
    const p = await request(app).get('/api/packages').expect(200);
    assert.equal(p.body.filter((x) => x.featured).length, 1);
    const t = await request(app).get('/api/testimonials').expect(200);
    assert.ok(t.body.length >= 3);
  });

  it('health check works', async () => {
    await request(app).get('/api/health').expect(200, { ok: true });
  });
});

describe('enquiries', () => {
  it('accepts a valid enquiry', async () => {
    const body = validEnquiry();
    await request(app).post('/api/enquiries').set('Origin', ORIGIN).send(body).expect(201);
    const row = db.prepare('SELECT * FROM enquiries ORDER BY id DESC LIMIT 1').get();
    assert.equal(row.email, body.email);
    assert.equal(row.status, 'new');
    assert.match(row.ip_hash, /^[0-9a-f]{32}$/, 'stores a hash, not the raw IP');
  });

  it('accepts a minimal enquiry with empty date', async () => {
    const { name, email, phone } = validEnquiry();
    await request(app).post('/api/enquiries').send({ name, email, phone, destination: 'undecided', wedding_date: '' }).expect(201);
  });

  it('rejects invalid fields with field-level details', async () => {
    const res = await request(app).post('/api/enquiries')
      .send({ ...validEnquiry(), email: 'nope', phone: 'abc', destination: 'goa', guests: -3 }).expect(400);
    const fields = res.body.details.map((d) => d.field).sort();
    assert.deepEqual(fields, ['destination', 'email', 'guests', 'phone']);
  });

  it('caps enquiries per email address at 3 per day', async () => {
    const body = { ...validEnquiry(), email: 'Repeat@Example.com' };
    for (let i = 0; i < 3; i++) await request(app).post('/api/enquiries').send(body).expect(201);
    await request(app).post('/api/enquiries').send({ ...body, email: 'repeat@example.com' }).expect(429);
  });

  it('rejects missing required fields', async () => {
    await request(app).post('/api/enquiries').send({}).expect(400);
  });
});

describe('admin auth & enquiry management', () => {
  it('logs in with correct credentials and sets a hardened cookie', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send(ADMIN).expect(200);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Path=\//);
  });

  it('rejects wrong password and unknown email with the same message', async () => {
    const a = await request(app).post('/api/auth/login').send({ ...ADMIN, password: 'wrong-password-123' }).expect(401);
    const b = await request(app).post('/api/auth/login').send({ email: 'ghost@test.local', password: 'whatever-123' }).expect(401);
    assert.equal(a.body.error, b.body.error);
  });

  it('lists, filters, updates and deletes enquiries', async () => {
    const cookie = await login(app);
    const list = await request(app).get('/api/admin/enquiries').set('Cookie', cookie).expect(200);
    assert.ok(list.body.total >= 1);
    assert.equal(list.headers['cache-control'], 'no-store');
    const id = list.body.items[0].id;

    await request(app).patch(`/api/admin/enquiries/${id}`).set('Cookie', cookie).send({ status: 'contacted' }).expect(200);
    const filtered = await request(app).get('/api/admin/enquiries?status=contacted').set('Cookie', cookie).expect(200);
    assert.ok(filtered.body.items.some((e) => e.id === id));
    assert.ok(!('ip_hash' in filtered.body.items[0]), 'ip hash is not exposed');

    await request(app).patch(`/api/admin/enquiries/${id}`).set('Cookie', cookie).send({ status: 'hacked' }).expect(400);
    await request(app).delete(`/api/admin/enquiries/${id}`).set('Cookie', cookie).expect(204);
    await request(app).delete(`/api/admin/enquiries/${id}`).set('Cookie', cookie).expect(404);
  });

  it('me + logout', async () => {
    const cookie = await login(app);
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    assert.equal(me.body.email, ADMIN.email);
    const out = await request(app).post('/api/auth/logout').set('Cookie', cookie).send({}).expect(200);
    assert.match(out.headers['set-cookie'][0], /vw_session=;/);
  });
});
