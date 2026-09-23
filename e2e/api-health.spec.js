const { test, expect } = require('@playwright/test');
const { checkHealth, checkReady } = require('./helpers/api');

test.describe('Step 6: Backend API Health and Readiness Check', () => {
  test('Health endpoint returns success, status healthy, and connected database', async () => {
    const res = await checkHealth();
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.status).toBe('healthy');
    expect(res.data.database).toBe('connected');
  });

  test('Ready endpoint returns HTTP 200 with readiness verification', async () => {
    const res = await checkReady();
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.status).toBe('ready');
    expect(res.data.database).toBe('connected');
  });
});
