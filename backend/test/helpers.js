import request from 'supertest';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { seed } from '../src/seed.js';

export const ADMIN = { email: 'admin@test.local', password: 'correct-horse-battery' };
export const ORIGIN = 'http://localhost:3000';

export async function makeApp() {
  const db = openDb(':memory:');
  await seed(db, { adminEmail: ADMIN.email, adminPassword: ADMIN.password });
  return { db, app: createApp(db) };
}

export async function login(app) {
  const res = await request(app).post('/api/auth/login').set('Origin', ORIGIN).send(ADMIN);
  return res.headers['set-cookie'][0].split(';')[0];
}

export const validEnquiry = () => ({
  name: 'Priya Sharma',
  email: `priya+${Math.random().toString(36).slice(2)}@example.com`,
  phone: '+91 98765 43210',
  destination: 'jim-corbett',
  wedding_date: '2027-02-14',
  guests: 150,
  budget: '20l-50l',
  message: 'Looking for a riverside wedding.',
});
