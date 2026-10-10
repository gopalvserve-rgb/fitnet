import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET (min 32 chars) must be set in production');
}

export const config = {
  env,
  isProd,
  isTest: env === 'test',
  port: Number(process.env.PORT) || 4000,
  dbPath: process.env.DB_PATH || path.join(root, 'data', 'weddings.db'),
  // A random per-process secret in dev means sessions die on restart, which is fine locally.
  jwtSecret: process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex'),
  jwtTtlSeconds: 60 * 60 * 2,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  // Number of reverse proxies in front of the API (Next.js rewrite counts as one).
  trustProxy: Number(process.env.TRUST_PROXY ?? 1),
  ipHashSalt: process.env.IP_HASH_SALT || 'dev-salt',
  // Read lazily so tests can toggle it per file.
  get disableRateLimit() {
    return process.env.DISABLE_RATE_LIMIT === '1' && !isProd;
  },
};
