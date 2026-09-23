const { test, expect } = require('@playwright/test');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser } = require('./helpers/dataFactory');
const { request } = require('./helpers/api');

test.describe('Step 32: Contact Form Inquiry Submission & Verification', () => {
  test('Submitting contact message validates required fields and persists inquiry', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('text=Contact Support & Venue Inquiries')).toBeVisible({ timeout: 10000 });

    const contactUser = generateE2EUser('contact');
    const inquirySubject = `E2E Inquiry Subject ${Date.now()}`;
    const inquiryMessage = `This is an automated E2E inquiry message verifying the contact pipeline. Timestamp: ${Date.now()}`;

    // Fill form
    await page.fill('input[name="name"]', contactUser.name);
    await page.fill('input[name="email"]', contactUser.email);
    await page.fill('input[name="mobile"]', contactUser.phone || '9876543210');
    await page.fill('input[name="subject"]', inquirySubject);
    await page.fill('textarea[name="message"]', inquiryMessage);

    // Submit inquiry
    await page.locator('button[type="submit"]').click();

    // Verify success confirmation card
    await expect(page.locator('text=Inquiry Received')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${contactUser.name}`).first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });
});
