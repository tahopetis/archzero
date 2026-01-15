import { test, expect } from '@playwright/test';

test('debug - check what loads', async ({ page }) => {
  // Navigate to cards page
  await page.goto('http://localhost:5173/cards');
  
  // Wait for page to load
  await page.waitForLoadState('domcontentloaded');
  
  // Take a screenshot
  await page.screenshot({ path: '/tmp/debug-screenshot.png' });
  
  // Get page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Get page URL
  const url = page.url();
  console.log('Page URL:', url);
  
  // Check for any data-testid attributes
  const testIds = await page.locator('[data-testid]').count();
  console.log('Number of elements with data-testid:', testIds);
  
  // List all data-testids found
  const foundIds = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-testid]');
    return Array.from(elements).map(el => el.getAttribute('data-testid'));
  });
  console.log('Found testids:', foundIds);
  
  // Check for card-list specifically
  const cardListExists = await page.locator('[data-testid="card-list"]').count();
  console.log('card-list elements found:', cardListExists);
  
  // Get body HTML to see what's there
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Body HTML length:', bodyHTML.length);
});
