const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser } = require('./helpers/dataFactory');
const { registerUser, getStadiums } = require('./helpers/api');

test.describe('Step 14: Favorites Lifecycle', () => {
  let testUser;
  let authToken;
  let targetStadium;

  test.beforeAll(async () => {
    // 1. Create unique E2E user
    testUser = generateE2EUser('fav_spec');
    const uRes = await registerUser(testUser);
    expect(uRes.ok).toBe(true);
    authToken = uRes.data.token;

    // 2. Fetch an active stadium
    const sRes = await getStadiums();
    expect(sRes.ok).toBe(true);
    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums[0];
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });
  });

  test('Add stadium to favorites, verify persistence across refresh, open Favorites page, and remove favorite', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // 1. Open stadium detail page
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');

    // 2. Click "Add to Favorites"
    const favBtn = page.locator('button:has-text("Add to Favorites"), button[aria-label*="favorite"]');
    await expect(favBtn.first()).toBeVisible({ timeout: 10000 });
    await favBtn.first().click();

    // Verify button updates to favorited state
    await page.waitForTimeout(1000);

    // 3. Refresh and verify favorite persists
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const favoritedIndicator = page.locator('button:has-text("Saved in Favorites")');
    await expect(favoritedIndicator.first()).toBeVisible({ timeout: 10000 });

    // 4. Open Favorites page
    await page.goto('/favorites');
    await page.waitForLoadState('domcontentloaded');

    // Verify favorited stadium card appears in list
    const stadiumCard = page.locator(`text=${targetStadium.name}`);
    await expect(stadiumCard.first()).toBeVisible({ timeout: 10000 });

    // 5. Remove favorite from Favorites page
    const removeBtn = page.locator('button[aria-label="Remove from favorites"], button[title="Remove from favorites"]').first();
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // 6. Refresh and verify stadium is removed
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Card should no longer be present or empty state shown
    const remainingCard = page.locator(`text=${targetStadium.name}`);
    await expect(remainingCard).toHaveCount(0);

    guard.assertNoErrors();
  });
});
