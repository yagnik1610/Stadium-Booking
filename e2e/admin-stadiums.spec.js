const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI } = require('./helpers/auth');
const { generateE2EStadium } = require('./helpers/dataFactory');
const { request } = require('./helpers/api');

test.describe('Step 26: Admin Stadium Lifecycle, Validation & CRUD', () => {
  test.describe.configure({ mode: 'serial' });

  let stadiumData;
  let createdStadiumName;

  test.beforeAll(async () => {
    stadiumData = generateE2EStadium('crud');
    createdStadiumName = stadiumData.name;
  });

  test.beforeEach(async ({ page }) => {
    await loginAdminViaUI(page);
  });

  test('Form enforces validation errors for invalid stadium specifications', async ({ page }) => {
    const guard = attachConsoleGuard(page, {
      allowedStatusCodes: [400],
      allowedConsolePatterns: [/Failed to save stadium/i, /status of 400/i, /code 400/i, /Error saving stadium/i, /closingTime must be later/i]
    });

    await page.goto('/admin/stadiums/new');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Create New Stadium')).toBeVisible({ timeout: 10000 });

    // Fill valid base inputs
    await page.fill('input[placeholder*="National Sports Arena"]', `${createdStadiumName}_invalid`);
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill('1500');

    // Test closingTime <= openingTime (triggers backend schema validation)
    const openTimeInput = page.locator('input[type="time"]').first();
    const closeTimeInput = page.locator('input[type="time"]').nth(1);
    await openTimeInput.fill('20:00');
    await closeTimeInput.fill('08:00');

    await page.locator('button[type="submit"]').click();

    // Verify error is displayed on UI
    const errorBox = page.locator('div.bg-rose-50');
    await expect(errorBox).toBeVisible({ timeout: 10000 });
    const errText = await errorBox.innerText();
    expect(errText).toMatch(/closing|opening|time/i);

    // Verify negative price, playerCapacity > capacity, and minDuration > maxDuration rejected by backend
    const adminToken = await page.evaluate(() => localStorage.getItem('stadium_token'));

    // Negative price
    const negPriceRes = await request('/stadiums', {
      method: 'POST',
      token: adminToken,
      body: { ...stadiumData, pricePerHour: -100 }
    });
    expect(negPriceRes.status).toBe(400);

    // minDuration > maxDuration
    const minMaxRes = await request('/stadiums', {
      method: 'POST',
      token: adminToken,
      body: { ...stadiumData, minDuration: 4, maxDuration: 2 }
    });
    expect(minMaxRes.status).toBe(400);

    // playerCapacity > capacity
    const capRes = await request('/stadiums', {
      method: 'POST',
      token: adminToken,
      body: { ...stadiumData, capacity: 10, playerCapacity: 25 }
    });
    expect(capRes.status).toBe(400);

    guard.assertNoErrors();
  });

  test('Successfully create a valid stadium and verify in stadium listing and database', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/admin/stadiums/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill valid stadium details
    await page.fill('input[placeholder*="National Sports Arena"]', stadiumData.name);
    
    // Set valid operating hours
    const openTimeInput = page.locator('input[type="time"]').first();
    const closeTimeInput = page.locator('input[type="time"]').nth(1);
    await openTimeInput.fill(stadiumData.openingTime || '06:00');
    await closeTimeInput.fill(stadiumData.closingTime || '22:00');

    // Price
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill(String(stadiumData.pricePerHour || 1500));

    // Submit form
    await page.locator('button[type="submit"]').click();

    // After success, it redirects to /admin/stadiums
    await page.waitForURL((url) => url.pathname.includes('/admin/stadiums'), { timeout: 15000 });

    // Search for newly created stadium
    const searchInput = page.locator('input[placeholder*="Search by venue name"]').first();
    await searchInput.fill(stadiumData.name);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // Verify row exists
    await expect(page.locator(`text=${stadiumData.name}`).first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Edit existing stadium, update details, refresh and verify changes persist', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/admin/stadiums');
    await page.waitForLoadState('domcontentloaded');

    // Search for the stadium
    const searchInput = page.locator('input[placeholder*="Search by venue name"]').first();
    await searchInput.fill(stadiumData.name);
    await searchInput.press('Enter');
    await page.waitForTimeout(1000);

    // Click Edit button
    const editBtn = page.locator(`tr:has-text("${stadiumData.name}") button:has-text("Edit")`);
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    await page.waitForURL((url) => url.pathname.includes('/edit'), { timeout: 10000 });

    // Modify price
    const newPrice = 2200;
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill(String(newPrice));

    // Save changes
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => url.pathname === '/admin/stadiums', { timeout: 15000 });

    // Reload and verify price updated
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const searchAgain = page.locator('input[placeholder*="Search by venue name"]').first();
    await searchAgain.fill(stadiumData.name);
    await searchAgain.press('Enter');
    await page.waitForTimeout(1000);

    await expect(page.locator(`tr:has-text("${stadiumData.name}")`).locator('text=₹2,200').or(page.locator('text=₹2200'))).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });
});
