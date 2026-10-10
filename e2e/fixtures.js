import { test as base, expect } from '@playwright/test';

// External photos are unreachable in CI sandboxes; abort them fast so the gradient fallback renders.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/images\.unsplash\.com|cdn\.gamma\.app/, (r) => r.abort());
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await use(page);
    expect(errors, 'no uncaught JS errors').toEqual([]);
  },
});
export { expect };

export async function fillEnquiry(page, overrides = {}) {
  const v = { name: 'Riya Kapoor', phone: '+91 99999 11111', email: 'riya@example.com', guests: '180', message: 'Riverside pheras please', ...overrides };
  await page.getByLabel('Your name *').fill(v.name);
  await page.getByLabel('Phone *').fill(v.phone);
  await page.getByLabel('Email *').fill(v.email);
  if (overrides.destination !== null) await page.getByLabel('Destination *').selectOption(overrides.destination || 'jim-corbett');
  await page.getByLabel('Wedding date').fill('2027-02-14');
  await page.getByLabel('Number of guests').fill(v.guests);
  await page.getByLabel('Approximate budget').selectOption('20l-50l');
  await page.getByLabel('Tell us about your dream wedding').fill(v.message);
}
