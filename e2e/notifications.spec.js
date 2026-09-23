const { test, expect } = require('@playwright/test');
const path = require('path');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { generateE2EUser } = require('./helpers/dataFactory');
const { registerUser } = require('./helpers/api');

const mongoose = require(path.join(__dirname, '../backend/node_modules/mongoose'));
const Notification = require('../backend/models/Notification');

test.describe('Step 15: Notifications Management', () => {
  let testUser;
  let authToken;
  let userId;

  test.beforeAll(async () => {
    testUser = generateE2EUser('notif_spec');
    const uRes = await registerUser(testUser);
    expect(uRes.ok).toBe(true);
    authToken = uRes.data.token;
    userId = uRes.data.user._id;

    // Connect DB and seed 2 E2E test notifications for this user
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stadium_booking');
    }

    await Notification.create([
      {
        user: userId,
        type: 'system',
        title: 'E2E Notification 1: Slot Reminder',
        message: 'This is an automated E2E test notification for individual read action.',
        isRead: false,
      },
      {
        user: userId,
        type: 'system',
        title: 'E2E Notification 2: Schedule Update',
        message: 'This is an automated E2E test notification for bulk mark-read and deletion.',
        isRead: false,
      },
    ]);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('stadium_token', token);
      localStorage.setItem('stadium_user', JSON.stringify(user));
    }, { token: authToken, user: testUser });
  });

  test('Open notifications, mark single read, mark all read, delete, and verify unread count', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    // 1. Open notifications center
    await page.goto('/dashboard/notifications');
    await page.waitForLoadState('domcontentloaded');

    // Verify notifications appear
    await expect(page.locator('text=E2E Notification 1: Slot Reminder')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=E2E Notification 2: Schedule Update')).toBeVisible({ timeout: 10000 });

    // Verify unread count is 2
    const unreadTab = page.locator('button:has-text("Unread")');
    await expect(unreadTab).toContainText('2');

    // 2. Mark first notification as read
    const markReadBtn = page.locator('button[title="Mark as Read"]').first();
    await markReadBtn.click();
    await page.waitForTimeout(500);

    // Unread count should now be 1
    await expect(unreadTab).toContainText('1');

    // 3. Refresh and verify state persistence
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(unreadTab).toContainText('1');

    // 4. Mark all read
    const markAllBtn = page.locator('button:has-text("Mark all as read")');
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(500);
    }

    // Refresh and verify unread tab count disappears
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button:has-text("Unread") span.bg-red-500')).toHaveCount(0);

    // 5. Delete a notification
    const deleteBtn = page.locator('button[title="Delete Notification"]').first();
    await deleteBtn.click();
    await page.waitForTimeout(500);

    // Refresh and verify only 1 notification remains
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button[title="Delete Notification"]')).toHaveCount(1, { timeout: 10000 });

    guard.assertNoErrors();
  });
});
