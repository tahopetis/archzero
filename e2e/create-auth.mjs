import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login
  await page.goto('http://localhost:5173/login');

  // Fill in credentials
  await page.fill('[data-testid="login-email"]', 'admin@archzero.local');
  await page.fill('[data-testid="login-password"]', 'changeme123');
  await page.click('[data-testid="login-button"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Save storage state
  await context.storageState({ path: 'playwright/.auth/admin-auth-state.json' });

  console.log('Auth state saved successfully!');

  await browser.close();
})();
