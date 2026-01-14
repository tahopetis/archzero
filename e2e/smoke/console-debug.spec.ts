import { test } from '@playwright/test';

test.describe('Console Debug', () => {
  test('should capture console errors', async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');

    // Wait a bit for any errors to appear
    await page.waitForTimeout(3000);

    // Log page info
    console.log('Page URL:', page.url());
    console.log('Page Title:', await page.title());

    // Get the root element
    const rootExists = await page.locator('#root').count();
    console.log('Root element exists:', rootExists);

    // Get the innerHTML of root
    const rootHTML = await page.locator('#root').innerHTML();
    console.log('Root HTML length:', rootHTML.length);
    console.log('Root HTML:', rootHTML.substring(0, 500));

    // Get body text
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Body text length:', bodyText.length);
    console.log('Body text:', bodyText.substring(0, 500));

    // Check for any React-specific elements
    const reactRoot = await page.locator('#root').getAttribute('data-reactroot');
    console.log('React root attribute:', reactRoot);

    // List all errors
    console.log('\n=== Console Errors ===');
    errors.forEach(err => console.log('ERROR:', err));

    console.log('\n=== Console Warnings ===');
    warnings.forEach(warn => console.log('WARNING:', warn));

    // Get all script tags
    const scripts = await page.locator('script').all();
    console.log('\n=== Script Tags ===');
    for (const script of scripts) {
      const src = await script.getAttribute('src');
      const type = await script.getAttribute('type');
      console.log(`Script: type=${type}, src=${src || 'inline'}`);
    }

    // Force a screenshot to see what's actually rendered
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved to debug-screenshot.png');
  });
});
