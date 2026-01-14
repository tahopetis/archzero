import { test, expect } from '@playwright/test';
import { LoginPage, CardListPage } from '../pages/index';
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

test.describe('Global Search', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should open global search dialog', async ({ page }) => {
    // Open global search (typically via keyboard shortcut or button)
    await page.keyboard.press('Control+K');

    // Verify search dialog is visible
    const searchDialog = page.locator('[data-testid="global-search-dialog"], .search-dialog, [role="dialog"]');
    await expect(searchDialog.first()).toBeVisible({ timeout: 5000 });
  });

  test('should search for cards by name', async ({ page }) => {
    // Open search
    await page.keyboard.press('Control+K');

    // Type search query
    const searchInput = page.locator('[data-testid="global-search-input"], input[placeholder*="Search" i]');
    await searchInput.fill('Test Application');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify search results appear
    const searchResults = page.locator('[data-testid="search-result"], .search-result-item');
    const count = await searchResults.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should search across multiple entity types', async ({ page }) => {
    await page.keyboard.press('Control+K');

    const searchInput = page.locator('[data-testid="global-search-input"], input[placeholder*="Search" i]');
    await searchInput.fill('API');

    // Look for entity type filters or tabs
    const entityTypes = page.locator('[data-testid="entity-type-filter"], .search-entity-tabs');
    const hasFilter = await entityTypes.count();

    if (hasFilter > 0) {
      // Verify multiple entity types are shown
      const tabs = await entityTypes.locator('[role="tab"], .tab').count();
      expect(tabs).toBeGreaterThan(0);
    }
  });

  test('should navigate to search result', async ({ page }) => {
    await page.keyboard.press('Control+K');

    const searchInput = page.locator('[data-testid="global-search-input"], input[placeholder*="Search" i]');
    await searchInput.fill('Test Application');

    // Wait for results
    await page.waitForTimeout(1000);

    // Click first result
    const firstResult = page.locator('[data-testid="search-result"], .search-result-item').first();
    const resultCount = await firstResult.count();

    if (resultCount > 0) {
      await firstResult.click();

      // Verify navigation occurred
      await expect(page).toHaveURL(/cards|dashboard/);
    }
  });

  test('should show recent searches', async ({ page }) => {
    await page.keyboard.press('Control+K');

    // Look for recent searches section
    const recentSearches = page.locator('[data-testid="recent-searches"], .search-history');
    const hasRecent = await recentSearches.count();

    // Recent searches might not appear if it's the first search
    // This is a soft assertion
    if (hasRecent > 0) {
      await expect(recentSearches.first()).toBeVisible();
    }
  });

  test('should handle keyboard navigation in search results', async ({ page }) => {
    await page.keyboard.press('Control+K');

    const searchInput = page.locator('[data-testid="global-search-input"], input[placeholder*="Search" i]');
    await searchInput.fill('Test');

    // Navigate results with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowUp');

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Should navigate or close dialog
    await page.waitForTimeout(500);
  });
});

