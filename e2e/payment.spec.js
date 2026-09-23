const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Parse RAZORPAY_KEY_SECRET from backend/.env safely without external dependency
let envKeySecret = 'test_secret_for_e2e';
try {
  const envPath = path.resolve(__dirname, '../backend/.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/RAZORPAY_KEY_SECRET\s*=\s*(.*)/);
    if (match) {
      envKeySecret = match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
} catch (e) {
  // Fallback to default
}

const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser, getFutureDate } = require('./helpers/dataFactory');
const { registerUser, getStadiums } = require('./helpers/api');

test.describe('Steps 20 & 21: Razorpay Payment Integration & Official Tax Receipt', () => {
  let testUser;
  let authToken;
  let targetStadium;
  let bookingDate;

  test.beforeAll(async () => {
    testUser = generateE2EUser('payment_spec');
    const uRes = await registerUser(testUser);
    expect(uRes.ok).toBe(true);
    authToken = uRes.data.token;

    const sRes = await getStadiums();
    expect(sRes.ok).toBe(true);
    const stadiums = sRes.data.stadiums || sRes.data.data || sRes.data;
    expect(stadiums.length).toBeGreaterThan(0);
    targetStadium = stadiums[0];

    bookingDate = getFutureDate(10);
  });

  test('Step 20 & 21: Create order, simulate test payment verification, confirm booking and verify tax receipt', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // Auto-accept confirmation alerts (e.g. payment verified alert)
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Expose signature generator to the browser context using backend's test RAZORPAY_KEY_SECRET
    const keySecret = envKeySecret;
    await page.exposeFunction('generateRazorpayHmac', (orderId, paymentId) => {
      return crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    });

    // Inject mock Razorpay constructor onto window before any scripts run
    await page.addInitScript(() => {
      window.Razorpay = function (options) {
        this.options = options;
        this.open = async function () {
          const fakePaymentId = 'pay_e2e_' + Math.random().toString(36).substring(2, 10);
          const orderId = options.order_id;
          const signature = await window.generateRazorpayHmac(orderId, fakePaymentId);

          // Invoke handler directly as Razorpay SDK does upon successful authentication
          if (options.handler) {
            await options.handler({
              razorpay_order_id: orderId,
              razorpay_payment_id: fakePaymentId,
              razorpay_signature: signature
            });
          }
        };
      };
    });

    // Login user
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });

    // Navigate to stadium page and create booking
    await page.goto(`/stadiums/${targetStadium._id}`);
    await page.waitForLoadState('domcontentloaded');

    await page.locator('button:has-text("Book This Stadium Now")').click();
    await expect(page.locator('text=Step 1 of 5')).toBeVisible({ timeout: 5000 });

    await page.locator('input[type="date"]').fill(bookingDate);
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('text=Step 2 of 5')).toBeVisible({ timeout: 5000 });
    const slot = page.locator('button:has-text(":"):not(:disabled)').first();
    await expect(slot).toBeVisible({ timeout: 10000 });
    await slot.click();
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('text=Step 3 of 5')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('text=Step 4 of 5')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("Continue")').click();

    await expect(page.locator('text=Step 5 of 5')).toBeVisible({ timeout: 5000 });
    const cbs = page.locator('input[type="checkbox"]');
    const count = await cbs.count();
    for (let i = 0; i < count; i++) {
      await cbs.nth(i).check();
    }

    await page.locator('button:has-text("Confirm & Submit Booking")').click();
    await page.waitForURL((url) => url.pathname.includes('/dashboard/bookings/'), { timeout: 15000 });

    // We are on BookingDetail page. Initial status is Pending Admin Review & Payment Pending
    await expect(page.locator('text=Payment Pending').first()).toBeVisible({ timeout: 10000 });

    // Locate "Pay Now" button
    const payBtn = page.locator('button:has-text("Pay Now")').first();
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await expect(payBtn).toBeEnabled();

    // Trigger payment
    await payBtn.click();

    // The handler verifies payment on backend and opens ReceiptModal
    // STEP 21: Verify Receipt Modal UI
    await expect(page.locator('text=Official GST Tax Invoice & Receipt').first()).toBeVisible({ timeout: 15000 });

    // Verify receipt content has no undefined or NaN
    const receiptModal = page.locator('#printableReceipt');
    await expect(receiptModal).toBeVisible();

    const receiptText = await receiptModal.innerText();
    expect(receiptText).not.toContain('undefined');
    expect(receiptText).not.toContain('NaN');
    expect(receiptText).not.toContain('₹NaN');

    // Verify key fields in receipt
    expect(receiptText).toContain(targetStadium.name);
    expect(receiptText).toMatch(/STB-|BK-/);
    expect(receiptText).toMatch(/₹\s*[\d,]+/);

    // Close receipt modal
    const closeReceiptBtn = page.locator('button:has-text("X"), button:has-text("Close")').first();
    if (await closeReceiptBtn.isVisible()) {
      await closeReceiptBtn.click();
    }

    // Verify Booking page updated to Paid status
    await expect(page.locator('text=Paid').first()).toBeVisible({ timeout: 10000 });

    // Refresh page and verify persistence of Paid status
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Paid').first()).toBeVisible({ timeout: 10000 });

    // Open receipt again via "View Receipt" button
    const viewReceiptBtn = page.locator('button:has-text("View Receipt"), button:has-text("Receipt")').first();
    if (await viewReceiptBtn.isVisible()) {
      await viewReceiptBtn.click();
      await expect(page.locator('text=Official GST Tax Invoice & Receipt').first()).toBeVisible({ timeout: 5000 });
    }

    guard.assertNoErrors();
  });
});
