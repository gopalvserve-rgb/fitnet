import { createApp } from './app.js';
import { config } from './config.js';
import { openDb } from './db.js';
import { seed } from './seed.js';

const db = openDb();
// Content tables are idempotently seeded; an admin is only created when credentials are provided.
await seed(db, { adminEmail: process.env.ADMIN_EMAIL, adminPassword: process.env.ADMIN_PASSWORD });

const server = createApp(db).listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (${config.env})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => server.close(() => { db.close(); process.exit(0); }));
}
