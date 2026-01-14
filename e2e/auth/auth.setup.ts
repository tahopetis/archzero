import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/admin-auth-state.json';

setup('authenticate as admin user', async ({ page }) => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@archzero.local';
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || 'changeme123';

  console.log('🔐 Setting up admin authentication state...');

  // Navigate to login page
  await page.goto(baseURL + '/login');

  // Fill in login credentials using data-testid attributes
  await page.fill('[data-testid="login-email"]', testAdminEmail);
  await page.fill('[data-testid="login-password"]', testAdminPassword);

  // Click login button
  await page.click('[data-testid="login-button"]');

  // Wait for navigation to dashboard (successful login)
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Verify we're on the dashboard
  await expect(page).toHaveURL(/.*dashboard/);

  // Save authentication state to file
  await page.context().storageState({ path: authFile });

  console.log('✅ Admin authentication state saved to:', authFile);
});

setup('authenticate as architect user', async ({ page }) => {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const testArchitectEmail = process.env.TEST_ARCHITECT_EMAIL || 'architect@archzero.local';
  const testArchitectPassword = process.env.TEST_ARCHITECT_PASSWORD || 'test123456';

  console.log('🔐 Setting up architect authentication state...');

  // Navigate to login page
  await page.goto(baseURL + '/login');

  // Fill in login credentials
  await page.fill('[data-testid="login-email"]', testArchitectEmail);
  await page.fill('[data-testid="login-password"]', testArchitectPassword);

  // Click login button
  await page.click('[data-testid="login-button"]');

  // Wait for navigation to dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: 'playwright/.auth/architect-auth-state.json' });

  console.log('✅ Architect authentication state saved');
});
