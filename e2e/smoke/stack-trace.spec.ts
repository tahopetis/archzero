import { test } from '@playwright/test';

test.describe('Stack Trace Debug', () => {
  test('should capture full error stack', async ({ page }) => {
    const errors: any[] = [];

    // Capture all console messages with stack traces
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          text: msg.text(),
          args: msg.args(),
        });
      }
    });

    // Also capture page errors
    page.on('pageerror', (error) => {
      console.log('Page Error:', error.message);
      console.log('Stack:', error.stack);
    });

    // Navigate to the app
    await page.goto('/');

    // Wait for errors
    await page.waitForTimeout(5000);

    // Log all errors with details
    console.log('\n=== All Console Errors ===');
    for (const err of errors) {
      console.log('Error:', err.text);
      for (const arg of err.args) {
        try {
          const json = await arg.jsonValue();
          console.log('  Arg:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('  Arg:', arg.toString());
        }
      }
    }

    // Try to evaluate what React thinks
    const reactVersion = await page.evaluate(() => {
      try {
        return (window as any).React?.version;
      } catch (e) {
        return null;
      }
    });
    console.log('\nReact version on window:', reactVersion);

    // Check if createRoot was called
    const rootElement = await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return 'No root element';

      // Check React internal properties
      const keys = Object.keys(root);
      const reactKeys = keys.filter(k => k.startsWith('__react') || k.startsWith('_react'));
      return {
        innerHTML: root.innerHTML.substring(0, 200),
        reactKeys: reactKeys,
        hasFiber: root.hasOwnProperty('_reactRootContainer'),
      };
    });
    console.log('\nRoot element details:', JSON.stringify(rootElement, null, 2));
  });
});
