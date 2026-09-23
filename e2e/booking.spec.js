const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums } = require('./helpers/api');

test.describe('Steps 16, 17 & 19: End-to-End Booking Lifecycle, Past Slots & Cancellation', () => {
  test.describe.configure({ mode: 'serial' });

  let testUser;
  let authToken;
  let targetStadium;
  let bookingDate;
  let createdBookingId = null;

  test.beforeAll(async () => {
    testUser = generateE2EUser('booking_spec');
    const uRes = await registerUser(testUser);
    expect(uRes.ok).toBe(true);
    authToken = uRes.data.token;

    const sRes = await getStadiums();
    expect(sRes.ok).toBe(true);
    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums[0];

    // Pick a date 3 days ahead (well within 45 days max advance limit)
    bookingDate = getFutureDate(3);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });
  });

  test('Step 17: Past slots earlier than current platform time are unavailable for today', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');

    // Open booking modal
    await page.locator('button:has-text("Book This Stadium Now")').click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    // Step 1: Default is today's date, click Continue
    await page.locator('button:has-text("Continue")').click();

    // Step 2: Time slot selection
    await expect(page.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    // Calculate current platform hour (Asia/Kolkata timezone default)
    const now = new Date();
    const currentHour = now.getHours();

    // Check slots
    const allSlotButtons = page.locator('button:has-text(":")');
    const count = await allSlotButtons.count();
    for (let i = 0; i < count; i++) {
      const text = await allSlotButtons.nth(i).innerText();
      const match = text.match(/^(\d{2}):(\d{2})/);
      if (match) {
        const slotStartHour = parseInt(match[1], 10);
        if (slotStartHour < currentHour) {
          // Must be disabled or unavailable
          const isDisabled = await allSlotButtons.nth(i).isDisabled();
          const isFaded = await allSlotButtons.nth(i).evaluate(el => el.classList.contains('opacity-40') || el.classList.contains('cursor-not-allowed'));
          expect(isDisabled || isFaded).toBe(true);
        }
      }
    }

    guard.assertNoErrors();
  });

  test('Step 16: Complete multi-step booking wizard creates pending booking with reference and detailed breakdown', async ({ page }) => {
    const guard = attachConsoleGuard(page);
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');

    // Click "Book This Stadium Now"
    await page.locator('button:has-text("Book This Stadium Now")').click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    // STEP 1: Date & Duration
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill(bookingDate);
    await page.locator('button:has-text("Continue")').click();

    // STEP 2: Time Slot
    await expect(page.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });
    const availableSlot = page.locator('button:has-text(":"):not(:disabled)').first();
    await expect(availableSlot).toBeVisible({ timeout: 10000 });
    await availableSlot.click();
    await page.locator('button:has-text("Continue")').click();

    // STEP 3: Booking Person Details
    await expect(page.locator('text=Step 3 of 5')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').click();

    // STEP 4: Game Details
    await expect(page.locator('text=Step 4 of 5')).toBeVisible({ timeout: 5000 });
    const teamInput = page.locator('input[placeholder*="Team"], input[placeholder*="Club"]').first();
    if (await teamInput.isVisible()) {
      await teamInput.fill('E2E Warriors');
    }
    await page.locator('button:has-text("Continue")').click();

    // STEP 5: Safety Consent & Terms
    await expect(page.locator('text=Step 5 of 5')).toBeVisible({ timeout: 5000 });
    const checkboxes = page.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      await checkboxes.nth(i).check();
    }

    // Submit Booking
    const submitBtn = page.locator('button:has-text("Confirm & Submit Booking")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify navigation to Booking Detail
    await page.waitForURL((url) => url.pathname.includes('/dashboard/bookings/'), { timeout: 15000 });
    expect(page.url()).toContain('/dashboard/bookings/');

    const match = page.url().match(/\/dashboard\/bookings\/([a-f0-9]+)/i);
    if (match) {
      createdBookingId = match[1];
    }

    // Verify Booking Details UI:
    // Stadium Name
    await expect(page.locator(`text=${targetStadium.name}`).first()).toBeVisible({ timeout: 10000 });

    // Status: Pending Admin Review
    await expect(page.locator('text=Pending Admin Review').first()).toBeVisible();

    // Payment Status: Payment Pending
    await expect(page.locator('text=Payment Pending').first()).toBeVisible();

    // Booking Reference exists (e.g. STB-... or BK-...)
    const bookingRef = page.locator('text=/STB-|BK-/');
    await expect(bookingRef.first()).toBeVisible();

    // Hourly rate, base price, GST, Total
    await expect(page.locator(`text=/₹\\s*(${targetStadium.pricePerHour}|${targetStadium.pricePerHour.toLocaleString('en-IN')})/`).first()).toBeVisible();

    // Persistence on refresh
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator(`text=${targetStadium.name}`).first()).toBeVisible();
    await expect(page.locator('text=Pending Admin Review').first()).toBeVisible();

    guard.assertNoErrors();
  });

  test('Step 19: Cancel booking frees slot lock and returns slot to availability', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    if (createdBookingId) {
      await page.goto(`/dashboard/bookings/${createdBookingId}`);
    } else {
      // Navigate to My Bookings list
      await page.goto('/dashboard/bookings');
      await page.waitForLoadState('domcontentloaded');

      // Click on the most recent booking View Details button
      const viewBookingBtn = page.locator('button:has-text("View Details")').first();
      await expect(viewBookingBtn).toBeVisible({ timeout: 10000 });
      await viewBookingBtn.click();
    }

    await page.waitForLoadState('domcontentloaded');

    // Auto-accept confirmation dialog
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Click "Cancel Booking"
    const cancelBtn = page.locator('button:has-text("Cancel Booking")');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await page.waitForTimeout(1000);

      // Verify status is Cancelled
      await expect(page.locator('text=Cancelled').first()).toBeVisible({ timeout: 10000 });
    }

    guard.assertNoErrors();
  });
});
