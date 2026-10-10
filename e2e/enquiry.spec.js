import { test, expect, fillEnquiry } from './fixtures.js';

test.describe('enquiry form', () => {
  test('submits a complete enquiry from the home page', async ({ page }) => {
    await page.goto('/');
    await fillEnquiry(page);
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().endsWith('/api/enquiries') && r.request().method() === 'POST'),
      page.getByRole('button', { name: 'Send Enquiry' }).click(),
    ]);
    expect(res.status()).toBe(201);
    await expect(page.getByRole('status')).toContainText('Thank you');
    await expect(page.getByLabel('Your name *')).toHaveValue('');
  });

  test('shows server-side validation errors per field', async ({ page }) => {
    await page.goto('/contact');
    await fillEnquiry(page, { email: 'not-an-email', phone: 'abc', name: 'R' });
    await page.getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.locator('.alert[role=alert]')).toContainText('check the highlighted fields');
    await expect(page.getByLabel('Email *')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Phone *')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Your name *')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#e-email')).toHaveText('Please enter a valid email');
  });

  test('requires a destination', async ({ page }) => {
    await page.goto('/contact');
    await fillEnquiry(page, { destination: null });
    await page.getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.getByLabel('Destination *')).toHaveAttribute('aria-invalid', 'true');
  });

  test('venue enquiry includes the venue name for the planner', async ({ page }) => {
    await page.goto('/venues/kosi-riverside-retreat');
    await expect(page.getByLabel('Destination *')).toHaveValue('jim-corbett');
    let body;
    page.on('request', (r) => { if (r.url().endsWith('/api/enquiries')) body = r.postDataJSON(); });
    await fillEnquiry(page, { email: 'venue@example.com' });
    await page.getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.getByRole('status')).toContainText('Thank you');
    expect(body.message).toContain('Interested in venue: Kosi Riverside Retreat');
    expect(body.website).toBeUndefined();
  });
});
