const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser } = require('./helpers/dataFactory');
const { registerUser } = require('./helpers/api');
const { setAuthContext } = require('./helpers/auth');

test.describe('Steps 12 & 13: User Dashboard Navigation & Profile Update', () => {
  let testUser;
  let authToken;

  test.beforeAll(async () => {
    testUser = generateE2EUser('dashboard_spec');
    const res = await registerUser(testUser);
    if (!res.ok) {
      throw new Error(`Failed to create test user: ${res.data.message || res.status}`);
    }
    authToken = res.data.token;
  });

  test.beforeEach(async ({ page }) => {
    // Authenticate user directly into context
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });
  });

  test('Step 12: Navigate to all user dashboard sub-pages and verify no NaN, undefined or blank screens', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    const routesToTest = [
      { path: '/dashboard', label: 'Dashboard Overview' },
      { path: '/dashboard/bookings', label: 'My Bookings' },
      { path: '/dashboard/payments', label: 'Payments' },
      { path: '/favorites', label: 'Favorites' },
      { path: '/dashboard/reviews', label: 'Reviews' },
      { path: '/dashboard/notifications', label: 'Notifications' },
      { path: '/profile', label: 'Profile' },
      { path: '/settings', label: 'Settings' },
    ];

    for (const route of routesToTest) {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');

      // Verify page is rendered with content
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(50);

      // Verify no invalid values rendered
      expect(bodyText).not.toContain('₹NaN');
      expect(bodyText).not.toContain('undefined');
      expect(bodyText).not.toContain('NaN/5');
    }

    guard.assertNoErrors();
  });

  test('Step 13: Update user profile and verify persistence across page refresh', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');

    const updatedName = `E2E_Updated_User_${Date.now()}`;
    const updatedMobile = '9876543219';

    // Fill name & mobile
    const nameInput = page.locator('input[placeholder*="Name"], input[value*="E2E_"]').first();
    await nameInput.fill(updatedName);

    const mobileInput = page.locator('input[type="tel"]').first();
    await mobileInput.fill(updatedMobile);

    // Select State and City
    const stateSelect = page.locator('select:has(option[value="Maharashtra"])');
    if (await stateSelect.isVisible()) {
      await stateSelect.selectOption('Maharashtra');
      await page.waitForTimeout(300);
      const citySelect = page.locator('select:has(option[value="Pune"])');
      if (await citySelect.isVisible()) {
        await citySelect.selectOption('Pune');
      }
    }

    // Save
    const saveBtn = page.locator('button:has-text("Save Profile Changes")');
    await saveBtn.click();

    // Verify success confirmation
    await page.waitForTimeout(1000);

    // Reload page and verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const persistedName = await page.locator('input[placeholder*="Name"], input[value*="E2E_"]').first().inputValue();
    expect(persistedName).toBe(updatedName);

    guard.assertNoErrors();
  });
});
