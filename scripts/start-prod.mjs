// Production entrypoint for single-container hosting: starts the API (internal only) and the website.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_PORT = '4000';

const api = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/server.js'], {
  cwd: path.join(root, 'backend'),
  stdio: 'inherit',
  env: { ...process.env, PORT: API_PORT },
});
const web = spawn(process.execPath, [path.join(root, 'frontend/node_modules/next/dist/bin/next'), 'start', '-H', '0.0.0.0', '-p', process.env.PORT || '3000'], {
  cwd: path.join(root, 'frontend'),
  stdio: 'inherit',
  env: { ...process.env, API_URL: `http://127.0.0.1:${API_PORT}` },
});

const stop = (code = 0) => { api.kill(); web.kill(); process.exit(code); };
for (const c of [api, web]) c.on('exit', (code) => stop(code ?? 1));
process.on('SIGTERM', () => stop(0));
process.on('SIGINT', () => stop(0));
