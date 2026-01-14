import { test, expect } from '@playwright/test';

test('detailed debug', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');

  // Wait a bit for any JavaScript to execute
  await page.waitForTimeout(2000);

  // Get page content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text length:', bodyText?.length);
  console.log('Body text preview:', bodyText?.substring(0, 200));

  // Check for root div
  const rootExists = await page.locator('#root').count();
  console.log('Root div exists:', rootExists);

  // Check root content
  const rootHTML = await page.locator('#root').innerHTML();
  console.log('Root HTML length:', rootHTML.length);
  console.log('Root HTML preview:', rootHTML.substring(0, 300));

  // Check for any React-related errors in console
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  // Wait for network idle
  await page.waitForLoadState('networkidle');

  // Check again after network idle
  const rootHTML2 = await page.locator('#root').innerHTML();
  console.log('Root HTML after network idle:', rootHTML2.substring(0, 300));

  // Screenshot
  await page.screenshot({ path: 'detailed-debug.png' });
});
