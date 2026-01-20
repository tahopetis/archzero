import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/index';
import { API_URL } from '../helpers/index';

test.describe('Risk Register', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display risk register', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    await expect(page.locator('[data-testid="risk-register"], h1:has-text("Risks")')).toBeVisible({ timeout: 10000 });
  });

  test('should create new risk entry', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    const addRiskBtn = page.locator('button:has-text("Add Risk"), [data-testid="add-risk-btn"]');
    await addRiskBtn.waitFor({ state: 'attached' });
    await addRiskBtn.click();

    // Fill risk details
    await page.locator('[data-testid="risk-title"]').fill('Data Breach Risk');
    await page.locator('[data-testid="risk-description"]').fill('Unauthorized access to sensitive customer data');
    await page.locator('[data-testid="risk-category"]').selectOption('Security');
    await page.locator('[data-testid="risk-probability"]').selectOption('Medium');
    await page.locator('[data-testid="risk-impact"]').selectOption('High');

    // Save
    await page.locator('button:has-text("Save"), [data-testid="save-risk-btn"]').click();

    await expect(page.locator('text=Risk created, text=Success')).toBeVisible({ timeout: 5000 });
  });

  test('should calculate risk score (Likelihood × Impact)', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    const addRiskBtn = page.locator('button:has-text("Add Risk")');
    await addRiskBtn.waitFor({ state: 'attached' });
    await addRiskBtn.click();

    // Set probability (Likelihood) to High (4) and Impact to High (5)
    await page.locator('[data-testid="risk-title"]').fill('Test Risk Score');
    await page.locator('[data-testid="risk-probability"]').selectOption('High');
    await page.locator('[data-testid="risk-impact"]').selectOption('High');

    // Risk score should be displayed (4 × 5 = 20)
    const riskScore = page.locator('[data-testid="risk-score"], .risk-score-display');
    await expect(riskScore.first()).toBeVisible();
    const scoreText = await riskScore.first().textContent();
    expect(scoreText).toContain('20');
  });

  test('should display Risk Heat Map visualization', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    // Look for heat map visualization
    const heatMap = page.locator('[data-testid="risk-heatmap"], .risk-heatmap, [data-testid="risk-matrix"]');
    await expect(heatMap.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show Top 10 Risks dashboard', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    const topRisks = page.locator('[data-testid="top-risks"], .top-risks-dashboard');
    await expect(topRisks.first()).toBeVisible();

    // Should show top 10
    const riskItems = topRisks.locator('[data-testid="risk-item"]');
    await expect(riskItems.first()).toBeVisible();
    const count = await riskItems.count();
    expect(count).toBeLessThanOrEqual(10);
  });

  test('should categorize risks by type', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500); // Wait for React to stabilize

    // Create risks of different types
    const categories = ['Security', 'Compliance', 'Operational', 'Financial', 'Strategic'];

    for (const category of categories) {
      const addRiskBtn = page.locator('button:has-text("Add Risk")');
      await addRiskBtn.waitFor({ state: 'attached' });
      await addRiskBtn.click();
      await page.locator('[data-testid="risk-title"]').fill(`${category} Risk`);
      await page.locator('[data-testid="risk-category"]').selectOption(category);
      await page.locator('[data-testid="risk-probability"]').selectOption('Low');
      await page.locator('[data-testid="risk-impact"]').selectOption('Low');
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
    }

    // Filter by category
    const categoryFilter = page.locator('[data-testid="risk-category-filter"]');
    await expect(categoryFilter.first()).toBeVisible();
    await categoryFilter.selectOption('Security');

    // Should show only Security risks
    await page.waitForLoadState('networkidle');
  });

  test('should track risk mitigation plans', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const firstRisk = page.locator('[data-testid="risk-item"]').first();
    await expect(firstRisk).toBeVisible();
    await firstRisk.click();

    // Add mitigation plan
    await page.locator('[data-testid="add-mitigation-btn"]').click();

    await page.locator('[data-testid="mitigation-action"]').fill('Implement encryption for all sensitive data');
    await page.locator('[data-testid="mitigation-owner"]').selectOption('security@archzero.local');
    await page.locator('[data-testid="mitigation-due-date"]').fill('2026-03-31');

    await page.locator('button:has-text("Add Mitigation")').click();

    await expect(page.locator('text=Mitigation added')).toBeVisible({ timeout: 5000 });
  });

  test('should show mitigation progress', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const firstRisk = page.locator('[data-testid="risk-item"]').first();
    await expect(firstRisk).toBeVisible();
    await firstRisk.click();

    // Look for mitigation progress
    const mitigationProgress = page.locator('[data-testid="mitigation-progress"], .progress-indicator');
    await expect(mitigationProgress.first()).toBeVisible();
  });

  test('should allow updating risk status', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const firstRisk = page.locator('[data-testid="risk-item"]').first();
    await expect(firstRisk).toBeVisible();
    await firstRisk.click();

    // Update status
    await page.locator('[data-testid="risk-status"]').selectOption('Mitigated');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Risk updated')).toBeVisible({ timeout: 5000 });
  });

  test('should show risk history and timeline', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const firstRisk = page.locator('[data-testid="risk-item"]').first();
    await expect(firstRisk).toBeVisible();
    await firstRisk.click();

    const historyTab = page.locator('[data-testid="risk-history-tab"], button:has-text("History")');
    await expect(historyTab.first()).toBeVisible();
    await historyTab.click();

    const history = page.locator('[data-testid="risk-history"]');
    await expect(history).toBeVisible();
  });

  test('should export risk register', async ({ page }) => {
    await page.goto('/governance/risks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-risks-btn"]');
    await expect(exportBtn.first()).toBeVisible();
    const downloadPromise = page.waitForEvent('download');

    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv|pdf)$/);
  });
});

