import 'server-only';

const API_URL = process.env.API_URL || 'http://localhost:4000';

/** Server-side fetch from the backend. Returns null on 404. */
export async function api(path) {
  const res = await fetch(`${API_URL}/api${path}`, { cache: 'no-store' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return res.json();
}
