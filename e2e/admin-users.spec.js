const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI, loginViaUI } = require('./helpers/auth');
const { generateE2EUser } = require('./helpers/dataFactory');
const { registerUser } = require('./helpers/api');

test.describe('Step 25: Admin User Lifecycle, Inspection & Deactivation', () => {
  let targetUser;

  test.beforeAll(async () => {
    targetUser = generateE2EUser('admin_user_mgmt');
    const uRes = await registerUser(targetUser);
    expect(uRes.ok).toBe(true);
  });

  test('Admin can search user, view detail, deactivate and reactivate with verified login enforcement', async ({ browser, page }) => {
    const adminGuard = attachConsoleGuard(page);

    // 1. Admin logs in and opens Users table
    await loginAdminViaUI(page);
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');

    // 2. Search for the target test user
    const searchInput = page.locator('input[placeholder*="Search by user name"]').first();
    await searchInput.fill(targetUser.email);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // User row should appear
    const userRow = page.locator(`tr:has-text("${targetUser.email}")`);
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // 3. Inspect user detail
    await userRow.locator('button:has-text("View")').click();
    await page.waitForURL((url) => url.pathname.includes('/admin/users/'), { timeout: 10000 });

    // Verify detail page elements
    await expect(page.locator(`text=${targetUser.name}`).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text=${targetUser.email}`).first()).toBeVisible();

    // Navigate back to users list
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    const searchInputAgain = page.locator('input[placeholder*="Search by user name"]').first();
    await searchInputAgain.fill(targetUser.email);
    await searchInputAgain.press('Enter');
    await page.waitForTimeout(1000);

    // 4. Deactivate user account
    const deactivateBtn = page.locator(`tr:has-text("${targetUser.email}") button[title="Deactivate account"]`);
    await expect(deactivateBtn).toBeVisible({ timeout: 5000 });
    await deactivateBtn.click();

    // Confirm deactivation in modal
    const confirmDeactivate = page.locator('button:has-text("Deactivate Account")');
    await expect(confirmDeactivate).toBeVisible({ timeout: 5000 });
    await confirmDeactivate.click();
    await expect(confirmDeactivate).toBeHidden({ timeout: 10000 });

    // 5. In a separate browser context, test that deactivated user login is blocked
    const userContext = await browser.newContext();
    const userPage = await userContext.newPage();
    const userGuard = attachConsoleGuard(userPage, {
      allowedStatusCodes: [401, 403],
      allowedConsolePatterns: [/account is deactivated/i, /invalid credentials/i, /status of 401/i, /status of 403/i]
    });

    await userPage.goto('/login');
    await userPage.fill('input[placeholder*="name@example.com"], input[placeholder*="Admin#1610"]', targetUser.email);
    await userPage.fill('input[type="password"]', targetUser.password);
    await userPage.click('button[type="submit"]:has-text("Sign In")');

    // Login must fail and error notification/message appears
    await expect(userPage.locator('text=deactivated').or(userPage.locator('text=blocked')).or(userPage.locator('text=inactive')).or(userPage.locator('text=failed'))).toBeVisible({ timeout: 10000 });
    expect(userPage.url()).toContain('/login');

    await userContext.close();

    // 6. Admin reactivates user
    await page.goto('/admin/users');
    await page.waitForLoadState('domcontentloaded');
    const searchInputThird = page.locator('input[placeholder*="Search by user name"]').first();
    await searchInputThird.fill(targetUser.email);
    await searchInputThird.press('Enter');
    await page.waitForTimeout(1000);

    const activateBtn = page.locator(`tr:has-text("${targetUser.email}") button[title="Activate account"]`);
    await expect(activateBtn).toBeVisible({ timeout: 5000 });
    await activateBtn.click();

    const confirmActivate = page.locator('button:has-text("Activate Account")');
    await expect(confirmActivate).toBeVisible({ timeout: 5000 });
    await confirmActivate.click();
    await expect(confirmActivate).toBeHidden({ timeout: 10000 });

    // 7. Verify user can now successfully log in
    const reactivatedContext = await browser.newContext();
    const reactivatedPage = await reactivatedContext.newPage();
    const reactivatedGuard = attachConsoleGuard(reactivatedPage);

    await loginViaUI(reactivatedPage, targetUser.email, targetUser.password);
    await expect(reactivatedPage).toHaveURL(/\/dashboard/);

    reactivatedGuard.assertNoErrors();
    await reactivatedContext.close();

    adminGuard.assertNoErrors();
  });
});
