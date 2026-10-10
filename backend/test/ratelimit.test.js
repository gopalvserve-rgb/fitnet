process.env.NODE_ENV = 'test';
import assert from 'node:assert/strict';
import { it } from 'node:test';
import request from 'supertest';
import { makeApp, validEnquiry, ADMIN } from './helpers.js';

it('rate-limits enquiry spam (5/hour per IP)', async () => {
  const { app } = await makeApp();
  for (let i = 0; i < 5; i++) await request(app).post('/api/enquiries').send(validEnquiry()).expect(201);
  const res = await request(app).post('/api/enquiries').send(validEnquiry()).expect(429);
  assert.ok(res.headers['ratelimit-policy'] || res.headers['ratelimit']);
});

it('rate-limits login brute force (10 failures / 15 min)', async () => {
  const { app } = await makeApp();
  for (let i = 0; i < 10; i++) {
    await request(app).post('/api/auth/login').send({ ...ADMIN, password: `wrong-${i}-password` }).expect(401);
  }
  // Even the right password is refused once the limit is hit.
  await request(app).post('/api/auth/login').send(ADMIN).expect(429);
});

it('locks the account even when the attacker rotates IPs / spoofs X-Forwarded-For', async () => {
  const { app } = await makeApp();
  for (let i = 0; i < 10; i++) {
    await request(app).post('/api/auth/login').set('X-Forwarded-For', `10.0.0.${i}`)
      .send({ ...ADMIN, password: `wrong-${i}-password` }).expect(401);
  }
  await request(app).post('/api/auth/login').set('X-Forwarded-For', '10.0.0.200').send(ADMIN).expect(429);
  // A different account from a fresh IP is unaffected.
  await request(app).post('/api/auth/login').set('X-Forwarded-For', '10.0.0.201')
    .send({ email: 'other@test.local', password: 'whatever-password' }).expect(401);
});
