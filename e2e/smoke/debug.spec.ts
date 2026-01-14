import { test, expect } from '@playwright/test';

test('debug login page', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Take screenshot
  await page.screenshot({ path: 'debug-login-page.png' });

  // Get page content
  const content = await page.content();
  console.log('Page HTML contains data-testid:', content.includes('data-testid'));
  console.log('Page HTML contains login-email:', content.includes('login-email'));

  // Check for email input by id
  const emailInputById = page.locator('#email');
  console.log('Email input by id exists:', await emailInputById.count() > 0);

  // Check for any input elements
  const inputs = page.locator('input');
  console.log('Number of input elements:', await inputs.count());

  // Get page title
  const title = await page.title();
  console.log('Page title:', title);

  // Get URL
  console.log('Current URL:', page.url());
});