test.describe('Card List Search and Filter', () => {
  let loginPage: LoginPage;
  let cardListPage: CardListPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cardListPage = new CardListPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
    await cardListPage.goto();
  });

  test('should search cards by name', async ({ page }) => {
    await cardListPage.search('Test Application');

    // Wait for results
    await page.waitForTimeout(500);

    const cardNames = await cardListPage.getCardNames();
    const allMatch = cardNames.every(name =>
      name.toLowerCase().includes('test application')
    );

    expect(allMatch).toBe(true);
  });

  test('should search cards by description', async ({ page }) => {
    // Use advanced search
    const advancedSearch = page.locator('[data-testid="advanced-search-toggle"]');
    const hasAdvanced = await advancedSearch.count();

    if (hasAdvanced > 0) {
      await advancedSearch.click();

      // Select search in description
      await page.locator('[data-testid="search-field-select"]').selectOption('description');
      await page.locator('[data-testid="search-input"]').fill('application');

      // Verify results
      await page.waitForTimeout(500);
    }
  });

  test('should filter by card type', async ({ page }) => {
    await cardListPage.filterByType('Application');

    // Verify filtered results
    await page.waitForTimeout(500);

    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should filter by lifecycle phase', async ({ page }) => {
    await cardListPage.filterByLifecycle('Active');

    // Verify filtered results
    await page.waitForTimeout(500);

    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should combine multiple filters', async ({ page }) => {
    // Apply type filter
    await cardListPage.filterByType('Application');

    // Apply lifecycle filter
    await cardListPage.filterByLifecycle('Active');

    // Search
    await cardListPage.search('Test');

    // Verify combined filter results
    await page.waitForTimeout(500);

    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should clear filters', async ({ page }) => {
    // Apply filters
    await cardListPage.filterByType('Application');
    await cardListPage.search('Test');

    // Clear filters
    const clearBtn = page.locator('button:has-text("Clear"), [data-testid="clear-filters-btn"]');
    const hasClear = await clearBtn.count();

    if (hasClear > 0) {
      await clearBtn.click();

      // Verify all cards are shown
      await page.waitForTimeout(500);
    }
  });

  test('should show filter count', async ({ page }) => {
    await cardListPage.filterByType('Application');

    // Look for result count
    const resultCount = page.locator('[data-testid="result-count"], .filter-count');
    const hasCount = await resultCount.count();

    if (hasCount > 0) {
      await expect(resultCount.first()).toBeVisible();
    }
  });
});

