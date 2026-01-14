import { defineConfig, devices } from '@playwright/test';

/**
 * Arc Zero E2E Testing Configuration
 *
 * Environment variables:
 * - BASE_URL: Frontend URL (default: http://localhost:3000)
 * - API_URL: Backend API URL (default: http://localhost:8080)
 * - TEST_USER_EMAIL: Default test user email
 * - TEST_USER_PASSWORD: Default test user password
 * - CI: Set to 'true' in CI environment
 */

const baseURL = process.env.BASE_URL || 'http://localhost:5173';
const apiURL = process.env.API_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './',
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests sequentially to avoid database state conflicts */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit-results.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
    /* Collect trace when retrying the failed test. */
    trace: 'retain-on-failure',
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    /* Video on failure */
    video: 'retain-on-failure',
    /* Action timeout */
    actionTimeout: 10000,
    /* Navigation timeout */
    navigationTimeout: 30000,
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'X-Test-Environment': process.env.NODE_ENV || 'development',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'cd ../archzero-ui && npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },

  /* Global setup and teardown */
  // globalSetup: require.resolve('./global-setup'),
  // globalTeardown: require.resolve('./global-teardown'),
});
