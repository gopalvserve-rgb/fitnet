// Same-origin proxy to the Express API. Keeping /api/* on the site's own origin means the session cookie
// is first-party (SameSite=Strict), and it lets us allow-list exactly which headers cross in each direction.
const API_URL = () => process.env.API_URL || 'http://localhost:4000';
const MAX_BODY = 16 * 1024;
const REQ_HEADERS = ['content-type', 'cookie', 'origin', 'user-agent', 'accept'];
const RES_HEADERS = ['content-type', 'cache-control', 'ratelimit', 'ratelimit-policy', 'retry-after'];

async function readCapped(request) {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function forward(request, { params }) {
  const { path } = await params;
  const target = new URL(`/api/${path.map(encodeURIComponent).join('/')}`, API_URL());
  target.search = new URL(request.url).search;

  const headers = new Headers();
  for (const h of REQ_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  // Forward only the rightmost X-Forwarded-For hop: the address our own reverse proxy (nginx/Caddy) appended,
  // or the socket address Next.js fills in when there is none. Anything to its left is client-controlled.
  const xff = (request.headers.get('x-forwarded-for') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (xff.length) headers.set('x-forwarded-for', xff[xff.length - 1]);

  let body;
  if (!['GET', 'HEAD'].includes(request.method)) {
    body = await readCapped(request);
    if (body === null) return Response.json({ error: 'Payload too large' }, { status: 413 });
  }

  let upstream;
  try {
    upstream = await fetch(target, { method: request.method, headers, body, redirect: 'manual', cache: 'no-store' });
  } catch {
    return Response.json({ error: 'Service unavailable' }, { status: 502 });
  }

  const out = new Headers();
  for (const h of RES_HEADERS) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  for (const c of upstream.headers.getSetCookie()) out.append('set-cookie', c);
  return new Response(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: out });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
export const dynamic = 'force-dynamic';
