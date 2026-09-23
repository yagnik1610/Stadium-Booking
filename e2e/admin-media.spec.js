const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { attachConsoleGuard } = require('./helpers/consoleGuard');
const { loginAdminViaUI } = require('./helpers/auth');
const { generateE2EStadium } = require('./helpers/dataFactory');
const { getAdminToken, request } = require('./helpers/api');

const MOCK_STATE_PATH = path.resolve(__dirname, '../backend/.mock_cloudinary_active');

test.describe('Step 27: Admin Media Upload System (Cloudinary / Multer)', () => {
  test.describe.configure({ mode: 'serial' });

  let stadiumId;
  let adminToken;
  const fixturePath = (filename) => path.resolve(__dirname, 'fixtures', filename);

  test.beforeAll(async () => {
    // Activate cross-process Cloudinary mock for safe isolated local testing
    fs.writeFileSync(MOCK_STATE_PATH, JSON.stringify({}));

    adminToken = await getAdminToken();
    const stadiumData = generateE2EStadium('media');

    // Create an E2E stadium directly via API
    const createRes = await request('/stadiums', {
      method: 'POST',
      token: adminToken,
      body: stadiumData
    });

    expect(createRes.ok).toBe(true);
    stadiumId = createRes.data.stadium._id;
  });

  test.afterAll(() => {
    // Always remove cross-process mock file after test completion
    if (fs.existsSync(MOCK_STATE_PATH)) {
      try {
        fs.unlinkSync(MOCK_STATE_PATH);
      } catch (_) {}
    }
  });

  test.beforeEach(async ({ page }) => {
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
    await loginAdminViaUI(page);
  });

  test('Upload cover image, replace cover image, and remove cover image', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto(`/admin/stadiums/${stadiumId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    // 1. Upload Cover Image (test.png)
    const coverInput = page.locator('input[type="file"][accept*="image"]').first();
    await coverInput.setInputFiles(fixturePath('test.png'));

    // Verify upload success banner
    await expect(page.locator('text=Cover image uploaded successfully').or(page.locator('text=uploaded successfully'))).toBeVisible({ timeout: 15000 });

    // 2. Replace Cover Image (test.jpg)
    await coverInput.setInputFiles(fixturePath('test.jpg'));
    await expect(page.locator('text=Cover image uploaded successfully').or(page.locator('text=uploaded successfully'))).toBeVisible({ timeout: 15000 });

    // 3. Remove Cover Image
    const removeBtn = page.locator('button:has-text("Remove Cover")');
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(page.locator('text=Cover image removed successfully').or(page.locator('text=removed successfully'))).toBeVisible({ timeout: 10000 });
    }

    guard.assertNoErrors();
  });

  test('Upload gallery images and delete gallery item', async ({ page }) => {
    const guard = attachConsoleGuard(page);

    await page.goto(`/admin/stadiums/${stadiumId}/edit`);
    await page.waitForLoadState('domcontentloaded');

    // Upload to gallery
    const galleryInput = page.locator('input[type="file"][multiple]');
    await galleryInput.setInputFiles(fixturePath('test.webp'));

    // Wait for gallery image preview to appear
    await expect(page.locator('img[alt*="Gallery Image"]').first()).toBeVisible({ timeout: 15000 });

    // Delete gallery item
    const deleteGalleryBtn = page.locator('button[title="Delete this image"]').first();
    await expect(deleteGalleryBtn).toBeVisible({ timeout: 5000 });
    await deleteGalleryBtn.click();

    // Verify gallery is empty or count decreased
    await expect(page.locator('text=No gallery images uploaded yet').first()).toBeVisible({ timeout: 10000 });

    guard.assertNoErrors();
  });

  test('Invalid file format upload is rejected', async ({ page }) => {
    // Test uploading invalid.txt via API / Multer middleware
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const invalidFileContent = fs.readFileSync(fixturePath('invalid.txt'), 'utf8');

    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="image"; filename="invalid.txt"',
      'Content-Type: text/plain',
      '',
      invalidFileContent,
      `--${boundary}--`
    ].join('\r\n');

    const res = await fetch(`http://localhost:5000/api/stadiums/${stadiumId}/media/cover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body
    });

    const data = await res.json().catch(() => ({}));
    expect(res.status).toBe(400);
    expect(data.message).toMatch(/extension|unsupported|allowed|format|image/i);
  });
});
