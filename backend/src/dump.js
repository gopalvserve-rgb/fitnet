// Export the whole SQLite database as a portable SQL file (schema + data).
// Usage: npm run db:dump [-- path/to/output.sql]   (defaults to backend/data/weddings-dump.sql)
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const out = process.argv[2] || path.join(path.dirname(config.dbPath), 'weddings-dump.sql');
const db = new DatabaseSync(config.dbPath, { readOnly: true });
const quote = (v) => (v === null ? 'NULL' : typeof v === 'number' || typeof v === 'bigint' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

const lines = ['-- Vows7 SQLite dump', `-- Created ${new Date().toISOString()}`, 'PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;'];
const objects = db.prepare("SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type = 'index', rowid").all();
for (const o of objects) {
  lines.push(`${o.sql};`);
  if (o.type !== 'table') continue;
  for (const row of db.prepare(`SELECT * FROM "${o.name}"`).all()) {
    const cols = Object.keys(row);
    lines.push(`INSERT INTO "${o.name}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${cols.map((c) => quote(row[c])).join(',')});`);
  }
}
lines.push('COMMIT;', '');
fs.writeFileSync(out, lines.join('\n'), { mode: 0o600 });
console.log(`Database dumped to ${out}`);
