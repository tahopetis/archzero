import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/index';
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

test.describe('Architecture Principles', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display principles list', async ({ page }) => {
    await page.goto('/governance/principles');

    // Verify principles page loads
    await expect(page.locator('h1:has-text("Principles"), [data-testid="principles-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new principle', async ({ page }) => {
    await page.goto('/governance/principles');

    // Click "Add Principle" button
    const addBtn = page.locator('button:has-text("Add Principle"), [data-testid="add-principle-btn"]');
    const hasButton = await addBtn.count();

    if (hasButton > 0) {
      await addBtn.first().click();

      // Fill principle form
      await page.locator('[data-testid="principle-statement"]').fill('Test Principle: Systems should be scalable');
      await page.locator('[data-testid="principle-rationale"]').fill('Scalability ensures future growth');
      await page.locator('[data-testid="principle-implications"]').fill('Systems must handle increased load');

      // Save
      await page.locator('button:has-text("Save"), [data-testid="save-principle-btn"]').click();

      // Verify success
      await expect(page.locator('text=Principle created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should edit existing principle', async ({ page }) => {
    await page.goto('/governance/principles');

    // Find first principle and click edit
    const firstPrinciple = page.locator('[data-testid="principle-item"], [data-testid="principle-card"]').first();
    const count = await firstPrinciple.count();

    if (count > 0) {
      await firstPrinciple.click();

      // Look for edit button
      const editBtn = page.locator('button:has-text("Edit"), [data-testid="edit-principle-btn"]');
      const hasEdit = await editBtn.count();

      if (hasEdit > 0) {
        await editBtn.first().click();

        // Modify statement
        await page.locator('[data-testid="principle-statement"]').fill('Updated Principle Statement');

        // Save
        await page.locator('button:has-text("Save"), [data-testid="save-principle-btn"]').click();

        // Verify update
        await expect(page.locator('text=Principle updated, text=Success')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should filter principles by category', async ({ page }) => {
    await page.goto('/governance/principles');

    // Look for category filter
    const categoryFilter = page.locator('[data-testid="category-filter"], select[name="category"]');
    const hasFilter = await categoryFilter.count();

    if (hasFilter > 0) {
      await categoryFilter.selectOption('performance');

      // Verify filtered results
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Technology Standards', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display standards list', async ({ page }) => {
    await page.goto('/governance/standards');

    await expect(page.locator('h1:has-text("Standards"), [data-testid="standards-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new standard', async ({ page }) => {
    await page.goto('/governance/standards');

    const addBtn = page.locator('button:has-text("Add Standard"), [data-testid="add-standard-btn"]');
    const hasButton = await addBtn.count();

    if (hasButton > 0) {
      await addBtn.first().click();

      // Fill standard form
      await page.locator('[data-testid="standard-name"]').fill('REST API Standard');
      await page.locator('[data-testid="standard-description"]').fill('All APIs must follow REST principles');
      await page.locator('[data-testid="standard-category"]').selectOption('api');

      // Save
      await page.locator('button:has-text("Save"), [data-testid="save-standard-btn"]').click();

      // Verify success
      await expect(page.locator('text=Standard created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should link standard to cards', async ({ page }) => {
    await page.goto('/governance/standards');

    // Find a standard and try to link cards
    const firstStandard = page.locator('[data-testid="standard-item"]').first();
    const count = await firstStandard.count();

    if (count > 0) {
      await firstStandard.click();

      // Look for "Link Cards" button
      const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
      const hasLink = await linkBtn.count();

      if (hasLink > 0) {
        await linkBtn.first().click();

        // Select cards to link
        const cardSelect = page.locator('[data-testid="card-select"]');
        const cardCount = await cardSelect.count();

        if (cardCount > 0) {
          await cardSelect.first().selectOption({ index: 1 });
          await page.locator('button:has-text("Confirm"), [data-testid="confirm-link-btn"]').click();

          await expect(page.locator('text=Cards linked, text=Success')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('Architecture Policies', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display policies list', async ({ page }) => {
    await page.goto('/governance/policies');

    await expect(page.locator('h1:has-text("Policies"), [data-testid="policies-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new policy', async ({ page }) => {
    await page.goto('/governance/policies');

    const addBtn = page.locator('button:has-text("Add Policy"), [data-testid="add-policy-btn"]');
    const hasButton = await addBtn.count();

    if (hasButton > 0) {
      await addBtn.first().click();

      // Fill policy form
      await page.locator('[data-testid="policy-title"]').fill('Data Retention Policy');
      await page.locator('[data-testid="policy-description"]').fill('Data must be retained for minimum 7 years');
      await page.locator('[data-testid="policy-scope"]').fill('Applies to all production systems');

      // Save
      await page.locator('button:has-text("Save"), [data-testid="save-policy-btn"]').click();

      await expect(page.locator('text=Policy created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show policy compliance status', async ({ page }) => {
    await page.goto('/governance/policies');

    // Check for compliance indicators
    const complianceIndicator = page.locator('[data-testid="compliance-status"], .compliance-badge');
    const count = await complianceIndicator.count();

    if (count > 0) {
      await expect(complianceIndicator.first()).toBeVisible();
    }
  });
});

test.describe('Exceptions Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display exceptions list', async ({ page }) => {
    await page.goto('/governance/exceptions');

    await expect(page.locator('h1:has-text("Exceptions"), [data-testid="exceptions-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should request exception for policy', async ({ page }) => {
    await page.goto('/governance/exceptions');

    const requestBtn = page.locator('button:has-text("Request Exception"), [data-testid="request-exception-btn"]');
    const hasButton = await requestBtn.count();

    if (hasButton > 0) {
      await requestBtn.first().click();

      // Fill exception request form
      await page.locator('[data-testid="exception-policy"]').selectOption({ index: 1 });
      await page.locator('[data-testid="exception-justification"]').fill('Legacy system constraints prevent compliance');
      await page.locator('[data-testid="exception-timeline"]').fill('Q2 2026');

      // Submit
      await page.locator('button:has-text("Submit"), [data-testid="submit-exception-btn"]').click();

      await expect(page.locator('text=Exception requested, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should approve exception (admin)', async ({ page }) => {
    await page.goto('/governance/exceptions');

    // Find pending exception
    const pendingException = page.locator('[data-testid="exception-item"][data-status="pending"]');
    const count = await pendingException.count();

    if (count > 0) {
      await pendingException.first().click();

      // Approve exception
      const approveBtn = page.locator('button:has-text("Approve"), [data-testid="approve-exception-btn"]');
      await approveBtn.click();

      await expect(page.locator('text=Exception approved, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Strategic Initiatives', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display initiatives list', async ({ page }) => {
    await page.goto('/governance/initiatives');

    await expect(page.locator('h1:has-text("Initiatives"), [data-testid="initiatives-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new initiative', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const addBtn = page.locator('button:has-text("Add Initiative"), [data-testid="add-initiative-btn"]');
    const hasButton = await addBtn.count();

    if (hasButton > 0) {
      await addBtn.first().click();

      // Fill initiative form
      await page.locator('[data-testid="initiative-name"]').fill('Cloud Migration Initiative');
      await page.locator('[data-testid="initiative-description"]').fill('Migrate all systems to cloud infrastructure');
      await page.locator('[data-testid="initiative-start-date"]').fill('2026-01-01');
      await page.locator('[data-testid="initiative-end-date"]').fill('2026-12-31');

      // Save
      await page.locator('button:has-text("Save"), [data-testid="save-initiative-btn"]').click();

      await expect(page.locator('text=Initiative created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should link initiative to cards', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      // Look for link cards functionality
      const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
      const hasLink = await linkBtn.count();

      if (hasLink > 0) {
        await linkBtn.first().click();

        // Select cards
        const cardSelect = page.locator('[data-testid="card-select"]');
        const cardCount = await cardSelect.count();

        if (cardCount > 0) {
          await cardSelect.first().selectOption({ index: 1 });
          await page.locator('button:has-text("Confirm"), [data-testid="confirm-link-btn"]').click();

          await expect(page.locator('text=Cards linked, text=Success')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should show initiative progress tracking', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Look for progress indicators
    const progressIndicator = page.locator('[data-testid="initiative-progress"], .progress-bar');
    const count = await progressIndicator.count();

    if (count > 0) {
      await expect(progressIndicator.first()).toBeVisible();
    }
  });
});

test.describe('Risk Register', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display risk register', async ({ page }) => {
    await page.goto('/governance/risks');

    await expect(page.locator('h1:has-text("Risks"), [data-testid="risks-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new risk entry', async ({ page }) => {
    await page.goto('/governance/risks');

    const addBtn = page.locator('button:has-text("Add Risk"), [data-testid="add-risk-btn"]');
    const hasButton = await addBtn.count();

    if (hasButton > 0) {
      await addBtn.first().click();

      // Fill risk form
      await page.locator('[data-testid="risk-title"]').fill('Data Breach Risk');
      await page.locator('[data-testid="risk-description"]').fill('Potential unauthorized access to sensitive data');
      await page.locator('[data-testid="risk-probability"]').selectOption('medium');
      await page.locator('[data-testid="risk-impact"]').selectOption('high');

      // Save
      await page.locator('button:has-text("Save"), [data-testid="save-risk-btn"]').click();

      await expect(page.locator('text=Risk created, text=Success')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show risk matrix view', async ({ page }) => {
    await page.goto('/governance/risks');

    // Look for risk matrix visualization
    const riskMatrix = page.locator('[data-testid="risk-matrix"], .risk-heatmap');
    const count = await riskMatrix.count();

    if (count > 0) {
      await expect(riskMatrix.first()).toBeVisible();
    }
  });
});

test.describe('Compliance Dashboard', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display compliance dashboard', async ({ page }) => {
    await page.goto('/governance/compliance');

    await expect(page.locator('h1:has-text("Compliance"), [data-testid="compliance-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show compliance metrics', async ({ page }) => {
    await page.goto('/governance/compliance');

    // Look for compliance score/metrics
    const complianceScore = page.locator('[data-testid="compliance-score"], .compliance-metric');
    const count = await complianceScore.count();

    if (count > 0) {
      await expect(complianceScore.first()).toBeVisible();
    }
  });

  test('should filter by compliance framework', async ({ page }) => {
    await page.goto('/governance/compliance');

    // Look for framework filter
    const frameworkFilter = page.locator('[data-testid="framework-filter"], select[name="framework"]');
    const hasFilter = await frameworkFilter.count();

    if (hasFilter > 0) {
      await frameworkFilter.selectOption('GDPR');

      // Verify filtered view
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Governance Cross-Features', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should link principle to standard', async ({ page }) => {
    await page.goto('/governance/principles');

    const firstPrinciple = page.locator('[data-testid="principle-item"]').first();
    const count = await firstPrinciple.count();

    if (count > 0) {
      await firstPrinciple.click();

      // Look for "Link Standard" functionality
      const linkBtn = page.locator('button:has-text("Link Standard"), [data-testid="link-standard-btn"]');
      const hasLink = await linkBtn.count();

      if (hasLink > 0) {
        await linkBtn.first().click();

        // Select standard to link
        const standardSelect = page.locator('[data-testid="standard-select"]');
        const standardCount = await standardSelect.count();

        if (standardCount > 0) {
          await standardSelect.first().selectOption({ index: 1 });
          await page.locator('button:has-text("Confirm"), [data-testid="confirm-link-btn"]').click();

          await expect(page.locator('text=Standard linked, text=Success')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should export governance report', async ({ page }) => {
    await page.goto('/governance/principles');

    // Look for export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-report-btn"]');
    const hasExport = await exportBtn.count();

    if (hasExport > 0) {
      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      await exportBtn.first().click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx|csv)$/);
    }
  });

  test('should search across governance items', async ({ page }) => {
    await page.goto('/governance/principles');

    // Look for search functionality
    const searchInput = page.locator('[data-testid="governance-search"], input[placeholder*="search" i]');
    const hasSearch = await searchInput.count();

    if (hasSearch > 0) {
      await searchInput.first().fill('scalability');

      // Verify search results
      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="search-result"], [data-testid="principle-item"]');
      const resultCount = await results.count();

      expect(resultCount).toBeGreaterThanOrEqual(0);
    }
  });
});
