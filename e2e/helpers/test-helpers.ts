import { Page, expect } from '@playwright/test';

/**
 * Arc Zero Test Helpers
 *
 * Common utility functions for E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for API call to complete
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    return this.page.waitForResponse(
      (response) =>
        response.url().match(urlPattern) && response.status() === 200
    );
  }

  /**
   * Get current user from localStorage
   */
  async getCurrentUser() {
    return await this.page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
  }

  /**
   * Get auth token from localStorage
   */
  async getAuthToken() {
    return await this.page.evaluate(() => {
      return localStorage.getItem('access_token');
    });
  }

  /**
   * Set auth token in localStorage
   */
  async setAuthToken(token: string) {
    await this.page.evaluate((t) => {
      localStorage.setItem('access_token', t);
    }, token);
  }

  /**
   * Clear auth state
   */
  async clearAuth() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Take screenshot with name
   */
  async screenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for loading spinner to disappear
   */
  async waitForLoading() {
    try {
      await this.page.waitForSelector('[data-testid="loading"]', {
        state: 'hidden',
        timeout: 5000,
      });
    } catch {
      // Loading spinner might not exist, that's ok
    }
  }

  /**
   * Fill form with data
   */
  async fillForm(selectors: Record<string, string>) {
    for (const [selector, value] of Object.entries(selectors)) {
      await this.page.fill(selector, value);
    }
  }

  /**
   * Select dropdown option
   */
  async selectOption(selector: string, option: string) {
    await this.page.selectOption(selector, option);
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  /**
   * Wait for notification/toast
   */
  async waitForNotification(message?: string) {
    const notification = this.page.locator('[data-testid="notification"]');
    await expect(notification).toBeVisible();

    if (message) {
      await expect(notification).toContainText(message);
    }

    return notification;
  }

  /**
   * Get table data
   */
  async getTableData(tableSelector: string) {
    const rows = await this.page.locator(`${tableSelector} tbody tr`).all();
    const data: string[][] = [];

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      data.push(cells);
    }

    return data;
  }

  /**
   * Navigate to card detail page
   */
  async navigateToCard(cardId: string) {
    await this.page.goto(`/cards/${cardId}`);
    await this.waitForLoading();
  }

  /**
   * Search using global search (Cmd+K)
   */
  async globalSearch(query: string) {
    await this.page.keyboard.press('Meta+k');
    await this.page.fill('[data-testid="global-search-input"]', query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  /**
   * Login using API (bypasses UI for faster tests)
   */
  async loginViaApi(email: string, password: string) {
    const response = await this.page.request.post('/api/v1/auth/login', {
      data: { email, password },
    });

    const { access_token, user } = await response.json();

    await this.setAuthToken(access_token);

    return { token: access_token, user };
  }

  /**
   * Wait for and close modal
   */
  async closeModal() {
    const modal = this.page.locator('[data-testid="modal"]');
    await expect(modal).toBeVisible();
    await modal.locator('[data-testid="close-modal"]').click();
    await expect(modal).toBeHidden();
  }

  /**
   * Get badge count
   */
  async getBadgeCount(selector: string) {
    const badge = this.page.locator(selector);
    const text = await badge.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  /**
   * Verify toast notification
   */
  async verifyToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
    const toast = this.page.locator(`[data-testid="toast-${type}"]`);
    await expect(toast).toBeVisible();
    await expect(toast).toContainText(message);
  }

  /**
   * Check if element has text
   */
  async hasText(selector: string, text: string) {
    const element = this.page.locator(selector);
    await expect(element).toContainText(text);
  }

  /**
   * Click button by text
   */
  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  /**
   * Verify current URL
   */
  async verifyUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }
}
