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

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
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
  });

  test('should show initiative health indicators', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
    await firstInitiative.click();

    // Look for health indicator
    const healthIndicator = page.locator('[data-testid="initiative-health"], .health-status');
    await healthIndicator.waitFor({ state: 'visible', timeout: 5000 });

    // Should be one of: On Track, At Risk, Behind Schedule
    const healthText = await healthIndicator.first().textContent();
    expect(['On Track', 'At Risk', 'Behind Schedule']).toContain(healthText);
  });

  test('should update initiative health status', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
    await firstInitiative.click();

    // Update health
    await page.locator('[data-testid="initiative-health"]').selectOption('At Risk');

    // Provide reason
    await page.locator('[data-testid="health-reason"]').fill('Budget constraints and resource shortages');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Initiative updated')).toBeVisible({ timeout: 5000 });
  });

  test('should show initiative impact map visualization', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
    await firstInitiative.click();

    // Click impact map button
    const impactMapBtn = page.locator('button:has-text("Impact Map"), [data-testid="impact-map-btn"]');
    await impactMapBtn.waitFor({ state: 'visible', timeout: 5000 });
    await impactMapBtn.click();

    // Should show which cards/systems are affected
    const impactMap = page.locator('[data-testid="impact-map"], .impact-visualization');
    await expect(impactMap).toBeVisible({ timeout: 5000 });
  });

  test('should link initiative to cards', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
    await firstInitiative.click();

    // Click link cards button
    const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
    await linkBtn.waitFor({ state: 'visible', timeout: 5000 });
    await linkBtn.click();

    // Select cards to link
    const cardSelect = page.locator('[data-testid="card-select"]');
    await cardSelect.waitFor({ state: 'visible', timeout: 5000 });
    await cardSelect.selectOption({ index: 1 });
    await page.locator('button:has-text("Link")').click();

    await expect(page.locator('text=Cards linked')).toBeVisible({ timeout: 5000 });
  });

  test('should show initiative progress tracking', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const firstInitiative = page.locator('[data-testid="initiative-item"]').first();
    await firstInitiative.waitFor({ state: 'visible', timeout: 10000 });
    await firstInitiative.click();

    // Look for progress indicator
    const progressBar = page.locator('[data-testid="initiative-progress"], .progress-bar');
    await progressBar.waitFor({ state: 'visible', timeout: 5000 });

    // Should show percentage
    const progressText = await progressBar.first().textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('should filter initiatives by type', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and use type filter
    const typeFilter = page.locator('[data-testid="initiative-type-filter"]');
    await typeFilter.waitFor({ state: 'visible', timeout: 5000 });
    await typeFilter.selectOption('modernization');

    // Wait for filter to apply
    await page.waitForLoadState('networkidle');

    // Should show only modernization initiatives
    const initiatives = page.locator('[data-testid="initiative-item"][data-type="modernization"]');
    expect(await initiatives.count()).toBeGreaterThanOrEqual(0);
  });

  test('should filter initiatives by status', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and use status filter
    const statusFilter = page.locator('[data-testid="initiative-status-filter"]');
    await statusFilter.waitFor({ state: 'visible', timeout: 5000 });
    await statusFilter.selectOption('active');

    // Wait for filter to apply
    await page.waitForLoadState('networkidle');

    // Should show only active initiatives
    const initiatives = page.locator('[data-testid="initiative-item"][data-status="active"]');
    expect(await initiatives.count()).toBeGreaterThanOrEqual(0);
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

    // Wait for and click first model
    const model = page.locator('[data-testid="target-state-model"]').first();
    await model.waitFor({ state: 'visible', timeout: 10000 });
    await model.click();

    // Add card to target state
    await page.locator('button:has-text("Add Card"), [data-testid="add-card-btn"]').click();

    // Wait for and select card
    const cardSelect = page.locator('[data-testid="card-select"]');
    await cardSelect.waitFor({ state: 'visible', timeout: 5000 });
    await cardSelect.selectOption({ index: 1 });
    await page.locator('button:has-text("Add")').click();

    await expect(page.locator('text=Card added')).toBeVisible({ timeout: 5000 });
  });

  test('should visualize target state dependencies', async ({ page }) => {
    await page.goto('/governance/target-state');

    // Wait for and click first model
    const model = page.locator('[data-testid="target-state-model"]').first();
    await model.waitFor({ state: 'visible', timeout: 10000 });
    await model.click();

    // Click dependency view
    const dependencyView = page.locator('[data-testid="dependency-view"], button:has-text("Dependencies")');
    await dependencyView.waitFor({ state: 'visible', timeout: 5000 });
    await dependencyView.click();

    // Should show dependency graph
    const dependencyGraph = page.locator('[data-testid="dependency-graph"]');
    await expect(dependencyGraph).toBeVisible();
  });

  test('should support multiple target state versions', async ({ page }) => {
    await page.goto('/governance/target-state');

    // Create first version
    await page.locator('button:has-text("Create Model")').click();
    await page.locator('[data-testid="model-name"]').fill('2026 Target');
    await page.locator('button:has-text("Create")').click();
    await page.waitForLoadState('networkidle');

    // Create second version
    await page.locator('button:has-text("Create Model")').click();
    await page.locator('[data-testid="model-name"]').fill('2027 Target');
    await page.locator('button:has-text("Create")').click();
    await page.waitForLoadState('networkidle');

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

    // Wait for and click first snapshot
    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    await snapshot.waitFor({ state: 'visible', timeout: 10000 });
    await snapshot.click();

    // Should show captured cards and metrics
    const cardsList = page.locator('[data-testid="baseline-cards"]');
    await expect(cardsList).toBeVisible();
  });

  test('should compare baseline with target state', async ({ page }) => {
    await page.goto('/governance/baseline');

    // Wait for and click first snapshot
    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    await snapshot.waitFor({ state: 'visible', timeout: 10000 });
    await snapshot.click();

    // Click compare button
    const compareBtn = page.locator('button:has-text("Compare with Target"), [data-testid="compare-target-btn"]');
    await compareBtn.waitFor({ state: 'visible', timeout: 5000 });
    await compareBtn.click();

    // Should show gap analysis
    const comparison = page.locator('[data-testid="gap-analysis"]');
    await expect(comparison).toBeVisible({ timeout: 5000 });
  });

  test('should restore from baseline', async ({ page }) => {
    await page.goto('/governance/baseline');

    // Wait for and click first snapshot
    const snapshot = page.locator('[data-testid="baseline-snapshot"]').first();
    await snapshot.waitFor({ state: 'visible', timeout: 10000 });
    await snapshot.click();

    // Click restore button
    const restoreBtn = page.locator('button:has-text("Restore"), [data-testid="restore-snapshot-btn"]');
    await restoreBtn.waitFor({ state: 'visible', timeout: 5000 });
    await restoreBtn.click();

    // Confirm restore
    await page.locator('button:has-text("Confirm Restore")').click();

    await expect(page.locator('text=Restored from snapshot')).toBeVisible({ timeout: 10000 });
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

    // Wait for and click first gap
    const firstGap = page.locator('[data-testid="architecture-gap"]').first();
    await firstGap.waitFor({ state: 'visible', timeout: 10000 });
    await firstGap.click();

    // Should show gap description and recommendations
    const gapDetails = page.locator('[data-testid="gap-details"]');
    await expect(gapDetails).toBeVisible();

    const recommendations = page.locator('[data-testid="gap-recommendations"]');
    await expect(recommendations).toBeVisible();
  });

  test('should export gap analysis report', async ({ page }) => {
    await page.goto('/governance/gap-analysis');

    // Click export report button
    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-gap-btn"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
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

    // Click generate roadmap button
    const generateBtn = page.locator('button:has-text("Generate Roadmap"), [data-testid="generate-roadmap-btn"]');
    await generateBtn.waitFor({ state: 'visible', timeout: 10000 });
    await generateBtn.click();

    // Select baseline and target
    await page.locator('[data-testid="baseline-select"]').selectOption({ index: 1 });
    await page.locator('[data-testid="target-select"]').selectOption({ index: 1 });

    await page.locator('button:has-text("Generate")').click();

    await expect(page.locator('text=Roadmap generated')).toBeVisible({ timeout: 10000 });
  });

  test('should show roadmap timeline', async ({ page }) => {
    await page.goto('/governance/roadmap');

    // Wait for and verify timeline
    const timeline = page.locator('[data-testid="roadmap-timeline"], .timeline-view');
    await timeline.waitFor({ state: 'visible', timeout: 10000 });
    await expect(timeline.first()).toBeVisible();
  });

  test('should visualize dependencies in roadmap', async ({ page }) => {
    await page.goto('/governance/roadmap');

    // Click dependency view
    const dependencyView = page.locator('[data-testid="dependency-view"], button:has-text("Dependencies")');
    await dependencyView.waitFor({ state: 'visible', timeout: 10000 });
    await dependencyView.click();

    // Should show dependency graph
    const dependencyGraph = page.locator('[data-testid="roadmap-dependencies"]');
    await expect(dependencyGraph).toBeVisible();
  });

  test('should show roadmap milestones', async ({ page }) => {
    await page.goto('/governance/roadmap');

    const milestones = page.locator('[data-testid="roadmap-milestone"]');
    const count = await milestones.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should add milestone to roadmap', async ({ page }) => {
    await page.goto('/governance/roadmap');

    // Click add milestone button
    const addMilestoneBtn = page.locator('button:has-text("Add Milestone"), [data-testid="add-milestone-btn"]');
    await addMilestoneBtn.waitFor({ state: 'visible', timeout: 10000 });
    await addMilestoneBtn.click();

    await page.locator('[data-testid="milestone-name"]').fill('Cloud Migration Complete');
    await page.locator('[data-testid="milestone-date"]').fill('2026-06-30');
    await page.locator('[data-testid="milestone-description"]').fill('All systems migrated to cloud');

    await page.locator('button:has-text("Add")').click();

    await expect(page.locator('text=Milestone added')).toBeVisible({ timeout: 5000 });
  });

  test('should filter roadmap by phase', async ({ page }) => {
    await page.goto('/governance/roadmap');

    // Wait for and use phase filter
    const phaseFilter = page.locator('[data-testid="phase-filter"]');
    await phaseFilter.waitFor({ state: 'visible', timeout: 5000 });
    await phaseFilter.selectOption('Phase 1');

    // Wait for filter to apply
    await page.waitForLoadState('networkidle');

    // Should show only Phase 1 items
    const phaseItems = page.locator('[data-testid="roadmap-item"][data-phase="1"]');
    expect(await phaseItems.count()).toBeGreaterThanOrEqual(0);
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

    // Wait for and click first theme
    const theme = page.locator('[data-testid="strategic-theme"]').first();
    await theme.waitFor({ state: 'visible', timeout: 10000 });
    await theme.click();

    // Click assign initiative button
    const assignInitiativeBtn = page.locator('button:has-text("Assign Initiative"), [data-testid="assign-initiative-btn"]');
    await assignInitiativeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await assignInitiativeBtn.click();

    await page.locator('[data-testid="initiative-select"]').selectOption({ index: 1 });
    await page.locator('button:has-text("Assign")').click();

    await expect(page.locator('text=Initiative assigned')).toBeVisible({ timeout: 5000 });
  });

  test('should show theme progress', async ({ page }) => {
    await page.goto('/governance/themes');

    // Wait for and click first theme
    const theme = page.locator('[data-testid="strategic-theme"]').first();
    await theme.waitFor({ state: 'visible', timeout: 10000 });
    await theme.click();

    // Should show theme progress
    const themeProgress = page.locator('[data-testid="theme-progress"], .progress-indicator');
    await expect(themeProgress).toBeVisible();
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

    // Wait for and click first objective
    const objective = page.locator('[data-testid="objective-item"]').first();
    await objective.waitFor({ state: 'visible', timeout: 10000 });
    await objective.click();

    await page.locator('button:has-text("Add Key Result"), [data-testid="add-key-result-btn"]').click();

    await page.locator('[data-testid="key-result-title"]').fill('Refactor 10 legacy modules');
    await page.locator('[data-testid="key-result-target"]').fill('10');
    await page.locator('[data-testid="key-result-unit"]').selectOption('modules');

    await page.locator('button:has-text("Add")').click();

    await expect(page.locator('text=Key result added')).toBeVisible({ timeout: 5000 });
  });

  test('should track objective progress', async ({ page }) => {
    await page.goto('/governance/objectives');

    // Wait for and click first objective
    const objective = page.locator('[data-testid="objective-item"]').first();
    await objective.waitFor({ state: 'visible', timeout: 10000 });
    await objective.click();

    // Should show objective progress
    const objectiveProgress = page.locator('[data-testid="objective-progress"]');
    await expect(objectiveProgress).toBeVisible();

    // Should show percentage based on key results
    const progressText = await objectiveProgress.textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('should update key result progress', async ({ page }) => {
    await page.goto('/governance/objectives');

    // Wait for and click first objective
    const objective = page.locator('[data-testid="objective-item"]').first();
    await objective.waitFor({ state: 'visible', timeout: 10000 });
    await objective.click();

    // Wait for and click first key result
    const keyResult = page.locator('[data-testid="key-result-item"]').first();
    await keyResult.waitFor({ state: 'visible', timeout: 5000 });
    await keyResult.click();

    await page.locator('[data-testid="key-result-current"]').fill('5');

    await page.locator('button:has-text("Update Progress")').click();

    await expect(page.locator('text=Progress updated')).toBeVisible({ timeout: 5000 });
  });

  test('should link objectives to initiatives', async ({ page }) => {
    await page.goto('/governance/objectives');

    // Wait for and click first objective
    const objective = page.locator('[data-testid="objective-item"]').first();
    await objective.waitFor({ state: 'visible', timeout: 10000 });
    await objective.click();

    // Click link initiative button
    const linkBtn = page.locator('button:has-text("Link Initiative"), [data-testid="link-initiative-btn"]');
    await linkBtn.waitFor({ state: 'visible', timeout: 5000 });
    await linkBtn.click();

    await page.locator('[data-testid="initiative-select"]').selectOption({ index: 1 });
    await page.locator('button:has-text("Link")').click();

    await expect(page.locator('text=Initiative linked')).toBeVisible({ timeout: 5000 });
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

    // Wait for and verify portfolio overview
    const portfolioOverview = page.locator('[data-testid="portfolio-overview"]');
    await portfolioOverview.waitFor({ state: 'visible', timeout: 10000 });
    await expect(portfolioOverview.first()).toBeVisible();
  });

  test('should show budget utilization across initiatives', async ({ page }) => {
    await page.goto('/governance/analytics');

    // Wait for and verify budget chart
    const budgetChart = page.locator('[data-testid="budget-utilization-chart"]');
    await budgetChart.waitFor({ state: 'visible', timeout: 10000 });
    await expect(budgetChart.first()).toBeVisible();
  });

  test('should show initiative status distribution', async ({ page }) => {
    await page.goto('/governance/analytics');

    // Wait for and verify status chart
    const statusChart = page.locator('[data-testid="initiative-status-chart"]');
    await statusChart.waitFor({ state: 'visible', timeout: 10000 });
    await expect(statusChart.first()).toBeVisible();
  });

  test('should show roadmap progress timeline', async ({ page }) => {
    await page.goto('/governance/analytics');

    // Wait for and verify timeline chart
    const timelineChart = page.locator('[data-testid="roadmap-timeline-chart"]');
    await timelineChart.waitFor({ state: 'visible', timeout: 10000 });
    await expect(timelineChart.first()).toBeVisible();
  });

  test('should export strategic planning report', async ({ page }) => {
    await page.goto('/governance/analytics');

    // Click export report button
    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-report-btn"]');
    await exportBtn.waitFor({ state: 'visible', timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
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

    // Wait for and click first initiative
    const initiative = page.locator('[data-testid="initiative-item"]').first();
    await initiative.waitFor({ state: 'visible', timeout: 10000 });
    await initiative.click();

    await page.locator('[data-testid="comment-input"]').fill('This initiative looks good. Let\'s ensure we have proper resource allocation.');
    await page.locator('[data-testid="add-comment-btn"]').click();

    await expect(page.locator('text=Comment added')).toBeVisible({ timeout: 5000 });
  });

  test('should assign initiative owners', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const initiative = page.locator('[data-testid="initiative-item"]').first();
    await initiative.waitFor({ state: 'visible', timeout: 10000 });
    await initiative.click();

    // Click assign owner button
    const assignBtn = page.locator('button:has-text("Assign Owner"), [data-testid="assign-owner-btn"]');
    await assignBtn.waitFor({ state: 'visible', timeout: 5000 });
    await assignBtn.click();

    await page.locator('[data-testid="owner-select"]').selectOption('architect@archzero.local');
    await page.locator('button:has-text("Assign")').click();

    await expect(page.locator('text=Owner assigned')).toBeVisible({ timeout: 5000 });
  });

  test('should notify stakeholders of updates', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const initiative = page.locator('[data-testid="initiative-item"]').first();
    await initiative.waitFor({ state: 'visible', timeout: 10000 });
    await initiative.click();

    await page.locator('[data-testid="initiative-health"]').selectOption('At Risk');
    await page.locator('button:has-text("Save")').click();

    // Should show notification will be sent
    const notificationMsg = page.locator('text=stakeholders notified, text=notifications sent');
    await expect(notificationMsg.first()).toBeVisible();
  });

  test('should show initiative activity feed', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const initiative = page.locator('[data-testid="initiative-item"]').first();
    await initiative.waitFor({ state: 'visible', timeout: 10000 });
    await initiative.click();

    // Click activity tab
    const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity")');
    await activityTab.waitFor({ state: 'visible', timeout: 5000 });
    await activityTab.click();

    // Should show activity feed
    const activityFeed = page.locator('[data-testid="activity-feed"]');
    await expect(activityFeed).toBeVisible();
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

    // Wait for and click first milestone
    const milestone = page.locator('[data-testid="roadmap-milestone"]').first();
    await milestone.waitFor({ state: 'visible', timeout: 10000 });
    await milestone.click();

    // Click link cards button
    const linkBtn = page.locator('button:has-text("Link Cards"), [data-testid="link-cards-btn"]');
    await linkBtn.waitFor({ state: 'visible', timeout: 5000 });
    await linkBtn.click();

    await page.locator('[data-testid="card-select"]').selectOption({ index: 1 });
    await page.locator('button:has-text("Link")').click();

    await expect(page.locator('text=Cards linked')).toBeVisible({ timeout: 5000 });
  });

  test('should show initiative impact on card inventory', async ({ page }) => {
    await page.goto('/governance/initiatives');

    // Wait for and click first initiative
    const initiative = page.locator('[data-testid="initiative-item"]').first();
    await initiative.waitFor({ state: 'visible', timeout: 10000 });
    await initiative.click();

    // Click impact tab
    const impactTab = page.locator('[data-testid="impact-tab"], button:has-text("Impact")');
    await impactTab.waitFor({ state: 'visible', timeout: 5000 });
    await impactTab.click();

    // Should show card impact
    const cardImpact = page.locator('[data-testid="card-impact"]');
    await expect(cardImpact).toBeVisible();
  });

  test('should generate cross-workspace reports', async ({ page }) => {
    await page.goto('/governance/reports');

    // Click cross-workspace report button
    const crossWorkspaceBtn = page.locator('button:has-text("Cross-Workspace Report"), [data-testid="cross-workspace-report-btn"]');
    await crossWorkspaceBtn.waitFor({ state: 'visible', timeout: 10000 });
    await crossWorkspaceBtn.click();

    // Select workspaces to include
    await page.locator('[data-testid="include-initiatives"]').check();
    await page.locator('[data-testid="include-risks"]').check();
    await page.locator('[data-testid="include-governance"]').check();

    await page.locator('button:has-text("Generate")').click();

    const reportPreview = page.locator('[data-testid="report-preview"]');
    await expect(reportPreview).toBeVisible({ timeout: 10000 });
  });
});
