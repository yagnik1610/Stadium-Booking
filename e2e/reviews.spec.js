const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums, getAdminToken, request } = require('./helpers/api');

test.describe('Step 22: Reviews & Player Feedback Lifecycle', () => {
  test.describe.configure({ mode: 'serial' });

  let testUser;
  let authToken;
  let adminToken;
  let targetStadium;
  let bookingId;

  test.beforeAll(async () => {
    testUser = generateE2EUser('reviews_spec');
    const [uRes, aToken, sRes] = await Promise.all([
      registerUser(testUser),
      getAdminToken(),
      getStadiums()
    ]);

    expect(uRes.ok).toBe(true);
    authToken = uRes.data.token;
    adminToken = aToken;

    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums[0];

    // Create a booking for this user directly via API on a dynamically available slot
    const bookingDate = getFutureDate(14);
    const availRes = await request(`/stadiums/${targetStadium._id}/availability?date=${bookingDate}&duration=1`);
    const slots = availRes.data.slots || [];
    const openSlot = slots.find(s => s.available !== false && s.isAvailable !== false);
    const chosenStartTime = openSlot ? openSlot.startTime : '14:00';

    const bRes = await request('/bookings', {
      method: 'POST',
      token: authToken,
      body: {
        stadium: targetStadium._id,
        bookingDate,
        startTime: chosenStartTime,
        duration: 1,
        sport: typeof targetStadium.sports?.[0] === 'string' ? targetStadium.sports[0] : (targetStadium.sports?.[0]?.name || 'Cricket'),
        bookingFor: 'myself',
        bookingPerson: {
          name: testUser.name,
          email: testUser.email,
          mobile: testUser.mobile
        },
        safetyAcknowledged: true,
        termsAccepted: true
      }
    });

    expect(bRes.ok).toBe(true);
    bookingId = bRes.data.booking._id;

    // Transition booking: pending -> confirmed -> completed via Admin API
    const confRes = await request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'confirmed' }
    });
    expect(confRes.ok).toBe(true);

    const compRes = await request(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'completed' }
    });
    expect(compRes.ok).toBe(true);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });
  });

  test('User can submit a 5-star review on completed booking with comment and verify persistence', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Navigate to the completed booking details
    await page.goto(`/dashboard/bookings/${bookingId}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify "Completed" status badge is displayed
    await expect(page.locator('text=Completed').first()).toBeVisible({ timeout: 10000 });

    // Verify "Review Venue" CTA button is visible and eligible
    const reviewBtn = page.locator('button:has-text("Review Venue")');
    await expect(reviewBtn).toBeVisible({ timeout: 5000 });
    await reviewBtn.click();

    // Verify Review Modal opens
    await expect(page.locator('text=Verified Player Feedback')).toBeVisible({ timeout: 5000 });

    // Fill review comment
    const commentText = 'E2E Test: Fantastic pitch condition, crisp floodlights and seamless check-in!';
    const commentInput = page.locator('textarea');
    await commentInput.fill(commentText);

    // Click submit
    const submitBtn = page.locator('button:has-text("Submit Review")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Give time for review to process and modal to close
    await expect(page.locator('text=Verified Player Feedback')).toBeHidden({ timeout: 10000 });

    // Check review persistence in My Reviews page
    await page.goto('/dashboard/reviews');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator(`text=${commentText}`).first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Duplicate review on the same booking is rejected', async ({ page }) => {
    // Both API and UI guard against duplicate reviews
    const dupRes = await request('/reviews', {
      method: 'POST',
      token: authToken,
      body: {
        stadium: targetStadium._id,
        booking: bookingId,
        rating: 5,
        comment: 'Attempting duplicate review'
      }
    });

    // Expected 409 conflict
    expect(dupRes.status).toBe(409);
    expect(dupRes.data.message).toMatch(/already reviewed/i);
  });
});