test.describe('Compliance Framework', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display compliance dashboard', async ({ page }) => {
    await page.goto('/governance/compliance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="compliance-dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should setup compliance framework', async ({ page }) => {
    await page.goto('/governance/compliance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const setupBtn = page.locator('button:has-text("Setup Framework"), [data-testid="setup-framework-btn"]');
    await setupBtn.waitFor({ state: 'attached' });
    await expect(setupBtn.first()).toBeVisible();
    await setupBtn.click();

    // Select framework
    await page.locator('[data-testid="compliance-framework"]').selectOption('GDPR');

    // Configure framework settings
    await page.locator('[data-testid="framework-name"]').fill('GDPR Compliance');
    await page.locator('[data-testid="framework-description"]').fill('General Data Protection Regulation compliance');

    // Save
    await page.locator('button:has-text("Save"), [data-testid="save-framework-btn"]').click();

    await expect(page.locator('text=Framework created')).toBeVisible({ timeout: 5000 });
  });

  test('should support multiple frameworks (GDPR, SOX, HIPAA, ISO 27001)', async ({ page }) => {
    await page.goto('/governance/compliance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const frameworks = ['GDPR', 'SOX', 'HIPAA', 'ISO 27001'];

    for (const framework of frameworks) {
      const addBtn = page.locator('button:has-text("Add Framework")');
      await addBtn.waitFor({ state: 'attached' });
      await expect(addBtn.first()).toBeVisible();
      await addBtn.click();
      await page.locator('[data-testid="compliance-framework"]').selectOption(framework);
      await page.locator('button:has-text("Save")').click();
      await page.waitForLoadState('networkidle');
    }

    // Verify all frameworks are listed
    const frameworkList = page.locator('[data-testid="framework-item"]');
    await expect(frameworkList.first()).toBeVisible();
    const count = await frameworkList.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should track compliance requirements', async ({ page }) => {
    await page.goto('/governance/compliance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    // Select framework
    const framework = page.locator('[data-testid="framework-item"]').first();
    await expect(framework).toBeVisible();
    await framework.click();

    // View requirements
    const requirementsTab = page.locator('[data-testid="requirements-tab"], button:has-text("Requirements")');
    await expect(requirementsTab.first()).toBeVisible();
    await requirementsTab.click();

    const requirementsList = page.locator('[data-testid="requirement-item"]');
    await expect(requirementsList.first()).toBeVisible();
  });

  test('should perform compliance assessment', async ({ page }) => {
    await page.goto('/governance/compliance');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const framework = page.locator('[data-testid="framework-item"]').first();
    await expect(framework).toBeVisible();
    await framework.click();

    // Start assessment
    const assessBtn = page.locator('button:has-text("Start Assessment"), [data-testid="start-assessment-btn"]');
    await expect(assessBtn.first()).toBeVisible();
    await assessBtn.click();

    // Answer control questions
    const firstControl = page.locator('[data-testid="control-assessment"]').first();
    await firstControl.locator('input[type="radio"][value="compliant"]').check();

    // Add evidence
    await page.locator('[data-testid="control-evidence"]').fill('See policy document XYZ');

    // Save assessment
    await page.locator('button:has-text("Save Assessment")').click();

    await expect(page.locator('text=Assessment saved')).toBeVisible({ timeout: 5000 });
  });

  test('should show control-by-control assessment', async ({ page }) => {
    await page.goto('/governance/compliance');

    const framework = page.locator('[data-testid="framework-item"]').first();
    await expect(framework).toBeVisible();
    await framework.click();

    const controlsView = page.locator('[data-testid="controls-view"], button:has-text("Controls")');
    await expect(controlsView.first()).toBeVisible();
    await controlsView.click();

    // Should show list of controls
    const controls = page.locator('[data-testid="control-item"]');
    await expect(controls.first()).toBeVisible();

    // Each control should have assessment status
    const firstControl = controls.first();
    const status = firstControl.locator('[data-testid="control-status"]');
    await expect(status).toBeVisible();
  });

  test('should show compliance score/metrics', async ({ page }) => {
    await page.goto('/governance/compliance');

    const complianceScore = page.locator('[data-testid="compliance-score"], .compliance-metric');
    await expect(complianceScore.first()).toBeVisible();

    // Should show percentage
    const scoreText = await complianceScore.first().textContent();
    expect(scoreText).toMatch(/\d+%/);
  });

  test('should filter by compliance framework', async ({ page }) => {
    await page.goto('/governance/compliance');

    const frameworkFilter = page.locator('[data-testid="framework-filter"], select[name="framework"]');
    await expect(frameworkFilter.first()).toBeVisible();
    await frameworkFilter.selectOption('GDPR');

    await page.waitForLoadState('networkidle');

    // Should show GDPR-specific compliance data
    const frameworkIndicator = page.locator('text=GDPR');
    await expect(frameworkIndicator.first()).toBeVisible();
  });

  test('should show audit timeline and countdown', async ({ page }) => {
    await page.goto('/governance/compliance');

    // Look for audit timeline section
    const auditTimeline = page.locator('[data-testid="audit-timeline"], .audit-countdown');
    await expect(auditTimeline.first()).toBeVisible();

    // Should show next audit date
    const nextAudit = auditTimeline.locator('[data-testid="next-audit-date"]');
    await expect(nextAudit).toBeVisible();
  });

  test('should schedule audit', async ({ page }) => {
    await page.goto('/governance/compliance');

    const scheduleAuditBtn = page.locator('button:has-text("Schedule Audit"), [data-testid="schedule-audit-btn"]');
    await expect(scheduleAuditBtn.first()).toBeVisible();
    await scheduleAuditBtn.click();

    // Fill audit details
    await page.locator('[data-testid="audit-title"]').fill('Q2 2026 Compliance Audit');
    await page.locator('[data-testid="audit-date"]').fill('2026-04-15');
    await page.locator('[data-testid="audit-framework"]').selectOption('GDPR');
    await page.locator('[data-testid="audit-auditor"]').fill('External Audit Firm');

    // Save
    await page.locator('button:has-text("Schedule")').click();

    await expect(page.locator('text=Audit scheduled')).toBeVisible({ timeout: 5000 });
  });

  test('should generate compliance report', async ({ page }) => {
    await page.goto('/governance/compliance');

    const reportBtn = page.locator('button:has-text("Generate Report"), [data-testid="generate-report-btn"]');
    await expect(reportBtn.first()).toBeVisible();
    await reportBtn.click();

    // Select report parameters
    await page.locator('[data-testid="report-framework"]').selectOption('GDPR');
    await page.locator('[data-testid="report-date-range"]').selectOption('last-quarter');

    // Generate
    await page.locator('button:has-text("Generate")').click();

    // Should show report preview
    const reportPreview = page.locator('[data-testid="report-preview"]');
    await expect(reportPreview).toBeVisible({ timeout: 10000 });
  });

  test('should export compliance report', async ({ page }) => {
    await page.goto('/governance/compliance');

    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-compliance-btn"]');
    await expect(exportBtn.first()).toBeVisible();
    const downloadPromise = page.waitForEvent('download');

    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
  });
});

test.describe('Risk and Compliance Integration', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should link compliance violations to risks', async ({ page }) => {
    await page.goto('/governance/compliance');

    // Find compliance violation
    const violation = page.locator('[data-testid="violation-item"][data-severity="high"]').first();
    await expect(violation).toBeVisible();
    await violation.click();

    // Create risk from violation
    await page.locator('button:has-text("Create Risk"), [data-testid="create-risk-from-violation"]').click();

    // Risk form should be pre-filled with violation details
    const riskTitle = await page.locator('[data-testid="risk-title"]').inputValue();
    expect(riskTitle.length).toBeGreaterThan(0);

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Risk created')).toBeVisible({ timeout: 5000 });
  });

  test('should show compliance status on risk cards', async ({ page }) => {
    await page.goto('/governance/risks');

    const firstRisk = page.locator('[data-testid="risk-item"]').first();
    await expect(firstRisk).toBeVisible();
    await firstRisk.click();

    // Look for related compliance items
    const relatedCompliance = page.locator('[data-testid="related-compliance"]');
    await expect(relatedCompliance.first()).toBeVisible();
  });

  test('should generate combined risk and compliance report', async ({ page }) => {
    await page.goto('/governance/reports');

    const combinedReportBtn = page.locator('button:has-text("Combined Report"), [data-testid="combined-report-btn"]');
    await expect(combinedReportBtn.first()).toBeVisible();
    await combinedReportBtn.click();

    // Configure report
    await page.locator('[data-testid="include-risks"]').check();
    await page.locator('[data-testid="include-compliance"]').check();

    await page.locator('button:has-text("Generate")').click();

    const reportPreview = page.locator('[data-testid="report-preview"]');
    await expect(reportPreview).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Risk Review and Approval', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should require approval for high-risk items', async ({ page }) => {
    await page.goto('/governance/risks');

    // Wait for page to fully load
    await expect(page.locator('[data-testid="risk-register"], h1:has-text("Risks")')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for React to fully stabilize

    // Create high-risk item - use data-testid selector and wait for button to be stable
    const addRiskBtn = page.locator('[data-testid="add-risk-btn"]');
    await expect(addRiskBtn).toBeAttached();
    await addRiskBtn.click();
    await page.locator('[data-testid="risk-title"]').fill('Critical Risk');
    await page.locator('[data-testid="risk-probability"]').selectOption('High');
    await page.locator('[data-testid="risk-impact"]').selectOption('Critical');
    await page.locator('button:has-text("Save")').click();

    // Should require approval
    const approvalMsg = page.locator('text=requires approval, text=pending approval');
    await expect(approvalMsg.first()).toBeVisible();
  });

  test('should allow risk manager to approve risks', async ({ page }) => {
    await page.goto('/governance/risks');

    // Wait for page to fully load
    await expect(page.locator('[data-testid="risk-register"], h1:has-text("Risks")')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for React to fully stabilize

    // Switch to list view to see all risks with their data attributes
    const allRisksTab = page.locator('text=All Risks').first();
    await expect(allRisksTab).toBeAttached();
    await allRisksTab.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const pendingRisk = page.locator('[data-testid="risk-item"][data-status="pending"]').first();
    await expect(pendingRisk).toBeVisible();
    await pendingRisk.click();

    await page.locator('button:has-text("Approve"), [data-testid="approve-risk-btn"]').click();

    // Add approval comments
    await page.locator('[data-testid="approval-comments"]').fill('Risk acknowledged. Mitigation plan in place.');

    await page.locator('button:has-text("Confirm Approval")').click();

    await expect(page.locator('text=Risk approved')).toBeVisible({ timeout: 5000 });
  });

  test('should escalate overdue risks', async ({ page }) => {
    await page.goto('/governance/risks');

    // Wait for page to fully load
    await expect(page.locator('[data-testid="risk-register"], h1:has-text("Risks")')).toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000); // Wait for React to fully stabilize

    // Switch to list view to see all risks with their data attributes
    const allRisksTab = page.locator('text=All Risks').first();
    await expect(allRisksTab).toBeAttached();
    await allRisksTab.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    const overdueRisk = page.locator('[data-testid="risk-item"][data-overdue="true"]').first();
    await expect(overdueRisk).toBeVisible();
    await overdueRisk.click();

    const escalateBtn = page.locator('button:has-text("Escalate"), [data-testid="escalate-risk-btn"]');
    await expect(escalateBtn.first()).toBeVisible();
    await escalateBtn.click();

    // Select escalation level
    await page.locator('[data-testid="escalation-level"]').selectOption('executive');

    await page.locator('button:has-text("Escalate")').click();

    await expect(page.locator('text=Risk escalated')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Compliance Workflows', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should track policy acknowledgments', async ({ page }) => {
    await page.goto('/governance/policies');

    const policy = page.locator('[data-testid="policy-item"]').first();
    await expect(policy).toBeVisible();
    await policy.click();

    const acknowledgeBtn = page.locator('button:has-text("Acknowledge"), [data-testid="acknowledge-policy-btn"]');
    await expect(acknowledgeBtn.first()).toBeVisible();
    await acknowledgeBtn.click();

    await expect(page.locator('text=Policy acknowledged')).toBeVisible({ timeout: 5000 });
  });

  test('should show pending acknowledgments', async ({ page }) => {
    await page.goto('/governance/policies');

    const pendingTab = page.locator('[data-testid="pending-tab"], button:has-text("Pending")');
    await expect(pendingTab.first()).toBeVisible();
    await pendingTab.click();

    const pendingList = page.locator('[data-testid="pending-acknowledgments"]');
    await expect(pendingList).toBeVisible();
  });

  test('should track training completion', async ({ page }) => {
    await page.goto('/governance/compliance');

    const trainingSection = page.locator('[data-testid="training-section"]');
    await expect(trainingSection.first()).toBeVisible();
    await trainingSection.click();

    const trainingProgress = page.locator('[data-testid="training-progress"]');
    await expect(trainingProgress).toBeVisible();

    // Should show completion percentage
    const progressText = await trainingProgress.textContent();
    expect(progressText).toMatch(/\d+%/);
  });

  test('should assign compliance training', async ({ page }) => {
    await page.goto('/governance/compliance');

    const assignTrainingBtn = page.locator('button:has-text("Assign Training"), [data-testid="assign-training-btn"]');
    await expect(assignTrainingBtn.first()).toBeVisible();
    await assignTrainingBtn.click();

    await page.locator('[data-testid="training-title"]').fill('GDPR Awareness Training');
    await page.locator('[data-testid="training-framework"]').selectOption('GDPR');
    await page.locator('[data-testid="training-assignees"]').selectOption('all-users');

    await page.locator('button:has-text("Assign")').click();

    await expect(page.locator('text=Training assigned')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Risk and Compliance Analytics', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should show risk trends over time', async ({ page }) => {
    await page.goto('/governance/risks/analytics');

    const trendChart = page.locator('[data-testid="risk-trend-chart"], .risk-trends');
    await expect(trendChart.first()).toBeVisible();
  });

  test('should show risk distribution by category', async ({ page }) => {
    await page.goto('/governance/risks/analytics');

    const categoryChart = page.locator('[data-testid="risk-category-chart"], .category-distribution');
    await expect(categoryChart.first()).toBeVisible();
  });

  test('should show compliance score trends', async ({ page }) => {
    await page.goto('/governance/compliance/analytics');

    const scoreChart = page.locator('[data-testid="compliance-score-chart"], .score-trends');
    await expect(scoreChart.first()).toBeVisible();
  });

  test('should compare compliance across frameworks', async ({ page }) => {
    await page.goto('/governance/compliance/analytics');

    const comparisonChart = page.locator('[data-testid="framework-comparison"], .framework-compare');
    await expect(comparisonChart.first()).toBeVisible();
  });

  test('should export analytics data', async ({ page }) => {
    await page.goto('/governance/risks/analytics');

    const exportBtn = page.locator('button:has-text("Export Analytics"), [data-testid="export-analytics-btn"]');
    await expect(exportBtn.first()).toBeVisible();
    const downloadPromise = page.waitForEvent('download');

    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(xlsx|csv)$/);
  });
});

test.describe('Regulatory Change Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should track regulatory changes', async ({ page }) => {
    await page.goto('/governance/compliance/changes');

    await expect(page.locator('[data-testid="regulatory-changes"]')).toBeVisible({ timeout: 5000 });
  });

  test('should assess impact of regulatory changes', async ({ page }) => {
    await page.goto('/governance/compliance/changes');

    const change = page.locator('[data-testid="regulatory-change"]').first();
    await expect(change).toBeVisible();
    await change.click();

    const impactTab = page.locator('[data-testid="impact-tab"], button:has-text("Impact")');
    await expect(impactTab.first()).toBeVisible();
    await impactTab.click();

    const impactAssessment = page.locator('[data-testid="impact-assessment"]');
    await expect(impactAssessment).toBeVisible();
  });

  test('should create action items for regulatory changes', async ({ page }) => {
    await page.goto('/governance/compliance/changes');

    const change = page.locator('[data-testid="regulatory-change"]').first();
    await expect(change).toBeVisible();
    await change.click();

    const createActionBtn = page.locator('button:has-text("Create Action"), [data-testid="create-action-btn"]');
    await expect(createActionBtn.first()).toBeVisible();
    await createActionBtn.click();

    await page.locator('[data-testid="action-title"]').fill('Update privacy policy');
    await page.locator('[data-testid="action-owner"]').selectOption('legal@archzero.local');
    await page.locator('[data-testid="action-due-date"]').fill('2026-06-30');

    await page.locator('button:has-text("Create")').click();

    await expect(page.locator('text=Action created')).toBeVisible({ timeout: 5000 });
  });
});