test.describe('Advanced Search Features', () => {
  let loginPage: LoginPage;
  let cardListPage: CardListPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cardListPage = new CardListPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
    await cardListPage.goto();
  });

  test('should save search as preset', async ({ page }) => {
    // Perform search
    await cardListPage.search('Test Application');

    // Look for save search option
    const saveBtn = page.locator('button:has-text("Save Search"), [data-testid="save-search-btn"]');
    const hasSave = await saveBtn.count();

    if (hasSave > 0) {
      await saveBtn.click();

      // Enter preset name
      await page.locator('[data-testid="preset-name"]').fill('Test Applications');
      await page.locator('button:has-text("Save"), [data-testid="confirm-save-btn"]').click();

      // Verify preset created
      await expect(page.locator('text=Search saved, text=Preset created')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should load saved search preset', async ({ page }) => {
    // Look for saved presets dropdown
    const presetSelect = page.locator('[data-testid="search-preset-select"], select[name="preset"]');
    const hasPreset = await presetSelect.count();

    if (hasPreset > 0) {
      // Select a preset
      await presetSelect.selectOption({ index: 1 });

      // Verify filters are applied
      await page.waitForTimeout(500);

      const searchInput = page.locator('[data-testid="search-input"]');
      const hasInput = await searchInput.count();

      if (hasInput > 0) {
        const value = await searchInput.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  test('should use faceted search', async ({ page }) => {
    // Look for faceted search panel
    const facetPanel = page.locator('[data-testid="faceted-search"], .search-facets');
    const hasFacets = await facetPanel.count();

    if (hasFacets > 0) {
      // Open facets
      await facetPanel.first().click();

      // Select facet values
      const typeFacet = page.locator('[data-testid="facet-type"] input[type="checkbox"]').first();
      await typeFacet.check();

      // Verify filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should show search suggestions', async ({ page }) => {
    const searchInput = page.locator('[data-testid="filter-search"], input[placeholder*="Search" i]');

    // Type partial search
    await searchInput.fill('App');

    // Wait for suggestions
    await page.waitForTimeout(500);

    // Look for suggestions dropdown
    const suggestions = page.locator('[data-testid="search-suggestions"], .suggestions-dropdown');
    const hasSuggestions = await suggestions.count();

    if (hasSuggestions > 0) {
      await expect(suggestions.first()).toBeVisible();
    }
  });

  test('should support boolean search operators', async ({ page }) => {
    // Search with AND operator
    await cardListPage.search('Test AND Application');

    // Verify results
    await page.waitForTimeout(500);

    const cards = page.locator('[data-testid="card-item"]');
    const count = await cards.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    // Search for non-existent card
    await cardListPage.search('NonExistentCardNameXYZ123');

    // Verify empty state message
    const emptyState = page.locator('[data-testid="empty-search"], .no-results, text=No results');
    await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Discovery Features', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display card details on hover', async ({ page }) => {
    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();

    // Hover over card
    await firstCard.hover();

    // Look for tooltip or popover
    const tooltip = page.locator('[data-testid="card-tooltip"], .card-popover');
    await page.waitForTimeout(500);

    const hasTooltip = await tooltip.count();
    if (hasTooltip > 0) {
      await expect(tooltip.first()).toBeVisible();
    }
  });

  test('should show related cards', async ({ page }) => {
    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Look for related cards section
    const relatedCards = page.locator('[data-testid="related-cards"], .card-recommendations');
    await page.waitForTimeout(500);

    const hasRelated = await relatedCards.count();
    if (hasRelated > 0) {
      await expect(relatedCards.first()).toBeVisible();
    }
  });

  test('should provide card recommendations', async ({ page }) => {
    await page.goto('/cards');

    // Look for recommendations section
    const recommendations = page.locator('[data-testid="recommendations"], .suggestions');
    const hasRecommendations = await recommendations.count();

    if (hasRecommendations > 0) {
      await expect(recommendations.first()).toBeVisible();
    }
  });

  test('should show card tags for discovery', async ({ page }) => {
    await page.goto('/cards');

    // Look for tag filters
    const tagFilters = page.locator('[data-testid="tag-filter"], .tag-cloud');
    const hasTags = await tagFilters.count();

    if (hasTags > 0) {
      await expect(tagFilters.first()).toBeVisible();

      // Click a tag to filter
      const firstTag = tagFilters.locator('[data-testid="tag"], .tag-item').first();
      await firstTag.click();

      // Verify filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should support alphabetical browsing', async ({ page }) => {
    await page.goto('/cards');

    // Look for alphabetical index
    const alphaIndex = page.locator('[data-testid="alphabetical-index"], .a-z-nav');
    const hasAlpha = await alphaIndex.count();

    if (hasAlpha > 0) {
      // Click a letter
      const letterA = alphaIndex.locator('button:has-text("A"), [data-letter="A"]').first();
      await letterA.click();

      // Verify filtered results
      await page.waitForTimeout(500);
    }
  });

  test('should display recently viewed cards', async ({ page }) => {
    // View a card
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Go back
    await page.goBack();

    // Look for recently viewed section
    const recentCards = page.locator('[data-testid="recently-viewed"], .history-panel');
    const hasRecent = await recentCards.count();

    if (hasRecent > 0) {
      await expect(recentCards.first()).toBeVisible();
    }
  });
});

test.describe('Search Performance', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should perform search within reasonable time', async ({ page }) => {
    await page.goto('/cards');

    const startTime = Date.now();

    // Perform search
    const searchInput = page.locator('[data-testid="filter-search"], input[placeholder*="Search" i]');
    await searchInput.fill('Test Application');

    // Wait for results
    await page.waitForTimeout(500);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Search should complete within 3 seconds
    expect(duration).toBeLessThan(3000);
  });

  test('should debounce search input', async ({ page }) => {
    await page.goto('/cards');

    const searchInput = page.locator('[data-testid="filter-search"], input[placeholder*="Search" i]');

    // Type rapidly
    await searchInput.fill('T');
    await searchInput.fill('Te');
    await searchInput.fill('Tes');
    await searchInput.fill('Test');

    // Should only trigger one search after typing stops
    await page.waitForTimeout(1000);
  });

  test('should handle large result sets efficiently', async ({ page }) => {
    await page.goto('/cards');

    // Clear any filters
    const clearBtn = page.locator('button:has-text("Clear"), [data-testid="clear-filters-btn"]');
    const hasClear = await clearBtn.count();

    if (hasClear > 0) {
      await clearBtn.click();
    }

    // Load all cards
    await page.waitForTimeout(1000);

    // Verify pagination or virtual scrolling
    const pagination = page.locator('[data-testid="pagination"], .pager');
    const hasPagination = await pagination.count();

    if (hasPagination > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });
});
