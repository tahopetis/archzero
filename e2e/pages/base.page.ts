import { Page, Locator, expect } from '@playwright/test';
import { TestHelpers } from '../helpers/test-helpers';
import { TIMEOUTS } from '../helpers/constants';

/**
 * Base Page Class
 *
 * Provides common functionality for all page objects
 */
export class BasePage {
  readonly page: Page;
  readonly helpers: TestHelpers;

  // Common selectors
  readonly sidebar: Locator;
  readonly header: Locator;
  readonly mainContent: Locator;
  readonly loading: Locator;
  readonly notification: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    this.helpers = new TestHelpers(page);

    // Initialize common locators
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.header = page.locator('[data-testid="header"]');
    this.mainContent = page.locator('[data-testid="main-content"]');
    this.loading = page.locator('[data-testid="loading"]');
    this.notification = page.locator('[data-testid="notification"]');
    this.modal = page.locator('[data-testid="modal"]');
  }

  /**
   * Navigate to URL
   */
  async goto(path: string) {
    await this.page.goto(path);
    await this.waitForLoad();
  }

  /**
   * Wait for page to load
   */
  async waitForLoad() {
    // Use 'domcontentloaded' instead of 'networkidle' for better cross-browser compatibility
    // 'networkidle' times out on Firefox due to persistent connections
    await this.page.waitForLoadState('domcontentloaded');
    await this.helpers.waitForLoading();
  }

  /**
   * Wait for and verify URL
   */
  async verifyUrl(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Refresh page
   */
  async refresh() {
    await this.page.reload();
    await this.waitForLoad();
  }

  /**
   * Go back in browser history
   */
  async goBack() {
    await this.page.goBack();
    await this.waitForLoad();
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.helpers.screenshot(name);
  }

  /**
   * Click navigation menu item
   */
  async navigateTo(menuItem: string) {
    const navItem = this.sidebar.locator(`[data-testid="nav-${menuItem}"]`);
    await expect(navItem).toBeVisible();
    await navItem.click();
    await this.waitForLoad();
  }

  /**
   * Verify page title
   */
  async verifyTitle(title: string) {
    await expect(this.page).toHaveTitle(new RegExp(title));
  }

  /**
   * Verify heading text
   */
  async verifyHeading(text: string) {
    const heading = this.page.locator('h1, h2').filter({ hasText: text });
    await expect(heading).toBeVisible();
  }

  /**
   * Verify error message
   */
  async verifyError(message: string) {
    const error = this.page.locator('[data-testid="error"]');
    await expect(error).toBeVisible();
    await expect(error).toContainText(message);
  }

  /**
   * Verify success message
   */
  async verifySuccess(message: string) {
    await this.helpers.verifyToast(message, 'success');
  }

  /**
   * Close modal
   */
  async closeModal() {
    if (await this.modal.isVisible()) {
      await this.modal.locator('[data-testid="close-modal"]').click();
      await expect(this.modal).toBeHidden();
    }
  }

  /**
   * Wait for element to be visible
   */
  async waitForElement(selector: string) {
    await this.page.waitForSelector(selector, {
      state: 'visible',
      timeout: TIMEOUTS.LONG,
    });
  }

  /**
   * Check if element exists
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.locator(selector).count() > 0;
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).textContent() || '';
  }

  /**
   * Click button by data-testid
   */
  async clickButton(testId: string) {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * Fill input by data-testid
   */
  async fillInput(testId: string, value: string) {
    await this.page.fill(`[data-testid="${testId}"]`, value);
  }

  /**
   * Select dropdown option by data-testid
   */
  async selectOption(testId: string, value: string) {
    await this.page.selectOption(`[data-testid="${testId}"]`, value);
  }

  /**
   * Verify breadcrumb
   */
  async verifyBreadcrumb(...items: string[]) {
    const breadcrumb = this.page.locator('[data-testid="breadcrumb"]');
    await expect(breadcrumb).toBeVisible();

    for (const item of items) {
      await expect(breadcrumb).toContainText(item);
    }
  }

  /**
   * Search using global search
   */
  async search(query: string) {
    await this.page.keyboard.press('Meta+k');
    const searchInput = this.page.locator('[data-testid="global-search-input"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
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
    const userMenu = this.header.locator('[data-testid="user-menu"]');
    await userMenu.click();
    await this.page.click('[data-testid="logout-button"]');
    await this.waitForLoad();
  }
}
