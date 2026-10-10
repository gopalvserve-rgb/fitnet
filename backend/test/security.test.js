process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = '1';
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { config } from '../src/config.js';
import { makeApp, login, validEnquiry } from './helpers.js';

let app, db;
before(async () => ({ app, db } = await makeApp()));

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(app).get('/api/destinations');
    assert.equal(res.headers['x-powered-by'], undefined);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.match(res.headers['content-security-policy'], /default-src 'none'/);
    assert.match(res.headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.ok(res.headers['strict-transport-security']);
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
  });

  it('does not emit permissive CORS headers', async () => {
    const res = await request(app).get('/api/destinations').set('Origin', 'https://evil.example');
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});

describe('broken access control', () => {
  it('blocks every admin endpoint without a session', async () => {
    await request(app).get('/api/admin/enquiries').expect(401);
    await request(app).patch('/api/admin/enquiries/1').send({ status: 'closed' }).expect(401);
    await request(app).delete('/api/admin/enquiries/1').expect(401);
    await request(app).get('/api/auth/me').expect(401);
  });

  it('rejects forged, tampered, expired and alg=none tokens', async () => {
    const forged = jwt.sign({ email: 'x' }, 'wrong-secret', { subject: '1', issuer: 'vanya-weddings' });
    const expired = jwt.sign({ email: 'x' }, config.jwtSecret, { subject: '1', issuer: 'vanya-weddings', expiresIn: -10 });
    const wrongIssuer = jwt.sign({ email: 'x' }, config.jwtSecret, { subject: '1', issuer: 'someone-else' });
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"sub":"1","email":"x","iss":"vanya-weddings"}').toString('base64url')}.`;
    const good = (await login(app)).split('=')[1];
    const [h, , s] = good.split('.');
    const tampered = `${h}.${Buffer.from('{"sub":"999","email":"evil"}').toString('base64url')}.${s}`;
    for (const t of [forged, expired, wrongIssuer, none, tampered, 'garbage']) {
      await request(app).get('/api/admin/enquiries').set('Cookie', `vw_session=${t}`).expect(401);
    }
  });
});

describe('injection', () => {
  it('treats SQL injection in params and query as data', async () => {
    await request(app).get("/api/destinations/jim-corbett' OR '1'='1").expect(404);
    await request(app).get('/api/venues?destination=' + encodeURIComponent("x' UNION SELECT * FROM admins--")).expect(400);
    await request(app).get('/api/admin/enquiries?status=' + encodeURIComponent("new' OR 1=1--")).expect(401);
    const cookie = await login(app);
    await request(app).get('/api/admin/enquiries?status=' + encodeURIComponent("new' OR 1=1--")).set('Cookie', cookie).expect(400);
    await request(app).patch('/api/admin/enquiries/1%20OR%201=1').set('Cookie', cookie).send({ status: 'closed' }).expect(400);
  });

  it('SQL injection in login does not authenticate', async () => {
    await request(app).post('/api/auth/login').send({ email: "admin@test.local' --", password: 'x' }).expect(400);
    await request(app).post('/api/auth/login').send({ email: 'admin@test.local', password: "' OR '1'='1" }).expect(401);
  });

  it('stores XSS payloads verbatim as inert text (React escapes on render)', async () => {
    const payload = '<script>alert(1)</script><img src=x onerror=alert(2)>';
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), name: 'Eve <b>x</b>', message: payload }).expect(201);
    const row = db.prepare('SELECT message FROM enquiries ORDER BY id DESC LIMIT 1').get();
    assert.equal(row.message, payload);
    const cookie = await login(app);
    const res = await request(app).get('/api/admin/enquiries').set('Cookie', cookie);
    assert.match(res.headers['content-type'], /application\/json/);
  });

  it('rejects NoSQL/operator-style and type-confused bodies', async () => {
    await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: { $ne: null } }).expect(400);
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), guests: { $gt: 0 } }).expect(400);
    await request(app).post('/api/enquiries').send([validEnquiry()]).expect(400);
  });

  it('strips control characters from free text', async () => {
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), name: 'Null\u0000Byte\u0007' }).expect(201);
    const row = db.prepare('SELECT name FROM enquiries ORDER BY id DESC LIMIT 1').get();
    assert.equal(row.name, 'NullByte');
  });
});

describe('mass assignment & input limits', () => {
  it('rejects unknown fields such as status or id', async () => {
    const res = await request(app).post('/api/enquiries').send({ ...validEnquiry(), status: 'booked', id: 1 }).expect(400);
    assert.match(JSON.stringify(res.body), /Unrecognized key/);
  });

  it('rejects oversized bodies and overlong fields', async () => {
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), message: 'a'.repeat(20000) }).expect(413);
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), message: 'a'.repeat(2500) }).expect(400);
  });

  it('handles malformed JSON without leaking internals', async () => {
    const res = await request(app).post('/api/enquiries').set('Content-Type', 'application/json').send('{"name":').expect(400);
    assert.deepEqual(res.body, { error: 'Malformed JSON' });
  });

  it('honeypot submissions are silently dropped', async () => {
    const before = db.prepare('SELECT COUNT(*) n FROM enquiries').get().n;
    await request(app).post('/api/enquiries').send({ ...validEnquiry(), website: 'http://spam.example' }).expect(201);
    assert.equal(db.prepare('SELECT COUNT(*) n FROM enquiries').get().n, before);
  });

  it('caps admin page size', async () => {
    const cookie = await login(app);
    const res = await request(app).get('/api/admin/enquiries?pageSize=100000&page=-5').set('Cookie', cookie).expect(200);
    assert.equal(res.body.pageSize, 100);
    assert.equal(res.body.page, 1);
  });
});

describe('CSRF', () => {
  it('rejects state-changing requests from foreign origins', async () => {
    const cookie = await login(app);
    await request(app).post('/api/enquiries').set('Origin', 'https://evil.example').send(validEnquiry()).expect(403);
    await request(app).patch('/api/admin/enquiries/1').set('Origin', 'https://evil.example').set('Cookie', cookie).send({ status: 'closed' }).expect(403);
    await request(app).delete('/api/admin/enquiries/1').set('Origin', 'https://evil.example').set('Cookie', cookie).expect(403);
  });

  it('rejects form-encoded posts (simple cross-site requests)', async () => {
    await request(app).post('/api/enquiries').type('form').send('name=x&email=a@b.co').expect(415);
    await request(app).post('/api/auth/login').set('Content-Type', 'text/plain').send('{"email":"a"}').expect(415);
  });
});
