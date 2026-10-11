import { test, expect } from './fixtures.js';

test.describe('public pages', () => {
  test('home page renders every section', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Destination Weddings in Jim Corbett & Delhi NCR/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Where forever begins');
    await expect(page.getByTestId('destination-card')).toHaveCount(2);
    await expect(page.getByTestId('venue-card')).toHaveCount(3);
    await expect(page.getByTestId('package-card')).toHaveCount(3);
    await expect(page.getByText('Most Loved')).toBeVisible();
    await expect(page.locator('.quote')).toHaveCount(3);
    await expect(page.getByRole('form', { name: 'Wedding enquiry form' })).toBeVisible();
    // Brand fonts are self-hosted and applied.
    const h1Font = await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(h1Font).toContain('Cormorant Garamond');
    const bodyFont = await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily);
    expect(bodyFont).toContain('Jost');
    await page.screenshot({ path: 'docs/screenshots/home.jpg', quality: 75, fullPage: true });
  });

  test('header navigation reaches every page', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    const expectations = [
      ['Jim Corbett', '/destinations/jim-corbett', 'Jim Corbett Weddings'],
      ['Delhi NCR', '/destinations/delhi-ncr', 'Delhi NCR Weddings'],
      ['Venues', '/venues', 'Wedding Venues'],
      ['Packages', '/packages', 'Wedding Packages'],
      ['About', '/about', 'Planners, dreamers, storytellers'],
      ['Contact', '/contact', 'Let’s plan something beautiful'],
    ];
    for (const [label, url, heading] of expectations) {
      await nav.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(url);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
      await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('Jim Corbett page shows its venues, facts and prefilled form', async ({ page }) => {
    await page.goto('/destinations/jim-corbett');
    await expect(page.getByText('October – March')).toBeVisible();
    await expect(page.getByText('Riverside Pheras')).toBeVisible();
    const cards = page.getByTestId('venue-card');
    await expect(cards).toHaveCount(3);
    for (const c of await cards.all()) await expect(c).toContainText('Jim Corbett');
    await expect(page.getByLabel('Destination *')).toHaveValue('jim-corbett');
    await page.screenshot({ path: 'docs/screenshots/jim-corbett.jpg', quality: 75, fullPage: true });
  });

  test('Delhi NCR page shows NCR venues', async ({ page }) => {
    await page.goto('/destinations/delhi-ncr');
    await expect(page.getByText('Royal Baraat')).toBeVisible();
    await expect(page.getByTestId('venue-card')).toHaveCount(3);
    await expect(page.getByText('Aravali Palace, Gurugram')).toBeVisible();
    await expect(page.getByLabel('Destination *')).toHaveValue('delhi-ncr');
    await page.screenshot({ path: 'docs/screenshots/delhi-ncr.jpg', quality: 75, fullPage: true });
  });

  test('venue filters and venue detail page', async ({ page }) => {
    await page.goto('/venues');
    await expect(page.getByTestId('venue-card')).toHaveCount(6);
    const filters = page.getByRole('navigation', { name: 'Filter venues' });
    await filters.getByRole('link', { name: 'Delhi NCR' }).click();
    await expect(page).toHaveURL('/venues?destination=delhi-ncr');
    await expect(page.getByTestId('venue-card')).toHaveCount(3);
    await filters.getByRole('link', { name: 'Jim Corbett' }).click();
    await expect(page.getByTestId('venue-card')).toHaveCount(3);
    await page.getByRole('link', { name: 'Sal Forest Lodge' }).click();
    await expect(page).toHaveURL('/venues/sal-forest-lodge');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sal Forest Lodge');
    await expect(page.getByText('30–150')).toBeVisible();
    await expect(page.getByText('₹12 Lakh').first()).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/venue.jpg', quality: 75, fullPage: true });
  });

  test('package CTA carries the package into the contact page', async ({ page }) => {
    await page.goto('/packages');
    await expect(page.getByTestId('package-card')).toHaveCount(3);
    await page.getByTestId('package-card').filter({ hasText: 'Royal Celebration' }).getByRole('link', { name: 'Enquire Now' }).click();
    await expect(page).toHaveURL(/\/contact\?package=royal-celebration/);
    await page.screenshot({ path: 'docs/screenshots/packages-contact.png', fullPage: true });
  });

  test('unknown pages show the branded 404', async ({ page }) => {
    for (const url of ['/destinations/goa', '/venues/nope', '/does-not-exist']) {
      const res = await page.goto(url);
      expect(res.status()).toBe(404);
      await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    }
  });

  test('footer links and floating call / WhatsApp buttons', async ({ page }) => {
    await page.goto('/');
    const wa = page.getByRole('link', { name: 'Chat with us on WhatsApp' });
    await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/917290092222/);
    await expect(wa).toHaveAttribute('rel', /noopener/);
    const call = page.getByRole('link', { name: /Call us at/ });
    await expect(call).toHaveAttribute('href', 'tel:+917290092222');
    await page.locator('footer').getByRole('link', { name: 'NCR Farmhouses & Palaces' }).click();
    await expect(page).toHaveURL('/venues?destination=delhi-ncr');
  });

  test('mobile menu opens and navigates @mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Toggle menu' });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Packages' }).click();
    await expect(page).toHaveURL('/packages');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, 'no horizontal scroll on mobile').toBe(false);
    await page.goto('/');
    await page.screenshot({ path: 'docs/screenshots/mobile-home.jpg', quality: 75, fullPage: true });
  });
});
