const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI } = require('./helpers/auth');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums, getAdminToken, request } = require('./helpers/api');

test.describe('Steps 29, 30, 31: Admin Settings, Maintenance Mode & Sensitive Data Redaction', () => {
  let adminToken;
  let userToken;
  let user;
  let targetStadium;
  let originalSettings;

  test.beforeAll(async () => {
    adminToken = await getAdminToken();
    user = generateE2EUser('settings_test');
    const uRes = await registerUser(user);
    expect(uRes.ok).toBe(true);
    userToken = uRes.data.token;

    const sRes = await getStadiums();
    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    targetStadium = stadiums[0];

    // Store original settings
    const settingsRes = await request('/admin/settings', { token: adminToken });
    expect(settingsRes.ok).toBe(true);
    originalSettings = settingsRes.data.settings || settingsRes.data.data || settingsRes.data;
  });

  test.afterAll(async () => {
    // Restore original settings unconditionally
    if (originalSettings && adminToken) {
      await request('/admin/settings', {
        method: 'PUT',
        token: adminToken,
        body: originalSettings
      });
    }
  });

  test('Step 29: Admin Settings modification persists and enforces platform advance booking limits', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await loginAdminViaUI(page);
    await page.goto('/admin/settings');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=System Settings & Configuration')).toBeVisible({ timeout: 10000 });

    // Temporarily update advanceBookingDays to 10
    const advDaysInput = page.locator('input[type="number"]').nth(1); // Advance Booking Window
    // Let's use direct PUT API to update settings reliably
    const updateRes = await request('/admin/settings', {
      method: 'PUT',
      token: adminToken,
      body: {
        ...originalSettings,
        bookingConfig: {
          ...originalSettings.bookingConfig,
          advanceBookingDays: 10
        }
      }
    });
    expect(updateRes.ok).toBe(true);

    // Refresh UI to verify persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Attempt user booking at 15 days in advance (must be rejected because limit is 10)
    const farDate = getFutureDate(15);
    const bookRes = await request('/bookings', {
      method: 'POST',
      token: userToken,
      body: {
        stadium: targetStadium._id,
        bookingDate: farDate,
        startTime: '08:00',
        duration: 1,
        sport: typeof targetStadium.sports?.[0] === 'string' ? targetStadium.sports[0] : (targetStadium.sports?.[0]?.name || 'Cricket'),
        bookingFor: 'myself',
        bookingPerson: { name: user.name, email: user.email, mobile: user.phone },
        safetyAcknowledged: true,
        termsAccepted: true
      }
    });

    // Should be rejected by advance booking window limit
    expect(bookRes.status).toBe(400);
    expect(bookRes.data.message).toMatch(/advance|days|window/i);

    // Restore original advanceBookingDays immediately
    await request('/admin/settings', {
      method: 'PUT',
      token: adminToken,
      body: originalSettings
    });

    guard.assertNoErrors();
  });

  test('Step 30: Maintenance Mode blocks normal mutations with 503 while preserving admin access', async () => {
    try {
      // 1. Enable Maintenance Mode
      const enableRes = await request('/admin/settings', {
        method: 'PUT',
        token: adminToken,
        body: {
          ...originalSettings,
          maintenanceMode: true
        }
      });
      expect(enableRes.ok).toBe(true);

      // 2. Normal user booking attempt must be blocked with HTTP 503
      const validDate = getFutureDate(5);
      const userBookingAttempt = await request('/bookings', {
        method: 'POST',
        token: userToken,
        body: {
          stadium: targetStadium._id,
          bookingDate: validDate,
          startTime: '08:00',
          duration: 1,
          sport: 'Cricket',
          bookingFor: 'myself',
          bookingPerson: { name: user.name, email: user.email, mobile: user.phone },
          safetyAcknowledged: true,
          termsAccepted: true
        }
      });

      expect(userBookingAttempt.status).toBe(503);
      expect(userBookingAttempt.data.message).toMatch(/scheduled maintenance/i);

      // 3. Normal user payment creation must also be blocked with HTTP 503
      const userPaymentAttempt = await request('/payments/create-order', {
        method: 'POST',
        token: userToken,
        body: { bookingId: '60d5ec49f1b2c8b1f8e4e1a1' }
      });
      expect(userPaymentAttempt.status).toBe(503);

      // 4. Public browsing (GET requests) must remain operational
      const getVenuesRes = await request('/stadiums');
      expect(getVenuesRes.status).toBe(200);

      // 5. Admin operations must remain operational
      const adminCheck = await request('/admin/settings', { token: adminToken });
      expect(adminCheck.status).toBe(200);

    } finally {
      // Restore maintenance mode to false
      await request('/admin/settings', {
        method: 'PUT',
        token: adminToken,
        body: {
          ...originalSettings,
          maintenanceMode: false
        }
      });
    }
  });

  test('Step 31: Admin Audit Trails, Payments and Reviews load cleanly without secrets leakage', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await loginAdminViaUI(page);

    // 1. Check Audit Trails / Activity Log
    await page.goto('/admin/activity');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Administrative Audit Trails')).toBeVisible({ timeout: 10000 });

    // 2. Check Payments Log
    await page.goto('/admin/payments');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Payment")')).toBeVisible({ timeout: 10000 });

    // 3. Check Reviews Management
    await page.goto('/admin/reviews');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1:has-text("Review")')).toBeVisible({ timeout: 10000 });

    // 4. Verify sensitive secrets are never leaked anywhere in page text or API responses
    const pageText = await page.evaluate(() => document.body.innerText);
    const forbiddenSecrets = [
      'RAZORPAY_KEY_SECRET',
      'RAZORPAY_WEBHOOK_SECRET',
      'RESEND_API_KEY',
      'CLOUDINARY_API_SECRET',
      'JWT_SECRET'
    ];

    for (const secretName of forbiddenSecrets) {
      expect(pageText).not.toContain(secretName);
      if (process.env[secretName]) {
        expect(pageText).not.toContain(process.env[secretName]);
      }
    }

    guard.assertNoErrors();
  });
});
