const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI } = require('./helpers/auth');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums, getAdminToken, request } = require('./helpers/api');

test.describe('Step 28: Admin Booking Management Lifecycle & State Machine', () => {
  let user;
  let userToken;
  let adminToken;
  let targetStadium;

  test.beforeAll(async () => {
    user = generateE2EUser('admin_bk_test');
    const [uRes, aToken, sRes] = await Promise.all([
      registerUser(user),
      getAdminToken(),
      getStadiums()
    ]);

    expect(uRes.ok).toBe(true);
    userToken = uRes.data.token;
    adminToken = aToken;

    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums.find(s => s.isActive !== false) || stadiums[0];
  });

  const createPendingBooking = async (offsetDays, startTime) => {
    const bookingDate = getFutureDate(offsetDays);
    const res = await request('/bookings', {
      method: 'POST',
      token: userToken,
      body: {
        stadium: targetStadium._id,
        bookingDate,
        startTime,
        duration: 1,
        sport: typeof targetStadium.sports?.[0] === 'string' ? targetStadium.sports[0] : (targetStadium.sports?.[0]?.name || 'Cricket'),
        bookingFor: 'myself',
        bookingPerson: {
          name: user.name,
          email: user.email,
          mobile: user.mobile || user.phone || '9876543210'
        },
        safetyAcknowledged: true,
        termsAccepted: true,
        status: 'pending'
      }
    });
    if (!res.ok) {
      console.error('createPendingBooking failed:', res.status, JSON.stringify(res.data));
    }
    return res;
  };

  test('Admin can view, approve pending booking (pending -> confirmed) via UI', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // Create a pending booking
    const bookingDate = getFutureDate(2);
    const availRes = await request(`/stadiums/${targetStadium._id}/availability?date=${bookingDate}&duration=1`);
    const slots = availRes.data.slots || [];
    const openSlot = slots.find(s => s.available !== false && s.isAvailable !== false);
    const chosenSlot = openSlot ? openSlot.startTime : '07:00';

    const bRes = await createPendingBooking(2, chosenSlot);
    expect(bRes.ok).toBe(true);
    const booking = bRes.data.booking;

    // Login as Admin
    await loginAdminViaUI(page);
    await page.goto(`/admin/bookings/${booking._id}`);
    await page.waitForLoadState('domcontentloaded');

    // Verify initial status is pending
    await expect(page.locator('text=Pending').or(page.locator('text=pending')).first()).toBeVisible({ timeout: 10000 });

    // Click Approve button
    const approveBtn = page.locator('button:has-text("Approve")').first();
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    // Confirm in dialog
    const confirmApproveBtn = page.locator('button:has-text("Approve Now")');
    await expect(confirmApproveBtn).toBeVisible({ timeout: 5000 });
    await confirmApproveBtn.click();

    // Verify status transitions to confirmed
    await expect(page.locator('text=confirmed').or(page.locator('text=Confirmed')).first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Valid transitions (pending -> rejected, confirmed -> completed) and invalid transition rejection', async () => {
    // 1. Test pending -> rejected
    const bookingDate1 = getFutureDate(3);
    const availRes1 = await request(`/stadiums/${targetStadium._id}/availability?date=${bookingDate1}&duration=1`);
    const slots1 = availRes1.data.slots || [];
    const openSlot1 = slots1.find(s => s.available !== false && s.isAvailable !== false);
    const slotTime1 = openSlot1 ? openSlot1.startTime : '08:00';

    const bRes1 = await createPendingBooking(3, slotTime1);
    expect(bRes1.ok).toBe(true);
    const bk1Id = bRes1.data.booking._id;

    const rejRes = await request(`/bookings/${bk1Id}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'rejected', reason: 'Venue undergoing turf maintenance' }
    });
    expect(rejRes.ok).toBe(true);
    expect(rejRes.data.booking.status).toBe('rejected');

    // 2. Test confirmed -> completed
    const bookingDate2 = getFutureDate(4);
    const availRes2 = await request(`/stadiums/${targetStadium._id}/availability?date=${bookingDate2}&duration=1`);
    const slots2 = availRes2.data.slots || [];
    const openSlot2 = slots2.find(s => s.available !== false && s.isAvailable !== false);
    const slotTime2 = openSlot2 ? openSlot2.startTime : '09:00';

    const bRes2 = await createPendingBooking(4, slotTime2);
    expect(bRes2.ok).toBe(true);
    const bk2Id = bRes2.data.booking._id;

    // pending -> confirmed
    const confRes = await request(`/bookings/${bk2Id}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'confirmed' }
    });
    expect(confRes.ok).toBe(true);

    // confirmed -> completed
    const compRes = await request(`/bookings/${bk2Id}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'completed' }
    });
    expect(compRes.ok).toBe(true);
    expect(compRes.data.booking.status).toBe('completed');

    // 3. Test Invalid Transition: pending directly to completed without confirmation (Step 11 & Step 28)
    const bookingDate3 = getFutureDate(5);
    const availRes3 = await request(`/stadiums/${targetStadium._id}/availability?date=${bookingDate3}&duration=1`);
    const slots3 = availRes3.data.slots || [];
    const openSlot3 = slots3.find(s => s.available !== false && s.isAvailable !== false);
    const slotTime3 = openSlot3 ? openSlot3.startTime : '11:00';

    const bRes3 = await createPendingBooking(5, slotTime3);
    expect(bRes3.ok).toBe(true);
    const bk3Id = bRes3.data.booking._id;

    const invalidRes = await request(`/bookings/${bk3Id}/status`, {
      method: 'PUT',
      token: adminToken,
      body: { status: 'completed' }
    });

    // Backend must reject with 400
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.data.message).toMatch(/cannot complete a pending booking/i);
  });
});
