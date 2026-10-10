import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { csrfGuard, globalLimiter } from './middleware/security.js';
import { adminRoutes, authRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';

export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  // The API only ever serves JSON, so lock the CSP down completely.
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(globalLimiter());
  app.use(express.json({ limit: '10kb', strict: true }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', csrfGuard);
  app.use('/api', publicRoutes(db));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/admin', adminRoutes(db));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // Never leak stack traces or internals to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
    if (!config.isTest) console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
