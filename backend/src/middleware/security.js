import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export const COOKIE_NAME = 'vw_session';

const limiter = (opts) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.disableRateLimit,
    handler: (_req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' }),
    ...opts,
  });

// Factories, so each app instance (and each test) gets its own counters.
export const globalLimiter = () => limiter({ windowMs: 15 * 60 * 1000, limit: 300 });
export const enquiryLimiter = () => limiter({ windowMs: 60 * 60 * 1000, limit: 5 });
export const loginLimiter = () => [
  limiter({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true }),
  // Per-account limit too, so rotating IPs (or spoofed proxy headers) can't brute-force one admin.
  limiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `acct:${String(req.body?.email ?? '').trim().toLowerCase().slice(0, 254)}`,
  }),
];

/**
 * CSRF defence for cookie-authenticated, state-changing requests:
 *  - the session cookie is SameSite=Strict;
 *  - the body must be JSON, which cross-site HTML forms cannot send without a CORS preflight;
 *  - if the browser sends an Origin header it must be one we trust.
 */
export function csrfGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.get('origin');
  if (origin && !config.allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  if (req.method !== 'DELETE' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'], issuer: 'vanya-weddings' });
    req.admin = { id: Number(payload.sub), email: payload.email };
    next();
  } catch {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.status(401).json({ error: 'Session expired' });
  }
}

export function signSession(admin) {
  return jwt.sign({ email: admin.email }, config.jwtSecret, {
    algorithm: 'HS256',
    subject: String(admin.id),
    issuer: 'vanya-weddings',
    expiresIn: config.jwtTtlSeconds,
  });
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'strict',
  path: '/',
  maxAge: config.jwtTtlSeconds * 1000,
});
