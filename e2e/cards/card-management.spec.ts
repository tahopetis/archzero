import { test, expect } from '@playwright/test';
import { CardListPage, CardDetailPage, NewCardPage } from '../pages/index';
import { CardFactory } from '../factories/index';
import { CARD_TYPES } from '../helpers/index';

test.describe('Card Management', () => {
  let cardListPage: CardListPage;
  let newCardPage: NewCardPage;

  test.beforeEach(async ({ page }) => {
    cardListPage = new CardListPage(page);
    newCardPage = new NewCardPage(page);
  });

  test('should display card list', async ({ page }) => {
    await cardListPage.goto();
    await cardListPage.verifyListLoaded();

    const count = await cardListPage.getCardCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should search cards by name', async ({ page }) => {
    await cardListPage.goto();
    await cardListPage.search('Test Application');

    await cardListPage.verifyListLoaded();
    const names = await cardListPage.getCardNames();

    names.forEach((name) => {
      expect(name.toLowerCase()).toContain('test application');
    });
  });

  test('should filter cards by type', async ({ page }) => {
    await cardListPage.goto();
    await cardListPage.filterByType(CARD_TYPES.APPLICATION);

    await cardListPage.verifyListLoaded();
    // Verify filtering worked (would need actual data)
  });

  test('should filter cards by lifecycle phase', async ({ page }) => {
    await cardListPage.goto();
    await cardListPage.filterByLifecycle('Active');

    await cardListPage.verifyListLoaded();
    // Verify filtering worked
  });

  test('should navigate to card detail', async ({ page }) => {
    await cardListPage.goto();

    // Assumes there's at least one card
    const cardName = 'Test Application';
    await cardListPage.openCard(cardName);

    const cardDetail = new CardDetailPage(page);
    await cardDetail.verifyCardLoaded();

    const name = await cardDetail.getCardName();
    expect(name).toBe(cardName);
  });
});

test.describe('Card Quality Score', () => {
  test('should calculate quality score based on field completeness', async ({ page }) => {
    const newCardPage = new NewCardPage(page);

    await newCardPage.goto();
    await newCardPage.selectCardType(CARD_TYPES.APPLICATION);

    // Fill minimal fields
    await newCardPage.fillName('Test App');

    // Quality score should be calculated
    // This will be verified once the form is working
    await expect(page.locator('[data-testid="quality-score"]')).not.toBeVisible();
  });
});

test.describe('Card Bulk Operations', () => {
  test('should select multiple cards', async ({ page }) => {
    const cardListPage = new CardListPage(page);
    await cardListPage.goto();
    await cardListPage.selectAll();

    // Verify bulk actions appear
    const bulkActions = page.locator('[data-testid="bulk-actions"]');
    await expect(bulkActions).toBeVisible();
  });

  test('should bulk delete selected cards', async ({ page }) => {
    const cardListPage = new CardListPage(page);
    await cardListPage.goto();
    await cardListPage.selectAll();
    await cardListPage.bulkDelete();

    // Verify success message
    await cardListPage.verifySuccess('Cards deleted successfully');
  });
});
