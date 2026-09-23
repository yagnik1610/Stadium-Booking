/**
 * Authentication Helper for Playwright E2E Tests
 */

const { expect } = require('@playwright/test');

const DEFAULT_ADMIN_ID = process.env.E2E_ADMIN_LOGIN_ID || process.env.ADMIN_LOGIN_ID || process.env.ADMIN_EMAIL || 'Admin#1610';
const DEFAULT_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Yagnik#1610';

/**
 * Perform login via frontend UI.
 */
async function loginViaUI(page, identifier, password) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const idInput = page.locator('input[placeholder*="name@example.com"], input[placeholder*="Admin#1610"]').first();
  const passInput = page.locator('input[type="password"]').first();

  await idInput.fill(identifier);
  await passInput.fill(password);

  const submitBtn = page.locator('button[type="submit"]:has-text("Sign In")').first();
  await submitBtn.click();

  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

  // Verify token is saved in localStorage
  const token = await page.evaluate(() => localStorage.getItem('stadium_token'));
  expect(token).toBeTruthy();
  return token;
}

/**
 * Perform admin login via frontend UI.
 */
async function loginAdminViaUI(page, identifier = DEFAULT_ADMIN_ID, password = DEFAULT_ADMIN_PASSWORD) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');

  const idInput = page.locator('input[placeholder*="name@example.com"], input[placeholder*="Admin#1610"]').first();
  const passInput = page.locator('input[type="password"]').first();

  await idInput.fill(identifier);
  await passInput.fill(password);

  const submitBtn = page.locator('button[type="submit"]:has-text("Sign In")').first();
  await submitBtn.click();

  await page.waitForURL((url) => url.pathname.includes('/admin'), { timeout: 15000 });
  const token = await page.evaluate(() => localStorage.getItem('stadium_token'));
  expect(token).toBeTruthy();
  return token;
}

/**
 * Log out via UI.
 */
async function logoutViaUI(page) {
  // Check if there is an avatar/profile dropdown or a direct Sign Out button
  const userMenuBtn = page.locator('button[aria-label*="user"], button[aria-label*="profile"], button:has-text("Account"), button:has(.lucide-user)').first();
  if (await userMenuBtn.isVisible().catch(() => false)) {
    await userMenuBtn.click();
    await page.waitForTimeout(300);
  }

  const logoutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out"), a:has-text("Logout")').first();
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
  } else {
    // If not found in dropdown, trigger programmatic logout or click any logout element
    await page.evaluate(() => {
      localStorage.removeItem('stadium_token');
      localStorage.removeItem('stadium_user');
      window.location.href = '/login';
    });
  }

  await page.waitForURL((url) => url.pathname.includes('/login') || url.pathname === '/', { timeout: 10000 });
  const token = await page.evaluate(() => localStorage.getItem('stadium_token'));
  expect(token).toBeFalsy();
}

/**
 * Fast setup: Set authentication state directly into page context.
 */
async function setAuthContext(page, token, user) {
  await page.goto('/login');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('stadium_token', token);
    localStorage.setItem('stadium_user', JSON.stringify(user));
  }, { token, user });
}

module.exports = {
  DEFAULT_ADMIN_ID,
  DEFAULT_ADMIN_PASSWORD,
  loginViaUI,
  loginAdminViaUI,
  logoutViaUI,
  setAuthContext,
};
