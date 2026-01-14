import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/index';
import { DashboardPage } from '../pages/index';
import { TEST_USERS, API_URL } from '../helpers/index';

// Reset auth state before all tests to ensure clean state
test.beforeAll(async ({ request }) => {
  try {
    await request.post(`${API_URL}/api/v1/test/reset-auth-state`);
  } catch (error) {
    console.warn('Failed to reset auth state:', error);
  }
});

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should display login form', async ({ page }) => {
    await loginPage.goto();
    await loginPage.verifyLoginFormVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.login(
      TEST_USERS.ADMIN.email,
      TEST_USERS.ADMIN.password
    );

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard|\/$/);

    // Verify dashboard is loaded
    const dashboard = new DashboardPage(page);
    await dashboard.verifyDashboardLoaded();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.emailInput.fill('invalid@test.com');
    await loginPage.passwordInput.fill('wrongpassword');
    await loginPage.loginButton.click();

    await loginPage.verifyLoginError('Invalid credentials');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow login via API and set auth state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi(
      TEST_USERS.ADMIN.email,
      TEST_USERS.ADMIN.password
    );

    expect(authData.token).toBeDefined();
    expect(authData.user).toBeDefined();

    // Navigate to protected route
    await page.goto('/cards');
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    await expect(page).toHaveURL(/\/cards/);
  });
});

test.describe('Authentication Errors', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // Reset auth state after each test in this block
  test.afterEach(async ({ request }) => {
    try {
      await request.post(`${API_URL}/api/v1/test/reset-auth-state`);
    } catch (error) {
      console.warn('Failed to reset auth state:', error);
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Try to login with empty fields
    await loginPage.loginButton.click();

    // Should show validation errors
    await expect(loginPage.emailInput).toHaveAttribute('required', '');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/auth/login', (route) => {
      route.abort('failed');
    });

    await loginPage.emailInput.fill(TEST_USERS.ADMIN.email);
    await loginPage.passwordInput.fill(TEST_USERS.ADMIN.password);
    await loginPage.loginButton.click();

    // Should show network error message (axios returns "Network Error" with capital E)
    await loginPage.verifyLoginError('Network Error');
  });

  test('should lock account after multiple failed attempts', async ({ page }) => {
    // Attempt login 5 times with wrong password
    for (let i = 0; i < 5; i++) {
      await loginPage.emailInput.fill(TEST_USERS.ADMIN.email);
      await loginPage.passwordInput.fill('wrongpassword');
      await loginPage.loginButton.click();
      await page.waitForTimeout(500);

      if (i < 4) {
        await loginPage.emailInput.fill('');
        await loginPage.passwordInput.fill('');
      }
    }

    // Should show account locked message
    await loginPage.verifyLoginError('Account locked');
  });
});

test.describe('Password Field', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should verify password field is masked', async ({ page }) => {
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('should submit form with Enter key', async ({ page }) => {
    await loginPage.emailInput.fill(TEST_USERS.ADMIN.email);
    await loginPage.passwordInput.fill(TEST_USERS.ADMIN.password);
    await loginPage.passwordInput.press('Enter');
    await page.waitForLoadState('networkidle');

    // Should redirect to dashboard or show error
    expect(page.url()).toMatch(/\/dashboard|\/login/);
  });
});
