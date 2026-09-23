/**
 * Console and Network Error Guard for E2E Tests
 */

// Patterns that are known harmless / third-party noise
const HARMLESS_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Download the React DevTools/i,
  /\[HMR\]/i,
  /\[vite\]/i,
  /was preloaded using link preload but not used/i,
];

/**
 * Attaches console and network monitors to a Playwright page.
 * @param {import('@playwright/test').Page} page
 * @returns {{ getErrors: () => string[], assertNoErrors: () => void, allowNextHttpError: (status: number) => void }}
 */
function attachConsoleGuard(page, options = {}) {
  const errors = [];
  let allowedHttpStatus = options.allowedStatusCodes || null;
  const customPatterns = options.allowedConsolePatterns || [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isHarmless = HARMLESS_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
      if (isHarmless) return;

      const isCustomAllowed = customPatterns.some((pattern) => 
        typeof pattern === 'string' ? text.includes(pattern) : pattern.test(text)
      );
      if (isCustomAllowed) return;

      // If this is a browser console error for an explicitly allowed HTTP status, ignore it
      if (allowedHttpStatus) {
        const statuses = Array.isArray(allowedHttpStatus) ? allowedHttpStatus : [allowedHttpStatus];
        const isExpectedHttp = statuses.some(st => text.includes(`status of ${st}`) || text.includes(`code ${st}`));
        if (isExpectedHttp) return;
      }

      errors.push(`[Console Error]: ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`[Page Error]: ${err.message || err}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    // Allow intentionally expected error responses (e.g. 400 invalid credentials, 404 tests)
    if (allowedHttpStatus && (status === allowedHttpStatus || (Array.isArray(allowedHttpStatus) && allowedHttpStatus.includes(status)))) {
      return;
    }
    // Check unexpected HTTP failures from our own backend or app
    if (status >= 500) {
      errors.push(`[HTTP 5xx Error]: ${status} on ${url}`);
    } else if (status >= 400 && !url.includes('favicon.ico') && !url.includes('/api/auth/login') && !url.includes('/api/auth/register') && !url.includes('/api/e2e-does-not-exist')) {
      // Don't auto-flag 400/401/404 on endpoints where validation / auth rejection is standard unless in critical paths
      if (url.includes('/api/stadiums') || url.includes('/api/bookings') || url.includes('/api/admin/dashboard')) {
        errors.push(`[HTTP 4xx Error]: ${status} on ${url}`);
      }
    }
  });

  return {
    getErrors: () => [...errors],
    clearErrors: () => { errors.length = 0; },
    setAllowedHttpStatus: (status) => { allowedHttpStatus = status; },
    assertNoErrors: () => {
      if (errors.length > 0) {
        throw new Error(`Unexpected browser errors detected:\n${errors.join('\n')}`);
      }
    },
  };
}

module.exports = {
  attachConsoleGuard,
};
