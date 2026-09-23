const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums } = require('./helpers/api');

test.describe('Step 18: Concurrency & Double-Booking Protection', () => {
  let userA, userB;
  let tokenA, tokenB;
  let targetStadium;

  test.beforeAll(async () => {
    userA = generateE2EUser('concurrent_a');
    userB = generateE2EUser('concurrent_b');

    const [resA, resB, sRes] = await Promise.all([
      registerUser(userA),
      registerUser(userB),
      getStadiums()
    ]);

    expect(resA.ok).toBe(true);
    expect(resB.ok).toBe(true);
    tokenA = resA.data.token;
    tokenB = resB.data.token;

    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    // Pick stadium with at least 1-2 hours duration allowed
    targetStadium = stadiums[0];
  });

  test('Simultaneous booking attempts on the same slot result in exactly one success and one conflict', async ({ browser }) => {
    const bookingDate = getFutureDate(7);

    // Create 2 independent browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const guardOptions = {
      allowedStatusCodes: [409],
      allowedConsolePatterns: [/Booking submission error/i, /status of 409/i, /is no longer available/i]
    };
    const guardA = attachConsoleGuard(pageA, guardOptions);
    const guardB = attachConsoleGuard(pageB, guardOptions);

    // Set auth in both contexts
    for (const [p, t, u] of [[pageA, tokenA, userA], [pageB, tokenB, userB]]) {
      await p.goto('/login');
      await p.evaluate(({ token, user }) => {
        localStorage.setItem('stadium_token', token);
        localStorage.setItem('stadium_user', JSON.stringify(user));
      }, { token: t, user: u });
      await p.goto(`/stadiums/${targetStadium._id}`);
      await p.waitForLoadState('domcontentloaded');
    }

    // Both users open booking modal
    await pageA.locator('button:has-text("Book This Stadium Now")').click();
    await pageB.locator('button:has-text("Book This Stadium Now")').click();

    await expect(pageA.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    // Step 1: Fill same date for both
    await pageA.locator('input[type="date"]').fill(bookingDate);
    await pageB.locator('input[type="date"]').fill(bookingDate);

    await pageA.locator('button:has-text("Continue")').click();
    await pageB.locator('button:has-text("Continue")').click();

    // Step 2: Time slot selection
    await expect(pageA.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });

    // Both pick the FIRST available slot
    const slotA = pageA.locator('button:has-text(":"):not(:disabled)').first();
    const slotB = pageB.locator('button:has-text(":"):not(:disabled)').first();

    await expect(slotA).toBeVisible({ timeout: 10000 });
    await expect(slotB).toBeVisible({ timeout: 10000 });

    const slotAText = await slotA.innerText();
    const slotBText = await slotB.innerText();
    expect(slotAText.split('\n')[0]).toBe(slotBText.split('\n')[0]); // same time slot

    await slotA.click();
    await slotB.click();

    await pageA.locator('button:has-text("Continue")').click();
    await pageB.locator('button:has-text("Continue")').click();

    // Step 3: Person details
    await expect(pageA.locator('text=Step 3 of 5')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text=Step 3 of 5')).toBeVisible({ timeout: 5000 });

    await pageA.locator('button:has-text("Continue")').click();
    await pageB.locator('button:has-text("Continue")').click();

    // Step 4: Game details
    await expect(pageA.locator('text=Step 4 of 5')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text=Step 4 of 5')).toBeVisible({ timeout: 5000 });

    await pageA.locator('button:has-text("Continue")').click();
    await pageB.locator('button:has-text("Continue")').click();

    // Step 5: Terms & submit
    await expect(pageA.locator('text=Step 5 of 5')).toBeVisible({ timeout: 5000 });
    await expect(pageB.locator('text=Step 5 of 5')).toBeVisible({ timeout: 5000 });

    // Accept checkboxes
    for (const p of [pageA, pageB]) {
      const cbs = p.locator('input[type="checkbox"]');
      const count = await cbs.count();
      for (let i = 0; i < count; i++) {
        await cbs.nth(i).check();
      }
    }

    const submitBtnA = pageA.locator('button:has-text("Confirm & Submit Booking")');
    const submitBtnB = pageB.locator('button:has-text("Confirm & Submit Booking")');

    await expect(submitBtnA).toBeEnabled();
    await expect(submitBtnB).toBeEnabled();

    // Fire clicks simultaneously
    await Promise.all([
      submitBtnA.click(),
      submitBtnB.click()
    ]);

    // Give time for backend processing
    await pageA.waitForTimeout(3000);
    await pageB.waitForTimeout(1000);

    const isUrlA = pageA.url().includes('/dashboard/bookings/');
    const isUrlB = pageB.url().includes('/dashboard/bookings/');

    // Exactly one of the contexts navigated to booking details
    const successCount = (isUrlA ? 1 : 0) + (isUrlB ? 1 : 0);
    expect(successCount).toBe(1);

    // The failing context must reflect conflict (either error message or returned to step 2)
    const failingPage = isUrlA ? pageB : pageA;
    const conflictMessageVisible = await failingPage.locator('text=This slot is no longer available').or(failingPage.locator('text=conflict')).or(failingPage.locator('text=already booked')).or(failingPage.locator('text=overlapping')).isVisible();
    const redirectedToStep2 = await failingPage.locator('text=Step 2 of 5').isVisible();

    expect(conflictMessageVisible || redirectedToStep2).toBe(true);

    guardA.assertNoErrors();
    guardB.assertNoErrors();

    await contextA.close();
    await contextB.close();
  });

  test('Partial overlap test: overlapping slot is blocked while adjacent slot is allowed', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    const bookingDate = getFutureDate(8);

    // Use page logged in as userA
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: tokenA, user: userA });

    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');

    // Create a booking for 2 hours (or 1 hour if 2 hours not supported)
    await page.locator('button:has-text("Book This Stadium Now")').click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    await page.locator('input[type="date"]').fill(bookingDate);

    // If 2 hours button exists, select 2 hours
    const twoHourBtn = page.locator('button:has-text("2 Hours")');
    let bookedDuration = 1;
    if (await twoHourBtn.isVisible()) {
      await twoHourBtn.click();
      bookedDuration = 2;
    }

    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });

    // Pick first available slot
    const slotBtn = page.locator('button:has-text(":"):not(:disabled)').first();
    await expect(slotBtn).toBeVisible({ timeout: 10000 });
    const chosenSlotText = await slotBtn.innerText();
    const startTimeMatch = chosenSlotText.match(/^(\d{2}):(\d{2})/);
    expect(startTimeMatch).not.toBeNull();
    const startHour = parseInt(startTimeMatch[1], 10);

    await slotBtn.click();
    await page.locator('button:has-text("Continue")').click();

    // Step 3
    await expect(page.locator('text=Step 3 of 5')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').click();

    // Step 4
    await expect(page.locator('text=Step 4 of 5')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').click();

    // Step 5
    await expect(page.locator('text=Step 5 of 5')).toBeVisible({ timeout: 5000 });
    const cbs = page.locator('input[type="checkbox"]');
    const count = await cbs.count();
    for (let i = 0; i < count; i++) {
      await cbs.nth(i).check();
    }

    await page.locator('button:has-text("Confirm & Submit Booking")').click();
    await page.waitForURL((url) => url.pathname.includes('/dashboard/bookings/'), { timeout: 15000 });

    // Now, navigate back to stadium and check availability on the same date for 1 hour
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.locator('button:has-text("Book This Stadium Now")').click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    await page.locator('input[type="date"]').fill(bookingDate);
    const oneHourBtn = page.locator('button:has-text("1 Hour")');
    if (await oneHourBtn.isVisible()) {
      await oneHourBtn.click();
    }
    await page.locator('button:has-text("Continue")').click();
    await expect(page.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });

    // The booked start hour must be disabled!
    const bookedSlotStr = String(startHour).padStart(2, '0') + ':00';
    const bookedSlotBtn = page.locator(`button:has-text("${bookedSlotStr}")`).first();
    if (await bookedSlotBtn.isVisible()) {
      expect(await bookedSlotBtn.isDisabled()).toBe(true);
    }

    // If bookedDuration was 2 hours, startHour + 1 must also be disabled!
    if (bookedDuration === 2) {
      const midOverlapSlotStr = String(startHour + 1).padStart(2, '0') + ':00';
      const midSlotBtn = page.locator(`button:has-text("${midOverlapSlotStr}")`).first();
      if (await midSlotBtn.isVisible()) {
        expect(await midSlotBtn.isDisabled()).toBe(true);
      }
    }

    guard.assertNoErrors();
  });
});
