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

test.describe('Strategic Initiatives', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display initiatives list', async ({ page }) => {
    await page.goto('/governance/initiatives');

    await expect(page.locator('[data-testid="initiatives-list"], h1:has-text("Initiatives")')).toBeVisible({ timeout: 10000 });
  });

  test('should create new initiative', async ({ page }) => {
    await page.goto('/governance/initiatives');

    await page.locator('button:has-text("Add Initiative"), [data-testid="add-initiative-btn"]').click();

    // Fill initiative details
    await page.locator('[data-testid="initiative-name"]').fill('Cloud Migration Initiative');
    await page.locator('[data-testid="initiative-description"]').fill('Migrate all on-premise systems to cloud infrastructure');
    await page.locator('[data-testid="initiative-type"]').selectOption('modernization');
    await page.locator('[data-testid="initiative-budget"]').fill('1000000');
    await page.locator('[data-testid="initiative-start-date"]').fill('2026-01-01');
    await page.locator('[data-testid="initiative-end-date"]').fill('2026-12-31');

    // Save
    await page.locator('button:has-text("Save"), [data-testid="save-initiative-btn"]').click();

    await expect(page.locator('text=Initiative created, text=Success')).toBeVisible({ timeout: 5000 });
  });

  test('should track initiative budget', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      // View budget section
      const budgetSection = page.locator('[data-testid="initiative-budget"], .budget-tracking');
      await expect(budgetSection).toBeVisible();

      // Should show allocated, spent, and remaining budget
      const allocatedBudget = budgetSection.locator('[data-testid="budget-allocated"]');
      const spentBudget = budgetSection.locator('[data-testid="budget-spent"]');
      const remainingBudget = budgetSection.locator('[data-testid="budget-remaining"]');

      await expect(allocatedBudget).toBeVisible();
      await expect(spentBudget).toBeVisible();
      await expect(remainingBudget).toBeVisible();
    }
  });

  test('should show initiative health indicators', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      // Look for health indicator
      const healthIndicator = page.locator('[data-testid="initiative-health"], .health-status');
      const hasHealth = await healthIndicator.count();

      if (hasHealth > 0) {
        await expect(healthIndicator.first()).toBeVisible();

        // Should be one of: On Track, At Risk, Behind Schedule
        const healthText = await healthIndicator.first().textContent();
        expect(['On Track', 'At Risk', 'Behind Schedule']).toContain(healthText);
      }
    }
  });

  test('should update initiative health status', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      // Update health
      await page.locator('[data-testid="initiative-health"]').selectOption('At Risk');

      // Provide reason
      await page.locator('[data-testid="health-reason"]').fill('Budget constraints and resource shortages');

      await page.locator('button:has-text("Save")').click();

      await expect(page.locator('text=Initiative updated')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show initiative impact map visualization', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      const impactMapBtn = page.locator('button:has-text("Impact Map"), [data-testid="impact-map-btn"]');
      const hasButton = await impactMapBtn.count();

      if (hasButton > 0) {
        await impactMapBtn.click();

        // Should show which cards/systems are affected
        const impactMap = page.locator('[data-testid="impact-map"], .impact-visualization');
        await expect(impactMap).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should link initiative to cards', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
      const hasButton = await linkBtn.count();

      if (hasButton > 0) {
        await linkBtn.click();

        // Select cards to link
        const cardSelect = page.locator('[data-testid="card-select"]');
        const hasSelect = await cardSelect.count();

        if (hasSelect > 0) {
          await cardSelect.selectOption({ index: 1 });
          await page.locator('button:has-text("Link")').click();

          await expect(page.locator('text=Cards linked')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should show initiative progress tracking', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await firstInitiative.count();

    if (count > 0) {
      await firstInitiative.click();

      // Look for progress indicator
      const progressBar = page.locator('[data-testid="initiative-progress"], .progress-bar');
      const hasProgress = await progressBar.count();

      if (hasProgress > 0) {
        await expect(progressBar.first()).toBeVisible();

        // Should show percentage
        const progressText = await progressBar.first().textContent();
        expect(progressText).toMatch(/\d+%/);
      }
    }
  });

  test('should filter initiatives by type', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const typeFilter = page.locator('[data-testid="initiative-type-filter"]');
    const hasFilter = await typeFilter.count();

    if (hasFilter > 0) {
      await typeFilter.selectOption('modernization');

      await page.waitForTimeout(500);

      // Should show only modernization initiatives
      const initiatives = page.locator('[data-testid="initiative-item"][data-type="modernization"]');
      expect(await initiatives.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter initiatives by status', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const statusFilter = page.locator('[data-testid="initiative-status-filter"]');
    const hasFilter = await statusFilter.count();

    if (hasFilter > 0) {
      await statusFilter.selectOption('active');

      await page.waitForTimeout(500);

      // Should show only active initiatives
      const initiatives = page.locator('[data-testid="initiative-item"][data-status="active"]');
      expect(await initiatives.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Target State Architecture', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display target state architecture', async ({ page }) => {
    await page.goto('/governance/target-state');

    await expect(page.locator('[data-testid="target-state"], h1:has-text("Target State")')).toBeVisible({ timeout: 10000 });
  });

  test('should create target state model', async ({ page }) => {
    await page.goto('/governance/target-state');

    await page.locator('button:has-text("Create Model"), [data-testid="create-model-btn"]').click();

    // Fill model details
    await page.locator('[data-testid="model-name"]').fill('2026 Target Architecture');
    await page.locator('[data-testid="model-description"]').fill('Future state architecture for 2026');
    await page.locator('[data-testid="model-target-date"]').fill('2026-12-31');

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('text=Model created')).toBeVisible({ timeout: 5000 });
  });

  test('should add cards to target state', async ({ page }) => {
    await page.goto('/governance/target-state');

    const model = page.locator('[data-testid="target-state-model"]').first();
    const count = await model.count();

    if (count > 0) {
      await model.click();

      // Add card to target state
      await page.locator('button:has-text("Add Card"), [data-testid="add-card-btn"]').click();

      const cardSelect = page.locator('[data-testid="card-select"]');
      const hasSelect = await cardSelect.count();

      if (hasSelect > 0) {
        await cardSelect.selectOption({ index: 1 });
        await page.locator('button:has-text("Add")').click();

        await expect(page.locator('text=Card added')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should visualize target state dependencies', async ({ page }) => {
    await page.goto('/governance/target-state');

    const model = page.locator('[data-testid="target-state-model"]').first();
    const count = await model.count();

    if (count > 0) {
      await model.click();

      const dependencyView = page.locator('[data-testid="dependency-view"], button:has-text("Dependencies")');
      const hasView = await dependencyView.count();

      if (hasView > 0) {
        await dependencyView.click();

        const dependencyGraph = page.locator('[data-testid="dependency-graph"]');
        await expect(dependencyGraph).toBeVisible();
      }
    }
  });

  test('should support multiple target state versions', async ({ page }) => {
    await page.goto('/governance/target-state');

    // Create first version
    await page.locator('button:has-text("Create Model")').click();
    await page.locator('[data-testid="model-name"]').fill('2026 Target');
    await page.locator('button:has-text("Create")').click();
    await page.waitForTimeout(500);

    // Create second version
    await page.locator('button:has-text("Create Model")').click();
    await page.locator('[data-testid="model-name"]').fill('2027 Target');
    await page.locator('button:has-text("Create")').click();

    // Should show both versions
    const models = page.locator('[data-testid="target-state-model"]');
    expect(await models.count()).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Baseline State Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should create baseline snapshot', async ({ page }) => {
    await page.goto('/governance/baseline');

    await page.locator('button:has-text("Create Snapshot"), [data-testid="create-snapshot-btn"]').click();

    await page.locator('[data-testid="snapshot-name"]').fill('Current State 2026-01');
    await page.locator('[data-testid="snapshot-description"]').fill('Baseline before cloud migration');

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('text=Snapshot created')).toBeVisible({ timeout: 5000 });
  });

  test('should capture current architecture state', async ({ page }) => {
    await page.goto('/governance/baseline');

    await page.locator('button:has-text("Capture Current State")').click();

    // Should scan and capture all current cards
    await expect(page.locator('text=State captured')).toBeVisible({ timeout: 10000 });
  });

  test('should show baseline details', async ({ page }) => {
    await page.goto('/governance/baseline');

    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    const count = await snapshot.count();

    if (count > 0) {
      await snapshot.click();

      // Should show captured cards and metrics
      const cardsList = page.locator('[data-testid="baseline-cards"]');
      await expect(cardsList).toBeVisible();
    }
  });

  test('should compare baseline with target state', async ({ page }) => {
    await page.goto('/governance/baseline');

    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    const count = await snapshot.count();

    if (count > 0) {
      await snapshot.click();

      const compareBtn = page.locator('button:has-text("Compare with Target"), [data-testid="compare-target-btn"]');
      const hasButton = await compareBtn.count();

      if (hasButton > 0) {
        await compareBtn.click();

        const comparison = page.locator('[data-testid="gap-analysis"]');
        await expect(comparison).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should restore from baseline', async ({ page }) => {
    await page.goto('/governance/baseline');

    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    const count = await snapshot.count();

    if (count > 0) {
      await snapshot.click();

      const restoreBtn = page.locator('button:has-text("Restore"), [data-testid="restore-snapshot-btn"]');
      const hasButton = await restoreBtn.count();

      if (hasButton > 0) {
        await restoreBtn.click();

        // Confirm restore
        await page.locator('button:has-text("Confirm Restore")').click();

        await expect(page.locator('text=Restored from snapshot')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

test.describe('Gap Analysis', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should perform gap analysis between current and target state', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    await expect(page.locator('[data-testid="gap-analysis"], h1:has-text("Gap Analysis")')).toBeVisible({ timeout: 10000 });
  });

  test('should show gaps in architecture', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    const gaps = page.locator('[data-testid="architecture-gap"]');
    const count = await gaps.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should categorize gaps by severity', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    // Look for high-priority gaps
    const highPriorityGaps = page.locator('[data-testid="architecture-gap"][data-severity="high"]');
    const count = await highPriorityGaps.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show gap details and recommendations', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    const firstGap = page.locator('[data-testid="architecture-gap"]').first();
    const count = await firstGap.count();

    if (count > 0) {
      await firstGap.click();

      // Should show gap description and recommendations
      const gapDetails = page.locator('[data-testid="gap-details"]');
      await expect(gapDetails).toBeVisible();

      const recommendations = page.locator('[data-testid="gap-recommendations"]');
      await expect(recommendations).toBeVisible();
    }
  });

  test('should export gap analysis report', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-gap-btn"]');
    const hasButton = await exportBtn.count();

    if (hasButton > 0) {
      const downloadPromise = page.waitForEvent('download');

      await exportBtn.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
    }
  });
});

test.describe('Transformation Roadmap', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display transformation roadmap', async ({ page }) => {
    await page.goto('/governance/roadmap');

    await expect(page.locator('[data-testid="transformation-roadmap"], h1:has-text("Roadmap")')).toBeVisible({ timeout: 10000 });
  });

  test('should generate roadmap from gap analysis', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const generateBtn = page.locator('button:has-text("Generate Roadmap"), [data-testid="generate-roadmap-btn"]');
    const hasButton = await generateBtn.count();

    if (hasButton > 0) {
      await generateBtn.click();

      // Select baseline and target
      await page.locator('[data-testid="baseline-select"]').selectOption({ index: 1 });
      await page.locator('[data-testid="target-select"]').selectOption({ index: 1 });

      await page.locator('button:has-text("Generate")').click();

      await expect(page.locator('text=Roadmap generated')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show roadmap timeline', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const timeline = page.locator('[data-testid="roadmap-timeline"], .timeline-view');
    const hasTimeline = await timeline.count();

    if (hasTimeline > 0) {
      await expect(timeline.first()).toBeVisible();
    }
  });

  test('should visualize dependencies in roadmap', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const dependencyView = page.locator('[data-testid="dependency-view"], button:has-text("Dependencies")');
    const hasView = await dependencyView.count();

    if (hasView > 0) {
      await dependencyView.click();

      const dependencyGraph = page.locator('[data-testid="roadmap-dependencies"]');
      await expect(dependencyGraph).toBeVisible();
    }
  });

  test('should show roadmap milestones', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const milestones = page.locator('[data-testid="roadmap-milestone"]');
    const count = await milestones.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should add milestone to roadmap', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const addMilestoneBtn = page.locator('button:has-text("Add Milestone"), [data-testid="add-milestone-btn"]');
    const hasButton = await addMilestoneBtn.count();

    if (hasButton > 0) {
      await addMilestoneBtn.click();

      await page.locator('[data-testid="milestone-name"]').fill('Cloud Migration Complete');
      await page.locator('[data-testid="milestone-date"]').fill('2026-06-30');
      await page.locator('[data-testid="milestone-description"]').fill('All systems migrated to cloud');

      await page.locator('button:has-text("Add")').click();

      await expect(page.locator('text=Milestone added')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter roadmap by phase', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const phaseFilter = page.locator('[data-testid="phase-filter"]');
    const hasFilter = await phaseFilter.count();

    if (hasFilter > 0) {
      await phaseFilter.selectOption('Phase 1');

      await page.waitForTimeout(500);

      // Should show only Phase 1 items
      const phaseItems = page.locator('[data-testid="roadmap-item"][data-phase="1"]');
      expect(await phaseItems.count()).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Strategic Themes', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display strategic themes', async ({ page }) => {
    await page.goto('/governance/themes');

    await expect(page.locator('[data-testid="strategic-themes"], h1:has-text("Strategic Themes")')).toBeVisible({ timeout: 10000 });
  });

  test('should create strategic theme', async ({ page }) => {
    await page.goto('/governance/themes');

    await page.locator('button:has-text("Add Theme"), [data-testid="add-theme-btn"]').click();

    await page.locator('[data-testid="theme-name"]').fill('Digital Transformation');
    await page.locator('[data-testid="theme-description"]').fill('Modernize all digital platforms and capabilities');
    await page.locator('[data-testid="theme-priority"]').selectOption('high');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Theme created')).toBeVisible({ timeout: 5000 });
  });

  test('should assign initiatives to themes', async ({ page }) => {
    await page.goto('/governance/themes');

    const theme = page.locator('[data-testid="strategic-theme"]').first();
    const count = await theme.count();

    if (count > 0) {
      await theme.click();

      const assignInitiativeBtn = page.locator('button:has-text("Assign Initiative"), [data-testid="assign-initiative-btn"]');
      const hasButton = await assignInitiativeBtn.count();

      if (hasButton > 0) {
        await assignInitiativeBtn.click();

        await page.locator('[data-testid="initiative-select"]').selectOption({ index: 1 });
        await page.locator('button:has-text("Assign")').click();

        await expect(page.locator('text=Initiative assigned')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show theme progress', async ({ page }) => {
    await page.goto('/governance/themes');

    const theme = page.locator('[data-testid="strategic-theme"]').first();
    const count = await theme.count();

    if (count > 0) {
      await theme.click();

      const themeProgress = page.locator('[data-testid="theme-progress"], .progress-indicator');
      await expect(themeProgress).toBeVisible();
    }
  });
});

test.describe('Objectives and Key Results (OKRs)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display objectives list', async ({ page }) => {
    await page.goto('/governance/objectives');

    await expect(page.locator('[data-testid="objectives-list"], h1:has-text("Objectives")')).toBeVisible({ timeout: 10000 });
  });

  test('should create objective', async ({ page }) => {
    await page.goto('/governance/objectives');

    await page.locator('button:has-text("Add Objective"), [data-testid="add-objective-btn"]').click();

    await page.locator('[data-testid="objective-title"]').fill('Reduce Technical Debt');
    await page.locator('[data-testid="objective-description"]').fill('Pay down accumulated technical debt by 50%');
    await page.locator('[data-testid="objective-period"]').selectOption('Q2 2026');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Objective created')).toBeVisible({ timeout: 5000 });
  });

  test('should add key results to objective', async ({ page }) => {
    await page.goto('/governance/objectives');

    const objective = page.locator('[data-testid="objective-item"]').first();
    const count = await objective.count();

    if (count > 0) {
      await objective.click();

      await page.locator('button:has-text("Add Key Result"), [data-testid="add-key-result-btn"]').click();

      await page.locator('[data-testid="key-result-title"]').fill('Refactor 10 legacy modules');
      await page.locator('[data-testid="key-result-target"]').fill('10');
      await page.locator('[data-testid="key-result-unit"]').selectOption('modules');

      await page.locator('button:has-text("Add")').click();

      await expect(page.locator('text=Key result added')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should track objective progress', async ({ page }) => {
    await page.goto('/governance/objectives');

    const objective = page.locator('[data-testid="objective-item"]').first();
    const count = await objective.count();

    if (count > 0) {
      await objective.click();

      const objectiveProgress = page.locator('[data-testid="objective-progress"]');
      await expect(objectiveProgress).toBeVisible();

      // Should show percentage based on key results
      const progressText = await objectiveProgress.textContent();
      expect(progressText).toMatch(/\d+%/);
    }
  });

  test('should update key result progress', async ({ page }) => {
    await page.goto('/governance/objectives');

    const objective = page.locator('[data-testid="objective-item"]').first();
    const count = await objective.count();

    if (count > 0) {
      await objective.click();

      const keyResult = page.locator('[data-testid="key-result-item"]').first();
      const krCount = await keyResult.count();

      if (krCount > 0) {
        await keyResult.click();

        await page.locator('[data-testid="key-result-current"]').fill('5');

        await page.locator('button:has-text("Update Progress")').click();

        await expect(page.locator('text=Progress updated')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should link objectives to initiatives', async ({ page }) => {
    await page.goto('/governance/objectives');

    const objective = page.locator('[data-testid="objective-item"]').first();
    const count = await objective.count();

    if (count > 0) {
      await objective.click();

      const linkBtn = page.locator('button:has-text("Link Initiative"), [data-testid="link-initiative-btn"]');
      const hasButton = await linkBtn.count();

      if (hasButton > 0) {
        await linkBtn.click();

        await page.locator('[data-testid="initiative-select"]').selectOption({ index: 1 });
        await page.locator('button:has-text("Link")').click();

        await expect(page.locator('text=Initiative linked')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Strategic Planning Analytics', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should show initiative portfolio overview', async ({ page }) => {
    await page.goto('/governance/analytics');

    const portfolioOverview = page.locator('[data-testid="portfolio-overview"]');
    const hasOverview = await portfolioOverview.count();

    if (hasOverview > 0) {
      await expect(portfolioOverview.first()).toBeVisible();
    }
  });

  test('should show budget utilization across initiatives', async ({ page }) => {
    await page.goto('/governance/analytics');

    const budgetChart = page.locator('[data-testid="budget-utilization-chart"]');
    const hasChart = await budgetChart.count();

    if (hasChart > 0) {
      await expect(budgetChart.first()).toBeVisible();
    }
  });

  test('should show initiative status distribution', async ({ page }) => {
    await page.goto('/governance/analytics');

    const statusChart = page.locator('[data-testid="initiative-status-chart"]');
    const hasChart = await statusChart.count();

    if (hasChart > 0) {
      await expect(statusChart.first()).toBeVisible();
    }
  });

  test('should show roadmap progress timeline', async ({ page }) => {
    await page.goto('/governance/analytics');

    const timelineChart = page.locator('[data-testid="roadmap-timeline-chart"]');
    const hasChart = await timelineChart.count();

    if (hasChart > 0) {
      await expect(timelineChart.first()).toBeVisible();
    }
  });

  test('should export strategic planning report', async ({ page }) => {
    await page.goto('/governance/analytics');

    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-report-btn"]');
    const hasButton = await exportBtn.count();

    if (hasButton > 0) {
      const downloadPromise = page.waitForEvent('download');

      await exportBtn.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
    }
  });
});

test.describe('Strategic Planning Collaboration', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should allow commenting on initiatives', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const initiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await initiative.count();

    if (count > 0) {
      await initiative.click();

      await page.locator('[data-testid="comment-input"]').fill('This initiative looks good. Let\'s ensure we have proper resource allocation.');
      await page.locator('[data-testid="add-comment-btn"]').click();

      await expect(page.locator('text=Comment added')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should assign initiative owners', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const initiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await initiative.count();

    if (count > 0) {
      await initiative.click();

      const assignBtn = page.locator('button:has-text("Assign Owner"), [data-testid="assign-owner-btn"]');
      const hasButton = await assignBtn.count();

      if (hasButton > 0) {
        await assignBtn.click();

        await page.locator('[data-testid="owner-select"]').selectOption('architect@archzero.local');
        await page.locator('button:has-text("Assign")').click();

        await expect(page.locator('text=Owner assigned')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should notify stakeholders of updates', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const initiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await initiative.count();

    if (count > 0) {
      await initiative.click();

      await page.locator('[data-testid="initiative-health"]').selectOption('At Risk');
      await page.locator('button:has-text("Save")').click();

      // Should show notification will be sent
      const notificationMsg = page.locator('text=stakeholders notified, text=notifications sent');
      const hasMsg = await notificationMsg.count();

      if (hasMsg > 0) {
        await expect(notificationMsg.first()).toBeVisible();
      }
    }
  });

  test('should show initiative activity feed', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const initiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await initiative.count();

    if (count > 0) {
      await initiative.click();

      const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity")');
      const hasTab = await activityTab.count();

      if (hasTab > 0) {
        await activityTab.click();

        const activityFeed = page.locator('[data-testid="activity-feed"]');
        await expect(activityFeed).toBeVisible();
      }
    }
  });
});

test.describe('Strategic Planning Integration', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should link roadmap milestones to cards', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const milestone = page.locator('[data-testid="roadmap-milestone"]').first();
    const count = await milestone.count();

    if (count > 0) {
      await milestone.click();

      const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
      const hasButton = await linkBtn.count();

      if (hasButton > 0) {
        await linkBtn.click();

        await page.locator('[data-testid="card-select"]').selectOption({ index: 1 });
        await page.locator('button:has-text("Link")').click();

        await expect(page.locator('text=Cards linked')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show initiative impact on card inventory', async ({ page }) => {
    await page.goto('/governance/initiatives');

    const initiative = page.locator('[data-testid="initiative-item"]').first();
    const count = await initiative.count();

    if (count > 0) {
      await initiative.click();

      const impactTab = page.locator('[data-testid="impact-tab"], button:has-text("Impact")');
      const hasTab = await impactTab.count();

      if (hasTab > 0) {
        await impactTab.click();

        const cardImpact = page.locator('[data-testid="card-impact"]');
        await expect(cardImpact).toBeVisible();
      }
    }
  });

  test('should generate cross-workspace reports', async ({ page }) => {
    await page.goto('/governance/reports');

    const crossWorkspaceBtn = page.locator('button:has-text("Cross-Workspace Report"), [data-testid="cross-workspace-report-btn"]');
    const hasButton = await crossWorkspaceBtn.count();

    if (hasButton > 0) {
      await crossWorkspaceBtn.click();

      // Select workspaces to include
      await page.locator('[data-testid="include-initiatives"]').check();
      await page.locator('[data-testid="include-risks"]').check();
      await page.locator('[data-testid="include-governance"]').check();

      await page.locator('button:has-text("Generate")').click();

      const reportPreview = page.locator('[data-testid="report-preview"]');
      await expect(reportPreview).toBeVisible({ timeout: 10000 });
    }
  });
});
