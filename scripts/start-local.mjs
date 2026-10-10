#!/usr/bin/env node
// One-command local run: installs dependencies (first time), builds the site, starts API + website.
// Usage:  npm run local            (Windows, macOS, Linux)
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(`Node.js 22.13 or newer is required (you have ${process.versions.node}). Download it from https://nodejs.org`);
  process.exit(1);
}

function run(args, cwd) {
  const r = spawnSync(npm, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// Keep local secrets in backend/.env.local so the admin password survives restarts.
const envFile = path.join(root, 'backend', '.env.local');
if (!fs.existsSync(envFile)) {
  fs.writeFileSync(envFile, [
    'ADMIN_EMAIL=admin@example.com',
    `ADMIN_PASSWORD=${crypto.randomBytes(9).toString('base64url')}`,
    `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`,
    `IP_HASH_SALT=${crypto.randomBytes(16).toString('hex')}`,
    '',
  ].join('\n'), { mode: 0o600 });
}
const env = Object.fromEntries(
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);

for (const dir of ['backend', 'frontend']) {
  if (!fs.existsSync(path.join(root, dir, 'node_modules'))) {
    console.log(`\nInstalling ${dir} dependencies (first run only)...`);
    run(['install'], path.join(root, dir));
  }
}
console.log('\nBuilding the website...');
run(['run', 'build'], path.join(root, 'frontend'));

const children = [
  spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], {
    cwd: path.join(root, 'backend'), stdio: 'inherit', env: { ...process.env, ...env, PORT: '4000' },
  }),
  spawn(npm, ['run', 'start'], {
    cwd: path.join(root, 'frontend'), stdio: 'inherit', shell: process.platform === 'win32',
    env: { ...process.env, PORT: '3000', API_URL: 'http://127.0.0.1:4000' },
  }),
];

setTimeout(() => {
  console.log(`
  ──────────────────────────────────────────────
   Website:  http://localhost:3000
   Admin:    http://localhost:3000/admin
   Login:    ${env.ADMIN_EMAIL}
   Password: ${env.ADMIN_PASSWORD}
   (saved in backend/.env.local; press Ctrl+C to stop)
  ──────────────────────────────────────────────`);
}, 4000);

const stop = () => { for (const c of children) c.kill(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
for (const c of children) c.on('exit', (code) => { if (code) { console.error('A server stopped unexpectedly.'); stop(); } });
