import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  highlights TEXT NOT NULL DEFAULT '[]',
  best_season TEXT NOT NULL,
  distance TEXT NOT NULL,
  image TEXT,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  destination_id INTEGER NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  price_from INTEGER NOT NULL,
  description TEXT NOT NULL,
  features TEXT NOT NULL DEFAULT '[]',
  image TEXT
);
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_from INTEGER NOT NULL,
  guests TEXT NOT NULL,
  nights INTEGER NOT NULL,
  inclusions TEXT NOT NULL DEFAULT '[]',
  featured INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY,
  couple TEXT NOT NULL,
  destination_id INTEGER REFERENCES destinations(id) ON DELETE SET NULL,
  quote TEXT NOT NULL,
  wedding_month TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  destination TEXT NOT NULL,
  wedding_date TEXT,
  guests INTEGER,
  budget TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','booked','closed')),
  ip_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_enquiries_created ON enquiries(created_at DESC);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(file = config.dbPath) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  db.exec(SCHEMA);
  return db;
}

/** Parse JSON-encoded array columns on a row. */
export function parseJsonCols(row, cols) {
  if (!row) return row;
  const out = { ...row };
  for (const c of cols) out[c] = JSON.parse(out[c] || '[]');
  return out;
}
