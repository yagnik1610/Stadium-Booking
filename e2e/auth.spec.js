const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser } = require('./helpers/dataFactory');
const { loginViaUI, logoutViaUI } = require('./helpers/auth');

test.describe('Steps 10, 11 & 36: User Registration, Authentication & Session Persistence', () => {
  test('Step 10: Registration validation rejects missing fields, mismatched passwords, and short passwords', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/register');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.waitForLoadState('domcontentloaded');

    const nameInput = page.locator('input[placeholder="Marcus Vance"], input[type="text"]').first();
    const emailInput = page.locator('input[placeholder="user@example.com"], input[type="email"]').first();
    const phoneInput = page.locator('input[placeholder*="Phone"], input[type="tel"], input[placeholder="9876543210"]').first();
    const passInput = page.locator('input[type="password"]').first();
    const confirmPassInput = page.locator('input[type="password"]').nth(1);
    const submitBtn = page.locator('button[type="submit"]:has-text("Create Account")').first();

    // 1. Missing name (browser HTML5 or React validation blocks submission)
    await submitBtn.click();
    expect(page.url()).toContain('/register');

    // 2. Fill basic details
    await nameInput.fill('E2E Validation User');
    await emailInput.fill('valid.e2e@example.com');
    await phoneInput.fill('9876543210');

    // Select State and City
    const stateSelect = page.locator('select:has(option[value="Maharashtra"])');
    await stateSelect.selectOption('Maharashtra');
    await page.waitForTimeout(300);
    const citySelect = page.locator('select:has(option[value="Mumbai"])');
    await citySelect.selectOption('Mumbai');

    // 3. Test short password (< 6 chars)
    await passInput.fill('123');
    await confirmPassInput.fill('123');
    await submitBtn.click();
    const shortPassError = page.locator('div:has-text("at least 6 characters")');
    await expect(shortPassError.first()).toBeVisible({ timeout: 5000 });

    // 4. Test mismatched passwords
    await passInput.fill('Password123');
    await confirmPassInput.fill('Password456');
    await submitBtn.click();
    const mismatchError = page.locator('div:has-text("Passwords do not match")');
    await expect(mismatchError.first()).toBeVisible({ timeout: 5000 });

    guard.assertNoErrors();
  });

  test('Step 10 & 11: Valid registration creates E2E user, navigates to login, and logs in successfully', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    const testUser = generateE2EUser('auth_spec');

    await page.goto('/register');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.waitForLoadState('domcontentloaded');

    // Fill form
    await page.locator('input[placeholder="Marcus Vance"], input[type="text"]').first().fill(testUser.name);
    await page.locator('input[placeholder="user@example.com"], input[type="email"]').first().fill(testUser.email);
    
    // Mobile number
    const phoneInput = page.locator('input[placeholder*="Phone"], input[type="tel"], input[placeholder="9876543210"]').first();
    await phoneInput.fill(testUser.phone);

    // Location
    const stateSelect = page.locator('select:has(option[value="Maharashtra"])');
    await stateSelect.selectOption('Maharashtra');
    await page.waitForTimeout(300);
    const citySelect = page.locator('select:has(option[value="Mumbai"])');
    await citySelect.selectOption('Mumbai');

    // Password fields
    await page.locator('input[type="password"]').first().fill(testUser.password);
    await page.locator('input[type="password"]').nth(1).fill(testUser.password);

    // Submit registration
    const submitBtn = page.locator('button[type="submit"]:has-text("Create Account")').first();
    await submitBtn.click();

    // Verify redirected to /login with registered status
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 15000 });
    expect(page.url()).toContain('/login');

    // Verify login with wrong password is appropriately rejected
    guard.setAllowedHttpStatus(401);
    const loginPassInput = page.locator('input[type="password"]').first();
    await loginPassInput.fill('CompletelyWrongPassword!123');
    const signInBtn = page.locator('button[type="submit"]:has-text("Sign In")').first();
    await signInBtn.click();
    const loginError = page.locator('div:has-text("Invalid"), div:has-text("Failed to sign in"), div:has-text("password")');
    await expect(loginError.first()).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300);

    // Clear intentional 401 rejection error before testing successful login
    guard.clearErrors();
    guard.setAllowedHttpStatus(null);

    // Verify login with correct password succeeds and navigates to user dashboard
    await loginPassInput.fill(testUser.password);
    await signInBtn.click();

    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });
    expect(page.url()).toContain('/dashboard');

    // Verify stadium_token in localStorage
    const token = await page.evaluate(() => localStorage.getItem('stadium_token'));
    expect(token).toBeTruthy();

    guard.assertNoErrors();
  });

  test('Step 11 & 36: Session persistence across refresh and logout token clearance', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    const testUser = generateE2EUser('session_spec');

    // Fast-register via API
    const { registerUser } = require('./helpers/api');
    const regRes = await registerUser(testUser);
    expect(regRes.ok).toBe(true);

    // Clear local storage and log in via UI
    await page.goto('/login');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await loginViaUI(page, testUser.email, testUser.password);
    await page.waitForURL((url) => url.pathname.includes('/dashboard'), { timeout: 15000 });

    // Step 36: Refresh and verify authentication persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/dashboard');
    const tokenAfterReload = await page.evaluate(() => localStorage.getItem('stadium_token'));
    expect(tokenAfterReload).toBeTruthy();

    // Direct navigation to protected route
    await page.goto('/dashboard/bookings');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/dashboard/bookings');

    // Step 11: Logout via UI and verify token cleared
    await logoutViaUI(page);
    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('stadium_token'));
    expect(tokenAfterLogout).toBeFalsy();

    // Verify protected access is now blocked after logout
    await page.goto('/dashboard');
    await page.waitForURL((url) => url.pathname.includes('/login'), { timeout: 10000 });
    expect(page.url()).toContain('/login');

    guard.assertNoErrors();
  });
});
