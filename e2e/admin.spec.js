import { test, expect, fillEnquiry } from './fixtures.js';
import { ADMIN } from '../playwright.config.js';

async function login(page, password = ADMIN.password) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(ADMIN.email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.describe('admin dashboard', () => {
  test('redirects anonymous visitors to the login page', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/login');
  });

  test('rejects a wrong password', async ({ page }) => {
    await login(page, 'definitely-wrong-password');
    await expect(page.locator('.alert[role=alert]')).toHaveText('Invalid credentials');
    await expect(page).toHaveURL('/admin/login');
  });

  test('full enquiry lifecycle: submit → view → update status → delete → logout', async ({ page }) => {
    await page.goto('/destinations/delhi-ncr');
    await fillEnquiry(page, { name: 'Lifecycle Couple', email: 'life@example.com', destination: 'delhi-ncr' });
    await page.getByRole('button', { name: 'Send Enquiry' }).click();
    await expect(page.getByRole('status')).toContainText('Thank you');

    await login(page);
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Wedding Enquiries' })).toBeVisible();
    const row = page.getByTestId('enquiry-row').filter({ hasText: 'Lifecycle Couple' });
    await expect(row).toContainText('life@example.com');
    await expect(row).toContainText('Delhi NCR');
    await page.screenshot({ path: 'docs/screenshots/admin.png', fullPage: true });

    await row.getByLabel('Status for Lifecycle Couple').selectOption('booked');
    await page.getByRole('button', { name: 'booked', exact: true }).click();
    await expect(page.getByTestId('enquiry-row').filter({ hasText: 'Lifecycle Couple' })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId('stat-booked').locator('b')).not.toHaveText('0');

    page.once('dialog', (d) => d.accept());
    await page.getByTestId('enquiry-row').filter({ hasText: 'Lifecycle Couple' }).getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByTestId('enquiry-row').filter({ hasText: 'Lifecycle Couple' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL('/admin/login');
    await page.goto('/admin');
    await expect(page).toHaveURL('/admin/login');
    const api = await page.request.get('/api/admin/enquiries');
    expect(api.status()).toBe(401);
  });
});
