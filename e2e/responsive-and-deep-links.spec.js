const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginViaUI, loginAdminViaUI } = require('./helpers/auth');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums, getAdminToken, request } = require('./helpers/api');

test.describe('Steps 33, 34, 35: Responsive Layouts, Deep Links & 404 Handlers', () => {
  let targetStadium;
  let testUser;
  let userToken;

  test.beforeAll(async () => {
    testUser = generateE2EUser('resp_user');
    const uRes = await registerUser(testUser);
    expect(uRes.ok).toBe(true);
    userToken = uRes.data.token;

    const sRes = await getStadiums();
    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums[0];
  });

  const viewports = [
    { width: 375, height: 812, name: 'Mobile_375x812' },
    { width: 430, height: 932, name: 'MobileLarge_430x932' },
    { width: 768, height: 1024, name: 'Tablet_768x1024' },
    { width: 1024, height: 768, name: 'Landscape_1024x768' },
    { width: 1440, height: 900, name: 'Desktop_1440x900' }
  ];

  for (const vp of viewports) {
    test(`Responsive UI Check at ${vp.name} (${vp.width}x${vp.height}) - No unwanted horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const pagesToTest = [
        '/',
        '/stadiums',
        `/stadiums/${targetStadium._id}`,
        '/contact'
      ];

      for (const path of pagesToTest) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');

        // Verify page rendered
        await expect(page.locator('body')).toBeVisible();

        // Check horizontal overflow (scrollWidth should not exceed clientWidth + 2px tolerance for fractional subpixels)
        const isHorizontalOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
        });
        expect(isHorizontalOverflow, `Horizontal overflow detected on ${path} at ${vp.name}`).toBe(false);
      }
    });
  }

  test('Step 34A: Direct Deep-linking and Page Refresh on Public and User Protected Routes', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // 1. Direct deep-link to public stadium detail
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(`text=${targetStadium.name}`).first()).toBeVisible({ timeout: 10000 });

    // Refresh public detail
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(`text=${targetStadium.name}`).first()).toBeVisible({ timeout: 10000 });

    // 2. Direct deep-link to protected user dashboard
    await loginViaUI(page, testUser.email, testUser.password);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Dashboard Overview').first()).toBeVisible({ timeout: 10000 });

    // Refresh user dashboard
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Dashboard Overview').first()).toBeVisible({ timeout: 10000 });

    // 3. Direct deep-link to protected user bookings
    await page.goto('/dashboard/bookings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=My Bookings').first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Step 34B: Direct Deep-linking and Page Refresh on Admin Routes', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await loginAdminViaUI(page);
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Dashboard")').first()).toBeVisible({ timeout: 10000 });

    await page.goto('/admin/stadiums/new');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Create New Stadium').or(page.locator('text=Register Stadium')).first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Step 35: 404 Error handling for invalid frontend route and invalid API endpoint', async ({ page }) => {
    // 1. Invalid frontend route redirects gracefully or renders Not Found
    await page.goto('/this-page-does-not-exist-at-all');
    await page.waitForLoadState('domcontentloaded');

    // Should redirect to home or render 404 page without raw fatal white screen
    await expect(page.locator('body')).toBeVisible();

    // 2. Invalid API endpoint returns 404 without crashing backend server
    const apiRes = await request('/e2e-does-not-exist-at-all');
    expect(apiRes.status).toBe(404);

    // Verify backend is still completely healthy after 404 request
    const healthRes = await request('/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.data.status).toBe('healthy');
  });
});
