const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI, loginViaUI, logoutViaUI } = require('./helpers/auth');
const { generateE2EUser } = require('./helpers/dataFactory');
const { registerUser } = require('./helpers/api');

test.describe('Step 23: Admin Authentication & RBAC Access Control', () => {
  let regularUser;

  test.beforeAll(async () => {
    regularUser = generateE2EUser('admin_rbac_user');
    const uRes = await registerUser(regularUser);
    expect(uRes.ok).toBe(true);
  });

  test('Admin login succeeds and grants access to /admin dashboard', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    const token = await loginAdminViaUI(page);
    expect(token).toBeTruthy();

    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('text=Admin Overview').or(page.locator('text=Dashboard'))).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Normal user navigating to /admin is blocked and redirected to /dashboard', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await loginViaUI(page, regularUser.email, regularUser.password);
    await expect(page).toHaveURL(/\/dashboard/);

    // Attempt direct navigation to /admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    // AdminRoute must block normal user and redirect back to /dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    guard.assertNoErrors();
  });

  test('Guest user navigating to /admin is redirected to /login', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/\/login/);

    guard.assertNoErrors();
  });
});
