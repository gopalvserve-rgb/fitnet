import { test, expect, fillEnquiry } from './fixtures.js';
import { ADMIN } from '../playwright.config.js';

const XSS = `<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>`;

test.describe('security (browser-level)', () => {
  test('pages ship strict security headers and a per-request CSP nonce', async ({ page }) => {
    const res = await page.goto('/');
    const h = res.headers();
    expect(h['x-powered-by']).toBeUndefined();
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy']).toContain('camera=()');
    const csp = h['content-security-policy'];
    expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    const nonce = csp.match(/'nonce-([^']+)'/)[1];
    const scripts = await page.locator('script').evaluateAll((els) => els.map((s) => s.nonce));
    expect(scripts.length).toBeGreaterThan(0);
    for (const n of scripts) expect(n).toBe(nonce);
    const second = (await page.request.get('/')).headers()['content-security-policy'];
    expect(second.match(/'nonce-([^']+)'/)[1]).not.toBe(nonce);
  });

  test('CSP blocks injected inline scripts (simulated HTML-injection bug)', async ({ page }) => {
    // Pretend a bug let attacker HTML into the page: splice an inline script and a data: script into the
    // real server's <head> while keeping the real CSP header. The browser must refuse to run either.
    await page.route((url) => url.pathname === '/about', async (route) => {
      const res = await route.fetch();
      const html = (await res.text()).replace('</head>',
        '<script>window.__pwned=1</script><script src="data:text/javascript,window.__pwned2=1"></script></head>');
      await route.fulfill({ response: res, body: html });
    });
    const violations = [];
    page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => [window.__pwned, window.__pwned2])).toEqual([undefined, undefined]);
    expect(violations.length).toBeGreaterThan(0);
  });

  test('site cannot be framed (clickjacking)', async ({ page }) => {
    await page.goto('/');
    await page.setContent(`<iframe id="f" src="${page.url()}" width="800" height="600"></iframe>`);
    await page.waitForTimeout(1000);
    const frame = page.frame({ url: /localhost/ });
    const framedContent = frame ? await frame.locator('h1').count().catch(() => 0) : 0;
    expect(framedContent).toBe(0);
  });

  test('stored XSS via enquiry is rendered inert in the admin dashboard', async ({ page }) => {
    await page.goto('/contact');
    await fillEnquiry(page, { name: 'Mallory Tester', email: 'xss@example.com', message: XSS });
    await page.getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.getByRole('status')).toContainText('Thank you');

    let dialog = false;
    page.on('dialog', (d) => { dialog = true; d.dismiss(); });
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    const row = page.getByTestId('enquiry-row').filter({ hasText: 'Mallory Tester' });
    await expect(row.locator('.msg')).toHaveText(XSS); // shown as literal text
    expect(await row.locator('img, script').count()).toBe(0);
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();
    expect(dialog).toBe(false);
  });

  test('reflected XSS via query string is not executed or reflected as HTML', async ({ page }) => {
    const payload = encodeURIComponent('"><script>window.__rx=1</script>');
    await page.goto(`/contact?package=${payload}`);
    await page.goto(`/venues?destination=${payload}`);
    expect(await page.evaluate(() => window.__rx)).toBeUndefined();
    const html = await page.content();
    expect(html).not.toContain('<script>window.__rx');
    await expect(page.getByTestId('venue-card')).toHaveCount(6); // falls back to "All"
  });

  test('path traversal and injection in slugs return 404', async ({ page }) => {
    for (const p of ['/destinations/..%2F..%2Fetc%2Fpasswd', "/destinations/jim-corbett'%20OR%201=1--", '/venues/%3Cscript%3E']) {
      const res = await page.goto(p);
      expect(res.status(), p).toBe(404);
    }
  });

  test('session cookie is HttpOnly + SameSite=Strict and unreadable from JS', async ({ page, context }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/admin');
    const cookie = (await context.cookies()).find((c) => c.name === 'vw_session');
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe('Strict');
    expect(await page.evaluate(() => document.cookie)).not.toContain('vw_session');
  });

  test('cross-site requests (CSRF) are refused even with a valid session', async ({ page, context }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill(ADMIN.email);
    await page.getByLabel('Password').fill(ADMIN.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/admin');
    const cookies = (await context.cookies()).map((c) => `${c.name}=${c.value}`).join('; ');
    const forged = await page.request.patch('/api/admin/enquiries/1', {
      headers: { Origin: 'https://evil.example', Cookie: cookies, 'Content-Type': 'application/json' },
      data: { status: 'closed' },
    });
    expect(forged.status()).toBe(403);
    const formPost = await page.request.post('/api/enquiries', {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      data: 'name=x&email=a@b.co&phone=1234567&destination=delhi-ncr',
    });
    expect(formPost.status()).toBe(415);
  });

  test('admin API is unreachable without a session and leaks nothing', async ({ request }) => {
    for (const [m, url] of [['get', '/api/admin/enquiries'], ['delete', '/api/admin/enquiries/1'], ['get', '/api/auth/me']]) {
      const r = await request[m](url);
      expect(r.status()).toBe(401);
    }
    const bad = await request.post('/api/enquiries', { headers: { 'Content-Type': 'application/json' }, data: '{"oops":' });
    expect(bad.status()).toBe(400);
    expect(await bad.text()).not.toMatch(/at .*\.js|SyntaxError|stack/i);
    const forged = await request.get('/api/admin/enquiries', { headers: { Cookie: 'vw_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.' } });
    expect(forged.status()).toBe(401);
  });

  test('mass-assignment of status on public enquiry is rejected', async ({ request }) => {
    const r = await request.post('/api/enquiries', {
      data: { name: 'Mass Assign', email: 'm@example.com', phone: '9999999999', destination: 'delhi-ncr', status: 'booked' },
    });
    expect(r.status()).toBe(400);
  });
});

test('site proxy forwards only the last X-Forwarded-For hop (client-chosen entries are dropped)', async ({ request }) => {
  const { DatabaseSync } = await import('node:sqlite');
  const base = { name: 'Spoof Test', phone: '9999999999', destination: 'delhi-ncr' };
  const chains = ['7.7.7.7, 203.0.113.9', '1.2.3.4, 5.6.7.8, 203.0.113.9', '203.0.113.9', '198.51.100.1'];
  for (const [i, xff] of chains.entries()) {
    const r = await request.post('/api/enquiries', { headers: { 'X-Forwarded-For': xff }, data: { ...base, email: `spoof${i}-${Date.now()}@example.com` } });
    expect(r.status()).toBe(201);
  }
  const db = new DatabaseSync('e2e/.tmp/e2e.db', { readOnly: true });
  const hashes = db.prepare("SELECT ip_hash FROM enquiries WHERE name = 'Spoof Test' ORDER BY id").all().map((r) => r.ip_hash);
  db.close();
  expect(hashes[0]).toBe(hashes[2]);
  expect(hashes[1]).toBe(hashes[2]);
  expect(hashes[3]).not.toBe(hashes[2]);
});
