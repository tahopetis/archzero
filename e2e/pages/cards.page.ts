import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Card List Page Object
 *
 * Handles card inventory list and filtering
 */
export class CardListPage extends BasePage {
  // List elements
  readonly cardList: Locator;
  readonly newCardButton: Locator;
  readonly searchInput: Locator;
  readonly filterType: Locator;
  readonly filterLifecycle: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    super(page);

    this.cardList = page.locator('[data-testid="card-list"]');
    this.newCardButton = page.locator('[data-testid="new-card-button"]');
    this.searchInput = page.locator('[data-testid="filter-search"]');
    this.filterType = page.locator('[data-testid="filter-type"]');
    this.filterLifecycle = page.locator('[data-testid="filter-lifecycle"]');
    this.pagination = page.locator('[data-testid="pagination"]');
  }

  /**
   * Navigate to cards page
   */
  async goto() {
    await super.goto('/cards');
  }

  /**
   * Verify cards list loaded
   */
  async verifyListLoaded() {
    await expect(this.cardList).toBeVisible();
  }

  /**
   * Get card count
   */
  async getCardCount(): Promise<number> {
    await this.waitForLoad();
    return await this.cardList.locator('[data-testid^="card-"]').count();
  }

  /**
   * Click new card button
   */
  async clickNewCard() {
    await this.newCardButton.click();
    await this.waitForLoad();
  }

  /**
   * Search cards
   */
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.waitForLoad();
  }

  /**
   * Filter by card type
   */
  async filterByType(type: string) {
    await this.filterType.selectOption(type);
    await this.waitForLoad();
  }

  /**
   * Filter by lifecycle phase
   */
  async filterByLifecycle(phase: string) {
    await this.filterLifecycle.selectOption(phase);
    await this.waitForLoad();
  }

  /**
   * Click on card by name
   */
  async openCard(cardName: string) {
    const card = this.cardList.locator(`[data-card-name="${cardName}"]`);
    // Wait for card to be visible before clicking
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await this.waitForLoad();
  }

  /**
   * Get card names from list
   */
  async getCardNames(): Promise<string[]> {
    const cards = await this.cardList.locator('[data-card-name]').allTextContents();
    return cards;
  }

  /**
   * Verify card exists in list
   */
  async verifyCardExists(cardName: string) {
    const card = this.cardList.locator(`[data-card-name="${cardName}"]`);
    await expect(card).toBeVisible();
  }

  /**
   * Go to next page
   */
  async nextPage() {
    await this.pagination.locator('[data-testid="next-page"]').click();
    await this.waitForLoad();
  }

  /**
   * Go to previous page
   */
  async previousPage() {
    await this.pagination.locator('[data-testid="previous-page"]').click();
    await this.waitForLoad();
  }

  /**
   * Select all cards
   */
  async selectAll() {
    await this.page.click('[data-testid="select-all-cards"]');
  }

  /**
   * Bulk delete selected cards
   */
  async bulkDelete() {
    await this.page.click('[data-testid="bulk-delete-button"]');
    // Confirm modal
    await this.page.click('[data-testid="confirm-delete"]');
    await this.waitForLoad();
  }
}

/**
 * Card Detail Page Object
 *
 * Handles individual card view and editing
 */
export class CardDetailPage extends BasePage {
  // Card elements
  readonly cardName: Locator;
  readonly cardType: Locator;
  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly relationshipsTab: Locator;
  readonly historyTab: Locator;

  constructor(page: Page) {
    super(page);

    this.cardName = page.locator('[data-testid="card-name"]');
    this.cardType = page.locator('[data-testid="card-type"]');
    this.editButton = page.locator('[data-testid="edit-card-button"]');
    this.deleteButton = page.locator('[data-testid="delete-card-button"]');
    this.saveButton = page.locator('[data-testid="save-card-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
    this.relationshipsTab = page.locator('[data-testid="tab-relationships"]');
    this.historyTab = page.locator('[data-testid="tab-history"]');
  }

  /**
   * Navigate to card detail
   */
  async goto(cardId: string) {
    await super.goto(`/cards/${cardId}`);
  }

  /**
   * Verify card detail loaded
   */
  async verifyCardLoaded() {
    await expect(this.cardName).toBeVisible();
    await expect(this.cardType).toBeVisible();
  }

  /**
   * Get card name
   */
  async getCardName(): Promise<string> {
    return await this.cardName.textContent() || '';
  }

  /**
   * Get card type
   */
  async getCardType(): Promise<string> {
    return await this.cardType.textContent() || '';
  }

  /**
   * Click edit button
   */
  async clickEdit() {
    await this.editButton.click();
    await this.waitForLoad();
  }

  /**
   * Click delete button
   */
  async clickDelete() {
    await this.deleteButton.click();
    // Confirm modal
    await this.page.click('[data-testid="confirm-delete"]');
    await this.waitForLoad();
  }

  /**
   * Update card name
   */
  async updateCardName(newName: string) {
    await this.clickEdit();
    await this.cardName.fill(newName);
    await this.saveButton.click();
    await this.waitForLoad();
  }

  /**
   * Navigate to relationships tab
   */
  async goToRelationships() {
    await this.relationshipsTab.click();
    await this.waitForLoad();
  }

  /**
   * Navigate to history tab
   */
  async goToHistory() {
    await this.historyTab.click();
    await this.waitForLoad();
  }
}

/**
 * New Card Page Object
 *
 * Handles creating new cards
 */
export class NewCardPage extends BasePage {
  readonly cardTypeSelect: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);

    this.cardTypeSelect = page.locator('[data-testid="card-type-select"]');
    this.nameInput = page.locator('[data-testid="card-name-input"]');
    this.descriptionInput = page.locator('[data-testid="card-description-input"]');
    this.saveButton = page.locator('[data-testid="save-card-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
  }

  /**
   * Navigate to new card page
   */
  async goto() {
    await super.goto('/cards/new');
  }

  /**
   * Select card type
   */
  async selectCardType(type: string) {
    await this.cardTypeSelect.selectOption(type);
    await this.waitForLoad();
  }

  /**
   * Fill card name
   */
  async fillName(name: string) {
    await this.nameInput.fill(name);
  }

  /**
   * Fill description
   */
  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  /**
   * Save card
   */
  async save() {
    await this.saveButton.click();
    await this.waitForLoad();
  }

  /**
   * Cancel card creation
   */
  async cancel() {
    await this.cancelButton.click();
    await this.waitForLoad();
  }

  /**
   * Create card with minimal data
   */
  async createCard(type: string, name: string, description?: string) {
    await this.goto();
    await this.selectCardType(type);
    await this.fillName(name);

    if (description) {
      await this.fillDescription(description);
    }

    await this.save();
  }
}
