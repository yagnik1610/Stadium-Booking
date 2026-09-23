const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { getStadiums, request } = require('./helpers/api');

test.describe('Step 8 & 35: Guest User Journey & Public Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any leftover local storage tokens to simulate a fresh guest
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('Home page renders header, footer, hero, and main navigation without console errors', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navbar checks
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();

    // Verify key guest nav links
    await expect(page.locator('a[href="/stadiums"]').first()).toBeVisible();
    await expect(page.locator('a[href="/about"]').first()).toBeVisible();
    await expect(page.locator('a[href="/contact"]').first()).toBeVisible();
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();

    // Hero title
    const heroHeading = page.locator('h1').first();
    await expect(heroHeading).toBeVisible();

    // Footer checks
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    guard.assertNoErrors();
  });

  test('Stadium listing page loads stadium cards with images and details', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/stadiums');
    await page.waitForLoadState('networkidle');

    // Check heading
    const pageHeading = page.locator('h1, h2').first();
    await expect(pageHeading).toBeVisible();

    // Verify cards are loaded
    const viewButtons = page.locator('a[href^="/stadiums/"]');
    await expect(viewButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await viewButtons.count();
    expect(count).toBeGreaterThan(0);

    // Verify card images render
    const cardImages = page.locator('img[alt]');
    await expect(cardImages.first()).toBeVisible();

    guard.assertNoErrors();
  });

  test('Stadium detail page renders and logged-out user booking CTA redirects to login with redirect param', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // Fetch an active stadium from API to ensure dynamic valid ID
    const apiRes = await getStadiums();
    expect(apiRes.ok).toBe(true);
    const stadiums = apiRes.data.stadiums || apiRes.data.data || apiRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    const targetStadium = stadiums[0];

    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('networkidle');

    // Verify stadium details rendered
    await expect(page.locator(`text=${targetStadium.name}`).first()).toBeVisible();
    await expect(page.locator(`text=${targetStadium.openingTime}`).first()).toBeVisible();

    // Click "Book This Stadium Now" CTA as guest
    const bookCta = page.locator('button:has-text("Book This Stadium Now")');
    await expect(bookCta).toBeVisible();
    await bookCta.click();

    // Should redirect to login with redirect param
    await page.waitForURL((url) => url.pathname.includes('/login') && url.search.includes('/stadiums/'), { timeout: 10000 });
    expect(page.url()).toContain('/login?redirect=');

    guard.assertNoErrors();
  });

  test('Contact page renders contact information and form', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page.locator('input[name="name"], input[placeholder*="Name"], input[type="text"]').first()).toBeVisible();

    guard.assertNoErrors();
  });

  test('Login and Register pages render with appropriate forms', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[placeholder*="name@example.com"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[placeholder="Marcus Vance"], input[type="text"]').first()).toBeVisible();

    guard.assertNoErrors();
  });

  test('Step 35: 404 behavior - Invalid frontend route redirects gracefully and invalid API returns 404', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // Invalid frontend route
    await page.goto('/some-completely-invalid-nonexistent-path-12345');
    await page.waitForLoadState('networkidle');
    // App redirects to home '/'
    expect(page.url()).toBe('http://localhost:5173/');

    // Invalid API route
    guard.setAllowedHttpStatus(404);
    const apiRes = await request('/e2e-does-not-exist');
    expect(apiRes.status).toBe(404);

    guard.assertNoErrors();
  });
});
