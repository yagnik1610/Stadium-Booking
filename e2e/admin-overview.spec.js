const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI } = require('./helpers/auth');

test.describe('Step 24: Admin Dashboard Overview & Real-Time KPIs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdminViaUI(page);
  });

  test('Admin dashboard KPIs, revenue metrics, charts and recent activity load cleanly with no NaN or undefined', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // Verify main heading
    await expect(page.locator('h1:has-text("Platform Overview")').or(page.locator('h1:has-text("Dashboard")'))).toBeVisible({ timeout: 10000 });

    // Verify KPI cards container is visible
    const bodyText = await page.innerText('body');

    // Fail if actual values show NaN, undefined or ₹NaN
    expect(bodyText).not.toContain('undefined');
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('₹NaN');

    // Verify KPI metrics are visible
    await expect(page.locator('text=Total Users').first()).toBeVisible();
    await expect(page.locator('text=Total Stadiums').first()).toBeVisible();
    await expect(page.locator('text=Total Bookings').first()).toBeVisible();
    await expect(page.locator('text=Total Revenue').first()).toBeVisible();

    // Verify Quick Actions bar exists
    await expect(page.locator('text=Quick Actions').first()).toBeVisible();

    // Verify Recent Bookings and Users sections exist
    await expect(page.locator('text=Recent Bookings').first()).toBeVisible();
    await expect(page.locator('text=Recent Users').first()).toBeVisible();

    // Test Refresh dashboard button
    const refreshBtn = page.locator('button:has-text("Refresh"), button[title="Refresh Dashboard"]').first();
    if (await refreshBtn.isVisible()) {
      await refreshBtn.click();
      await page.waitForTimeout(1000);
      expect(await page.innerText('body')).not.toContain('₹NaN');
    }

    guard.assertNoErrors();
  });
});
