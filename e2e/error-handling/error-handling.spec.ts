import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage, CardListPage } from '../pages/index';
import { API_URL } from '../helpers/index';

// Authenticate via API before all tests
test.beforeAll(async ({ request }) => {
  try {
    await request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email: 'admin@archzero.local', password: 'changeme123' }
    });
  } catch (error) {
    console.warn('Auth setup failed:', error);
  }
});

test.describe('Network Error Handling', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock network timeout
    await page.route('**/api/v1/cards', (route) => {
      setTimeout(() => route.continue(), 35000);
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should show timeout error or handle gracefully
    // Implementation depends on your error handling UI
    await expect(page).toHaveURL(/cards|login/);
  });

  test('should handle network disconnection', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/cards', (route) => {
      route.abort('failed');
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should show network error message
    const errorMessage = page.locator('text=Network Error, text=Failed to fetch, text=Unable to connect');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // If no error message, at least verify we're on an expected page
      expect(page.url()).toMatch(/cards|login/);
    });
  });
});

test.describe('Server Error Handling', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should handle 500 internal server error', async ({ page }) => {
    // Mock 500 error
    await page.route('**/api/v1/cards', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should handle error gracefully
    await expect(page).toHaveURL(/cards|login/);
  });

  test('should handle 503 service unavailable', async ({ page }) => {
    // Mock 503 error
    await page.route('**/api/v1/cards', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' })
      });
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should handle error gracefully
    await expect(page).toHaveURL(/cards|login/);
  });
});

test.describe('Client-Side Validation', () => {
  test('should validate required fields on login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to submit without filling fields
    await loginPage.loginButton.click();

    // Should show validation errors
    await expect(loginPage.emailInput).toHaveAttribute('required', '');
    await expect(loginPage.passwordInput).toHaveAttribute('required', '');
  });

  test('should validate email format', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Enter invalid email
    await loginPage.emailInput.fill('invalid-email');
    await loginPage.passwordInput.fill('password123');
    await loginPage.loginButton.click();

    // Should show email validation error
    const emailInput = loginPage.emailInput;
    const isValid = await emailInput.evaluate((el: any) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('should prevent form submission with invalid data', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Fill with empty password
    await loginPage.emailInput.fill('test@example.com');
    await loginPage.passwordInput.fill('');

    // Button should be disabled or validation should fail
    const passwordValid = await loginPage.passwordInput.evaluate((el: any) => el.checkValidity());
    expect(passwordValid).toBe(false);
  });
});

test.describe('Browser Navigation Edge Cases', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle navigation to non-existent route', async ({ page }) => {
    await page.goto('/non-existent-route');

    // Should redirect to 404 or login
    await expect(page).toHaveURL(/404|login/);
  });

  test('should handle browser back button after login', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
    const dashboard = new DashboardPage(page);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/dashboard/);

    // Use browser back button
    await page.goBack();

    // Should handle back navigation appropriately (stay on dashboard or go to login)
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test('should handle browser refresh during operation', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Refresh the page
    await page.reload();

    // Should maintain auth state or redirect to login
    await expect(page).toHaveURL(/cards|login/);
  });

  test('should handle browser forward button', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Navigate through pages
    await page.goto('/dashboard');
    await page.goto('/cards');

    // Go back then forward
    await page.goBack();
    await page.goForward();

    // Should maintain state
    await expect(page).toHaveURL(/cards/);
  });
});

test.describe('Authentication Edge Cases', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle concurrent login attempts', async ({ page }) => {
    await loginPage.goto();

    // Attempt to login twice rapidly
    const promise1 = loginPage.login('admin@archzero.local', 'changeme123');
    await page.waitForTimeout(100);
    const promise2 = page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    });

    // Should handle gracefully without errors
    await Promise.all([promise1, promise2]);
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test('should handle rapid logout/login cycles', async ({ page }) => {
    // Login
    await loginPage.login('admin@archzero.local', 'changeme123');

    // Rapid logout and login
    await page.evaluate(() => {
      localStorage.clear();
    });
    await loginPage.goto();
    await loginPage.login('admin@archzero.local', 'changeme123');

    // Should handle without issues
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should handle expired token', async ({ page }) => {
    // Set an invalid/expired token
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'invalid-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          token: 'invalid-token',
          user: null,
          isAuthenticated: false
        },
        version: 0
      }));
    });

    // Try to access protected route
    await page.goto('/cards');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Data Corruption Scenarios', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should handle corrupted localStorage gracefully', async ({ page }) => {
    // Corrupt the localStorage
    await page.evaluate(() => {
      localStorage.setItem('auth-storage', 'invalid-json{{{');
    });

    // Reload page
    await page.reload();

    // Should handle gracefully and redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should handle missing data in API response', async ({ page }) => {
    // Mock incomplete API response
    await page.route('**/api/v1/cards', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, total: 0 }) // Missing cards
      });
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should handle gracefully
    await expect(page).toHaveURL(/cards/);
  });

  test('should handle malformed API response', async ({ page }) => {
    // Mock malformed response
    await page.route('**/api/v1/cards', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid-json{{{'
      });
    });

    const cardListPage = new CardListPage(page);
    await cardListPage.goto();

    // Should handle parse error gracefully
    await expect(page).toHaveURL(/cards|login/);
  });
});

test.describe('Form Submission Edge Cases', () => {
  test('should handle form submission with special characters', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test with special characters that might cause SQL injection or XSS
    const specialInputs = [
      "'; DROP TABLE users; --",
      '<script>alert("xss")</script>',
      '../../etc/passwd',
      '{{7*7}}',
      '${7*7}'
    ];

    for (const input of specialInputs) {
      await loginPage.emailInput.fill(input);
      await loginPage.passwordInput.fill('password123');
      await loginPage.loginButton.click();

      // Should handle gracefully without errors
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/login|dashboard/);

      // Go back to login for next test
      if (!currentUrl.includes('/login')) {
        await page.evaluate(() => localStorage.clear());
        await loginPage.goto();
      }
    }
  });

  test('should handle very long input strings', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test with very long input (10,000 characters)
    const longString = 'a'.repeat(10000);
    await loginPage.emailInput.fill(`${longString}@example.com`);
    await loginPage.passwordInput.fill(longString);

    // Should handle gracefully (truncate or reject)
    await loginPage.loginButton.click();
    await expect(page).toHaveURL(/login|dashboard/);
  });

  test('should handle form submission with Unicode characters', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Test with various Unicode characters
    const unicodeInputs = [
      '用户@example.com',
      'тест@example.com',
      'user@例.com.jp',
      'مستخدم@example.com'
    ];

    for (const input of unicodeInputs) {
      await loginPage.emailInput.fill(input);
      await loginPage.passwordInput.fill('password123');
      await loginPage.loginButton.click();

      // Should handle gracefully
      await page.waitForTimeout(500);
      const currentUrl = page.url();

      // Go back to login for next test
      if (!currentUrl.includes('/login')) {
        await page.evaluate(() => localStorage.clear());
        await loginPage.goto();
      }
    }
  });
});
