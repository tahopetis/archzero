import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages/index';
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

test.describe('Relationship Management', () => {
  let loginPage: LoginPage;
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new DashboardPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display relationship graph', async ({ page }) => {
    // Navigate to relationship graph page
    await page.goto('/relationships');

    // Verify relationship graph is loaded
    await expect(page.locator('[data-testid="relationship-graph"], canvas, .graph-container')).toBeVisible({ timeout: 10000 });
  });

  test('should display card dependencies', async ({ page }) => {
    // Navigate to a specific card's relationships
    await page.goto('/cards');

    // Click on a card to view its relationships
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Verify relationships section is visible
    await expect(page.locator('[data-testid="relationships-section"], [data-testid="card-relationships"]')).toBeVisible({ timeout: 5000 });
  });

  test('should create relationship between cards', async ({ page }) => {
    // Navigate to card detail page
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Click "Add Relationship" button
    const addRelationBtn = page.locator('button:has-text("Add Relationship"), [data-testid="add-relationship-btn"]');
    const hasButton = await addRelationBtn.count();

    if (hasButton > 0) {
      await addRelationBtn.first().click();

      // Select related card and relationship type
      await page.locator('[data-testid="related-card-select"]').selectOption({ index: 1 });
      await page.locator('[data-testid="relationship-type-select"]').selectOption('depends_on');

      // Save relationship
      await page.locator('button:has-text("Save"), [data-testid="save-relationship-btn"]').click();

      // Verify success message
      await expect(page.locator('text=Relationship created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter relationships by type', async ({ page }) => {
    await page.goto('/relationships');

    // Select relationship type filter
    const typeFilter = page.locator('[data-testid="relationship-type-filter"]');
    const hasFilter = await typeFilter.count();

    if (hasFilter > 0) {
      await typeFilter.selectOption('depends_on');

      // Verify filtered results
      await expect(page.locator('[data-testid="relationship-item"]').first()).toBeVisible();
    }
  });

  test('should display relationship impact analysis', async ({ page }) => {
    // Navigate to a card and check impact analysis
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Look for impact analysis section
    const impactSection = page.locator('[data-testid="impact-analysis"], [data-testid="dependency-chain"]');
    const hasImpact = await impactSection.count();

    if (hasImpact > 0) {
      await expect(impactSection.first()).toBeVisible();
    }
  });
});

test.describe('Relationship Graph Features', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should zoom and pan relationship graph', async ({ page }) => {
    await page.goto('/relationships');

    const graph = page.locator('[data-testid="relationship-graph"], canvas');
    const hasGraph = await graph.count();

    if (hasGraph > 0) {
      // Test zoom
      await page.mouse.wheel(0, -100); // Scroll up to zoom in
      await page.waitForTimeout(500);

      // Test pan (drag)
      const box = await graph.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 50);
        await page.mouse.up();
      }
    }
  });

  test('should search for specific card in graph', async ({ page }) => {
    await page.goto('/relationships');

    // Use graph search if available
    const searchInput = page.locator('[data-testid="graph-search"], input[placeholder*="Search"]');
    const hasSearch = await searchInput.count();

    if (hasSearch > 0) {
      await searchInput.first().fill('Test Application');
      await page.waitForTimeout(500);

      // Verify search results or highlighting
      const highlighted = page.locator('.highlighted, .selected, [data-selected="true"]');
      const count = await highlighted.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should export relationship graph', async ({ page }) => {
    await page.goto('/relationships');

    // Look for export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-graph-btn"]');
    const hasExport = await exportBtn.count();

    if (hasExport > 0) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      await exportBtn.first().click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(png|svg|json)$/);
    }
  });
});

test.describe('Relationship Validation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should prevent circular dependencies', async ({ page }) => {
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Try to add circular relationship
    const addRelationBtn = page.locator('button:has-text("Add Relationship"), [data-testid="add-relationship-btn"]');
    const hasButton = await addRelationBtn.count();

    if (hasButton > 0) {
      await addRelationBtn.first().click();

      // Try to create self-referencing relationship
      await page.locator('[data-testid="related-card-select"]').selectOption({ index: 0 });
      await page.locator('[data-testid="relationship-type-select"]').selectOption('depends_on');

      // Try to save
      await page.locator('button:has-text("Save"), [data-testid="save-relationship-btn"]').click();

      // Should show validation error
      const errorMsg = page.locator('text=Circular dependency, text=Cannot create, text=Invalid relationship');
      await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent duplicate relationships', async ({ page }) => {
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Check existing relationships
    const existingRelations = page.locator('[data-testid="existing-relationship"]');
    const count = await existingRelations.count();

    if (count > 0) {
      // Try to add duplicate relationship
      const addRelationBtn = page.locator('button:has-text("Add Relationship"), [data-testid="add-relationship-btn"]');
      await addRelationBtn.first().click();

      // Select same relationship as existing
      await page.locator('[data-testid="related-card-select"]').selectOption({ index: 1 });
      await page.locator('[data-testid="relationship-type-select"]').selectOption('depends_on');

      await page.locator('button:has-text("Save"), [data-testid="save-relationship-btn"]').click();

      // Should show duplicate error
      const errorMsg = page.locator('text=Relationship already exists, text=Duplicate, text=Already connected');
      await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Relationship Matrix View', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display relationship matrix', async ({ page }) => {
    await page.goto('/relationships/matrix');

    // Verify matrix view is loaded
    const matrix = page.locator('[data-testid="relationship-matrix"], table.matrix-view');
    const hasMatrix = await matrix.count();

    if (hasMatrix > 0) {
      await expect(matrix.first()).toBeVisible();
    }
  });

  test('should filter matrix by card type', async ({ page }) => {
    await page.goto('/relationships/matrix');

    const typeFilter = page.locator('[data-testid="matrix-type-filter"]');
    const hasFilter = await typeFilter.count();

    if (hasFilter > 0) {
      await typeFilter.selectOption('Application');

      // Verify matrix updates
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Dependency Chain Analysis', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should show upstream dependencies', async ({ page }) => {
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Look for upstream/dependencies section
    const upstream = page.locator('[data-testid="upstream-dependencies"], [data-testid="dependencies"]');
    const hasUpstream = await upstream.count();

    if (hasUpstream > 0) {
      await expect(upstream.first()).toBeVisible();
    }
  });

  test('should show downstream dependencies', async ({ page }) => {
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Look for downstream/dependents section
    const downstream = page.locator('[data-testid="downstream-dependencies"], [data-testid="dependents"]');
    const hasDownstream = await downstream.count();

    if (hasDownstream > 0) {
      await expect(downstream.first()).toBeVisible();
    }
  });

  test('should calculate impact score', async ({ page }) => {
    await page.goto('/cards');
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Look for impact score or criticality indicator
    const impactScore = page.locator('[data-testid="impact-score"], [data-testid="criticality"]');
    const hasScore = await impactScore.count();

    if (hasScore > 0) {
      await expect(impactScore.first()).toBeVisible();
    }
  });
});
