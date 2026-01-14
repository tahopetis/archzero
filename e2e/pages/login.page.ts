import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { TEST_USERS, API_URL } from '../helpers/constants';

/**
 * Login Page Object
 *
 * Handles authentication-related interactions
 */
export class LoginPage extends BasePage {
  // Form inputs
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;

  // Error messages
  readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.waitForLoad();
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    await this.goto();

    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    // Click login and wait for navigation to complete
    // Use Promise.all to wait for both the click and the navigation
    await Promise.all([
      (async () => {
        try {
          await this.page.waitForURL(/\/dashboard|\/$/, { timeout: 10000 });
        } catch {
          // Fallback: wait for dashboard element if URL doesn't change
          await this.page.waitForSelector('[data-testid="sidebar"]', { timeout: 10000 });
        }
      })(),
      this.loginButton.click(),
    ]);

    // Additional wait for page to fully load on slower browsers
    await this.page.waitForLoadState('domcontentloaded').catch(() => {});
  }

  /**
   * Login via API (bypasses UI for faster tests)
   *
   * @deprecated This method is deprecated. Use Playwright's storageState instead.
   * Authentication is now handled globally via auth.setup.ts which creates
   * persistent auth state files that all tests automatically use.
   *
   * This method is kept for backwards compatibility or for tests that need
   * to authenticate as different users during the test.
   */
  async loginViaApi(email: string, password: string) {
    const response = await this.page.request.post(`${API_URL}/api/v1/auth/login`, {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const { token, user } = await response.json();

    // Set token in localStorage for API interceptor
    // First navigate to the app root to ensure we're on the right origin
    const currentUrl = this.page.url();
    if (!currentUrl.includes('localhost:5173')) {
      await this.page.goto('/');
      await this.page.waitForLoadState('domcontentloaded');
    }

    // Set both the zustand storage key and the API interceptor key
    await this.page.evaluate(
      ({ token, userStr }) => {
        try {
          // Set zustand persist storage
          const authState = {
            state: {
              token,
              user: JSON.parse(userStr),
              isAuthenticated: true,
            },
            version: 0,
          };
          localStorage.setItem('auth-storage', JSON.stringify(authState));

          // Also set for API interceptor
          localStorage.setItem('auth_token', token);
        } catch (e) {
          console.warn('Failed to set localStorage:', e);
        }
      },
      {
        token,
        userStr: JSON.stringify(user),
      }
    );

    // Reload page to apply auth state
    await this.page.reload();
    await this.waitForLoad();

    return { token, user };
  }

  /**
   * Login as test user (default: admin)
   *
   * @deprecated This method is deprecated. All tests are now authenticated
   * by default via storageState. Only use this if you need to switch users
   * during a test.
   */
  async loginAsTestUser(role: 'admin' | 'architect' | 'editor' | 'viewer' = 'admin') {
    const user = TEST_USERS[role.toUpperCase()];
    return await this.loginViaApi(user.email, user.password);
  }

  /**
   * Verify login error message
   */
  async verifyLoginError(message: string) {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
  }

  /**
   * Verify user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.helpers.getAuthToken();
    return token !== null;
  }

  /**
   * Logout
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.logoutButton.click();
    await this.waitForLoad();

    // Verify logout - should redirect to login page
    await expect(this.page).toHaveURL('/login');
  }

  /**
   * Verify login form is visible
   */
  async verifyLoginFormVisible() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Verify password field is masked
   */
  async verifyPasswordMasked() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }

  /**
   * Submit form with Enter key
   */
  async submitWithEnter() {
    await this.passwordInput.press('Enter');
    await this.waitForLoad();
  }

  /**
   * Test forgot password link
   */
  async clickForgotPassword() {
    await this.page.click('[data-testid="forgot-password-link"]');
    await this.waitForLoad();
    await expect(this.page).toHaveURL(/\/forgot-password/);
  }

  /**
   * Verify remember me checkbox
   */
  async toggleRememberMe() {
    const checkbox = this.page.locator('[data-testid="remember-me"]');
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  }
}
