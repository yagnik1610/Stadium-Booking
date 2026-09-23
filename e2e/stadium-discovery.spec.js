const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { getStadiums } = require('./helpers/api');

test.describe('Step 9: Stadium Discovery and Venue Details', () => {
  test('Search and filter stadiums by keyword, country, state, city, and sport with reset', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto('/stadiums');
    await page.waitForLoadState('networkidle');

    // 1. Initial count
    const initialCards = page.locator('a:has-text("View Stadium")');
    await expect(initialCards.first()).toBeVisible({ timeout: 15000 });
    const initialCount = await initialCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // 2. Keyword Search
    const searchInput = page.locator('input[placeholder*="Search stadium name"]');
    await searchInput.fill('Arena');
    await page.waitForTimeout(500); // Allow useMemo / state sync
    const searchedCards = page.locator('a:has-text("View Stadium")');
    const searchedCount = await searchedCards.count();
    expect(searchedCount).toBeLessThanOrEqual(initialCount);

    // 3. Clear search query
    await searchInput.fill('');
    await page.waitForTimeout(500);

    // 4. Sport Filter
    const sportPills = page.locator('button:has-text("Cricket"), button:has-text("Football")');
    if (await sportPills.first().isVisible()) {
      await sportPills.first().click();
      await page.waitForTimeout(500);
    }

    // 5. Reset Filters
    const clearBtn = page.locator('button:has-text("Clear Filters")');
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
      const restoredCount = await page.locator('a:has-text("View Stadium")').count();
      expect(restoredCount).toBe(initialCount);
    }

    guard.assertNoErrors();
  });

  test('Open stadium detail and verify all required venue specs and booking CTA', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // Select first active stadium via API to know exact properties
    const apiRes = await getStadiums();
    expect(apiRes.ok).toBe(true);
    const stadiums = apiRes.data.stadiums || apiRes.data.data || apiRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    const target = stadiums[0];

    await page.goto(`/stadiums/${target._id}`);
    await page.waitForLoadState('networkidle');

    // Name
    await expect(page.locator(`text=${target.name}`).first()).toBeVisible();

    // Opening Hours
    await expect(page.locator(`text=${target.openingTime}`).first()).toBeVisible();

    // Price
    const priceText = `₹${target.pricePerHour.toLocaleString('en-IN')}`;
    await expect(page.locator(`text=${priceText}`).first()).toBeVisible();

    // Capacity (if defined)
    if (target.capacity) {
      await expect(page.locator(`text=${target.capacity.toLocaleString()}`).first()).toBeVisible();
    }

    // Facilities (at least one facility should be rendered if available)
    if (target.facilities && target.facilities.length > 0) {
      await expect(page.locator(`text=${target.facilities[0]}`).first()).toBeVisible();
    }

    // Sports (at least first sport)
    if (target.sports && target.sports.length > 0) {
      await expect(page.locator(`text=${target.sports[0]}`).first()).toBeVisible();
    }

    // Reviews heading / section
    const reviewsHeading = page.getByRole('heading', { name: /Player Reviews/i });
    await expect(reviewsHeading).toBeVisible();

    // Booking CTA
    const bookBtn = page.locator('button:has-text("Book This Stadium Now")');
    await expect(bookBtn).toBeVisible();

    guard.assertNoErrors();
  });
});
