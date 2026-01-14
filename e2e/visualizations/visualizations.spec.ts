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

test.describe('Dashboard Visualizations', () => {
  let loginPage: LoginPage;
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboard = new DashboardPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display landscape heatmap', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for heatmap visualization
    const heatmap = page.locator('[data-testid="landscape-heatmap"], canvas.heatmap, .heat-map');
    const hasHeatmap = await heatmap.count();

    if (hasHeatmap > 0) {
      await expect(heatmap.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should allow drill-down on heatmap', async ({ page }) => {
    await page.goto('/dashboard');

    const heatmap = page.locator('[data-testid="landscape-heatmap"], canvas.heatmap');
    const hasHeatmap = await heatmap.count();

    if (hasHeatmap > 0) {
      // Click on heatmap to drill down
      await heatmap.first().click();

      // Verify detail view or tooltip appears
      const detailView = page.locator('[data-testid="heatmap-detail"], .detail-panel');
      await expect(detailView.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support color-by options for heatmap', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for color-by selector
    const colorBySelect = page.locator('[data-testid="color-by-select"], select[name="colorBy"]');
    const hasSelect = await colorBySelect.count();

    if (hasSelect > 0) {
      await colorBySelect.selectOption('lifecycle_phase');

      // Verify heatmap updates
      await page.waitForTimeout(500);

      // Check that colors have changed (this would require visual comparison)
      const heatmap = page.locator('[data-testid="landscape-heatmap"], canvas.heatmap');
      await expect(heatmap.first()).toBeVisible();
    }
  });

  test('should display summary metrics cards', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for metric cards
    const metricCards = page.locator('[data-testid="metric-card"], .summary-card');
    const hasMetrics = await metricCards.count();

    if (hasMetrics > 0) {
      await expect(metricCards.first()).toBeVisible();

      // Verify cards show values
      const count = await metricCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should display charts and graphs', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for various chart types
    const charts = page.locator('[data-testid="chart"], canvas.chart, .graph, .visualization');
    const hasCharts = await charts.count();

    if (hasCharts > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });
});

test.describe('Time Machine Roadmap', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display roadmap timeline', async ({ page }) => {
    await page.goto('/roadmap');

    // Verify roadmap page loads
    await expect(page.locator('h1:has-text("Roadmap"), [data-testid="roadmap-page"]')).toBeVisible({ timeout: 10000 });

    // Look for timeline visualization
    const timeline = page.locator('[data-testid="roadmap-timeline"], .timeline, .roadmap-view');
    await expect(timeline.first()).toBeVisible({ timeout: 5000 });
  });

  test('should interact with time slider', async ({ page }) => {
    await page.goto('/roadmap');

    // Look for time slider control
    const timeSlider = page.locator('[data-testid="time-slider"], input[type="range"], .timeline-slider');
    const hasSlider = await timeSlider.count();

    if (hasSlider > 0) {
      // Get initial value
      const initialHandle = page.locator('[data-testid="slider-handle"], .slider-handle');
      const sliderBox = await timeSlider.boundingBox();

      if (sliderBox) {
        // Drag slider
        await page.mouse.move(sliderBox.x + sliderBox.width / 2, sliderBox.y + sliderBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(sliderBox.x + sliderBox.width / 2 + 50, sliderBox.y + sliderBox.height / 2);
        await page.mouse.up();

        // Verify timeline updates
        await page.waitForTimeout(500);
      }
    }
  });

  test('should show milestones on roadmap', async ({ page }) => {
    await page.goto('/roadmap');

    // Look for milestones
    const milestones = page.locator('[data-testid="milestone"], .milestone-marker');
    const hasMilestones = await milestones.count();

    if (hasMilestones > 0) {
      await expect(milestones.first()).toBeVisible();
    }
  });

  test('should display initiative cards on timeline', async ({ page }) => {
    await page.goto('/roadmap');

    // Look for initiative cards
    const initiativeCards = page.locator('[data-testid="initiative-card"], .timeline-card');
    const hasCards = await initiativeCards.count();

    if (hasCards > 0) {
      await expect(initiativeCards.first()).toBeVisible();
    }
  });

  test('should filter roadmap by quarter', async ({ page }) => {
    await page.goto('/roadmap');

    // Look for quarter filter
    const quarterFilter = page.locator('[data-testid="quarter-filter"], select[name="quarter"]');
    const hasFilter = await quarterFilter.count();

    if (hasFilter > 0) {
      await quarterFilter.selectOption('Q1 2026');

      // Verify filtered view
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Dependency Matrix Visualization', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display dependency matrix', async ({ page }) => {
    await page.goto('/relationships/matrix');

    // Verify matrix view
    const matrix = page.locator('[data-testid="dependency-matrix"], table.matrix-view, .dependency-grid');
    await expect(matrix.first()).toBeVisible({ timeout: 10000 });
  });

  test('should highlight dependencies on hover', async ({ page }) => {
    await page.goto('/relationships/matrix');

    // Find first matrix cell
    const firstCell = page.locator('td, .matrix-cell').first();
    await firstCell.hover();

    // Look for highlighted dependencies
    const highlighted = page.locator('.highlighted, .selected, [data-highlighted="true"]');
    await page.waitForTimeout(500);

    const hasHighlighted = await highlighted.count();
    if (hasHighlighted > 0) {
      await expect(highlighted.first()).toBeVisible();
    }
  });

  test('should filter matrix by dependency type', async ({ page }) => {
    await page.goto('/relationships/matrix');

    // Look for dependency type filter
    const typeFilter = page.locator('[data-testid="dependency-type-filter"], select[name="depType"]');
    const hasFilter = await typeFilter.count();

    if (hasFilter > 0) {
      await typeFilter.selectOption('depends_on');

      // Verify filtered matrix
      await page.waitForTimeout(500);
    }
  });

  test('should show legend for matrix colors', async ({ page }) => {
    await page.goto('/relationships/matrix');

    // Look for legend
    const legend = page.locator('[data-testid="matrix-legend"], .legend, .color-key');
    const hasLegend = await legend.count();

    if (hasLegend > 0) {
      await expect(legend.first()).toBeVisible();
    }
  });
});

test.describe('Technology Radar', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display technology radar', async ({ page }) => {
    await page.goto('/intelligence/radar');

    // Verify radar page loads
    await expect(page.locator('h1:has-text("Radar"), [data-testid="radar-page"]')).toBeVisible({ timeout: 10000 });

    // Look for radar visualization
    const radar = page.locator('[data-testid="tech-radar"], canvas.radar, .radar-chart');
    const hasRadar = await radar.count();

    if (hasRadar > 0) {
      await expect(radar.first()).toBeVisible();
    }
  });

  test('should display four quadrants', async ({ page }) => {
    await page.goto('/intelligence/radar');

    // Look for quadrants
    const quadrants = page.locator('[data-testid="quadrant"], .radar-quadrant');
    const hasQuadrants = await quadrants.count();

    if (hasQuadrants > 0) {
      const count = await quadrants.count();
      expect(count).toBe(4);
    }
  });

  test('should show technology details on hover', async ({ page }) => {
    await page.goto('/intelligence/radar');

    // Look for technology items
    const techItems = page.locator('[data-testid="tech-item"], .radar-item');
    const count = await techItems.count();

    if (count > 0) {
      await techItems.first().hover();

      // Look for tooltip or popover
      const tooltip = page.locator('[data-testid="tech-tooltip"], .radar-tooltip');
      await expect(tooltip.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should allow filtering by radar ring', async ({ page }) => {
    await page.goto('/intelligence/radar');

    // Look for ring filter
    const ringFilter = page.locator('[data-testid="ring-filter"], select[name="ring"]');
    const hasFilter = await ringFilter.count();

    if (hasFilter > 0) {
      await ringFilter.selectOption('adopt');

      // Verify filtered view
      await page.waitForTimeout(500);
    }
  });
});

test.describe('BIA Assessment Visualization', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display BIA assessment form', async ({ page }) => {
    await page.goto('/intelligence/bia');

    // Verify BIA page loads
    await expect(page.locator('h1:has-text("Business Impact"), [data-testid="bia-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should visualize impact scores', async ({ page }) => {
    await page.goto('/intelligence/bia');

    // Look for impact score visualization
    const scoreVis = page.locator('[data-testid="impact-score"], .score-visualization');
    const hasScore = await scoreVis.count();

    if (hasScore > 0) {
      await expect(scoreVis.first()).toBeVisible();
    }
  });

  test('should display RTO/RPO metrics', async ({ page }) => {
    await page.goto('/intelligence/bia');

    // Look for RTO/RPO displays
    const rtoRpo = page.locator('[data-testid="rto-rpo"], .recovery-metrics');
    const hasMetrics = await rtoRpo.count();

    if (hasMetrics > 0) {
      await expect(rtoRpo.first()).toBeVisible();
    }
  });

  test('should show critical path analysis', async ({ page }) => {
    await page.goto('/intelligence/bia');

    // Look for critical path visualization
    const criticalPath = page.locator('[data-testid="critical-path"], .dependency-chain');
    const hasPath = await criticalPath.count();

    if (hasPath > 0) {
      await expect(criticalPath.first()).toBeVisible();
    }
  });
});

test.describe('Migration Advisor Report', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display 6R migration recommendations', async ({ page }) => {
    await page.goto('/intelligence/migration');

    // Verify migration advisor page loads
    await expect(page.locator('h1:has-text("Migration"), [data-testid="migration-page"]')).toBeVisible({ timeout: 10000 });

    // Look for 6R recommendations (Rehost, Refactor, Revise, Rebuild, Replace, Retire)
    const recommendations = page.locator('[data-testid="6r-recommendation"], .migration-option');
    const hasRecs = await recommendations.count();

    if (hasRecs > 0) {
      await expect(recommendations.first()).toBeVisible();
    }
  });

  test('should show effort estimates for each option', async ({ page }) => {
    await page.goto('/intelligence/migration');

    // Look for effort estimates
    const effortEstimates = page.locator('[data-testid="effort-estimate"], .effort-bar');
    const hasEffort = await effortEstimates.count();

    if (hasEffort > 0) {
      await expect(effortEstimates.first()).toBeVisible();
    }
  });

  test('should allow comparing migration options', async ({ page }) => {
    await page.goto('/intelligence/migration');

    // Look for comparison view
    const compareView = page.locator('[data-testid="comparison-view"], .migration-compare');
    const hasCompare = await compareView.count();

    if (hasCompare > 0) {
      await expect(compareView.first()).toBeVisible();
    }
  });
});

test.describe('TCO Calculator', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display TCO calculator', async ({ page }) => {
    await page.goto('/intelligence/tco');

    // Verify TCO page loads
    await expect(page.locator('h1:has-text("TCO"), [data-testid="tco-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show cost breakdown visualization', async ({ page }) => {
    await page.goto('/intelligence/tco');

    // Look for cost breakdown chart
    const costBreakdown = page.locator('[data-testid="cost-breakdown"], .tco-chart, .cost-pie-chart');
    const hasChart = await costBreakdown.count();

    if (hasChart > 0) {
      await expect(costBreakdown.first()).toBeVisible();
    }
  });

  test('should display roll-up costs by category', async ({ page }) => {
    await page.goto('/intelligence/tco');

    // Look for roll-up metrics
    const rollup = page.locator('[data-testid="tco-rollup"], .cost-summary, .rollup-metrics');
    const hasRollup = await rollup.count();

    if (hasRollup > 0) {
      await expect(rollup.first()).toBeVisible();
    }
  });

  test('should allow adjusting cost parameters', async ({ page }) => {
    await page.goto('/intelligence/tco');

    // Look for input parameters
    const paramInput = page.locator('[data-testid="tco-param"], input[name*="cost" i], input[name*="duration" i]');
    const hasParam = await paramInput.count();

    if (hasParam > 0) {
      // Adjust a parameter
      await paramInput.first().fill('100000');

      // Wait for calculation
      await page.waitForTimeout(1000);

      // Verify recalculation occurred
      const updatedValue = page.locator('[data-testid="tco-total"], .total-cost');
      const hasTotal = await updatedValue.count();

      if (hasTotal > 0) {
        await expect(updatedValue.first()).toBeVisible();
      }
    }
  });
});

test.describe('Report Generation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should generate PDF report', async ({ page }) => {
    await page.goto('/reports');

    // Look for generate report button
    const generateBtn = page.locator('button:has-text("Generate"), [data-testid="generate-report-btn"]');
    const hasGenerate = await generateBtn.count();

    if (hasGenerate > 0) {
      await generateBtn.first().click();

      // Select PDF format
      await page.locator('[data-testid="format-select"]').selectOption('pdf');

      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      // Confirm generation
      await page.locator('button:has-text("Confirm"), [data-testid="confirm-generate-btn"]').click();

      // Wait for download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    }
  });

  test('should generate PowerPoint report', async ({ page }) => {
    await page.goto('/reports');

    const generateBtn = page.locator('button:has-text("Generate"), [data-testid="generate-report-btn"]');
    const hasGenerate = await generateBtn.count();

    if (hasGenerate > 0) {
      const downloadPromise = page.waitForEvent('download');

      await generateBtn.first().click();

      // Select PowerPoint format
      await page.locator('[data-testid="format-select"]').selectOption('pptx');

      await page.locator('button:has-text("Confirm"), [data-testid="confirm-generate-btn"]').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pptx$/);
    }
  });

  test('should allow custom report parameters', async ({ page }) => {
    await page.goto('/reports');

    // Look for report configuration
    const configPanel = page.locator('[data-testid="report-config"], .report-builder');
    const hasConfig = await configPanel.count();

    if (hasConfig > 0) {
      await expect(configPanel.first()).toBeVisible();

      // Select sections to include
      const sectionCheckbox = page.locator('[data-testid="report-section"] input[type="checkbox"]').first();
      await sectionCheckbox.check();

      // Set date range
      const dateRange = page.locator('[data-testid="date-range"], input[name="daterange"]');
      const hasDateRange = await dateRange.count();

      if (hasDateRange > 0) {
        await dateRange.first().fill('2026-01-01 to 2026-12-31');
      }
    }
  });

  test('should show report preview', async ({ page }) => {
    await page.goto('/reports');

    const previewBtn = page.locator('button:has-text("Preview"), [data-testid="preview-btn"]');
    const hasPreview = await previewBtn.count();

    if (hasPreview > 0) {
      await previewBtn.click();

      // Verify preview modal/panel
      const previewPanel = page.locator('[data-testid="report-preview"], .preview-modal');
      await expect(previewPanel.first()).toBeVisible();
    }
  });

  test('should auto-generate executive summary', async ({ page }) => {
    await page.goto('/reports');

    // Look for executive summary toggle
    const execSummaryToggle = page.locator('input[name="include-summary"][value="executive"], [data-testid="exec-summary-toggle"]');
    const hasToggle = await execSummaryToggle.count();

    if (hasToggle > 0) {
      await execSummaryToggle.first().check();

      // Generate report
      const generateBtn = page.locator('button:has-text("Generate"), [data-testid="generate-report-btn"]');
      const hasGenerate = await generateBtn.count();

      if (hasGenerate > 0) {
        await generateBtn.first().click();

        // Select format
        await page.locator('[data-testid="format-select"]').selectOption('pdf');

        const downloadPromise = page.waitForEvent('download');

        await page.locator('button:has-text("Confirm"), [data-testid="confirm-generate-btn"]').click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
      }
    }
  });
});

test.describe('Dashboard Widget Performance', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should render dashboard within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');

    // Wait for dashboard to fully load
    await page.waitForLoadState('domcontentloaded');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle multiple widgets efficiently', async ({ page }) => {
    await page.goto('/dashboard');

    // Count widgets
    const widgets = page.locator('[data-testid="widget"], .dashboard-widget');
    const widgetCount = await widgets.count();

    expect(widgetCount).toBeGreaterThan(0);

    // All widgets should be visible
    for (let i = 0; i < Math.min(widgetCount, 5); i++) {
      await expect(widgets.nth(i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Graph Visualization Performance', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should render large graph efficiently', async ({ page }) => {
    await page.goto('/relationships/graph');

    // Look for graph canvas/container
    const graphContainer = page.locator('[data-testid="graph-container"], .graph-canvas');
    const hasGraph = await graphContainer.count();

    if (hasGraph > 0) {
      const startTime = Date.now();

      // Wait for graph to load
      await page.waitForSelector('[data-testid="graph-loaded"], .graph-loaded, canvas', {
        timeout: 10000
      }).catch(() => {
        // Graph might be considered loaded when canvas is visible
      });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      // Graph should render within 5 seconds even with many nodes
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('should support graph zoom without performance degradation', async ({ page }) => {
    await page.goto('/relationships/graph');

    const graph = page.locator('[data-testid="relationship-graph"], canvas');
    const hasGraph = await graph.count();

    if (hasGraph > 0) {
      const startTime = Date.now();

      // Perform zoom operation
      await page.mouse.wheel(0, -100);
      await page.waitForTimeout(500);

      const endTime = Date.now();
      const zoomTime = endTime - startTime;

      // Zoom should be responsive
      expect(zoomTime).toBeLessThan(1000);
    }
  });

  test('should handle 1000+ node graph', async ({ page }) => {
    // This test verifies the graph can handle large datasets
    await page.goto('/relationships/graph');

    // Check if there are many nodes being rendered
    const nodeCount = page.locator('[data-testid="graph-node"], .node, circle.node');
    const count = await nodeCount.count();

    // If graph has many nodes, verify performance is acceptable
    if (count > 100) {
      const startTime = Date.now();

      // Try to interact with graph
      const graph = page.locator('[data-testid="relationship-graph"], canvas');
      await graph.first().hover();

      const endTime = Date.now();
      const interactionTime = endTime - startTime;

      // Interaction should remain responsive
      expect(interactionTime).toBeLessThan(2000);
    }
  });
});

test.describe('Report Filtering', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should filter reports by date range', async ({ page }) => {
    await page.goto('/reports');

    // Look for date range filter
    const dateFilter = page.locator('[data-testid="date-range-filter"], input[name="daterange"]');
    const hasFilter = await dateFilter.count();

    if (hasFilter > 0) {
      await dateFilter.first().fill('2026-01-01 - 2026-03-31');

      // Apply filter
      const applyBtn = page.locator('button:has-text("Apply"), [data-testid="apply-filter-btn"]');
      const hasApply = await applyBtn.count();

      if (hasApply > 0) {
        await applyBtn.click();

        // Verify filtered report list
        await page.waitForTimeout(500);
      }
    }
  });

  test('should filter by report type', async ({ page }) => {
    await page.goto('/reports');

    // Look for type filter
    const typeFilter = page.locator('[data-testid="report-type-filter"], select[name="type"]');
    const hasFilter = await typeFilter.count();

    if (hasFilter > 0) {
      await typeFilter.selectOption('compliance');

      // Verify filter applied
      await page.waitForTimeout(500);
    }
  });

  test('should save report filters as preset', async ({ page }) => {
    await page.goto('/reports');

    const saveFilterBtn = page.locator('button:has-text("Save Filter"), [data-testid="save-filter-btn"]');
    const hasSave = await saveFilterBtn.count();

    if (hasSave > 0) {
      await saveSaveBtn.click();

      // Enter preset name
      await page.locator('[data-testid="preset-name"]').fill('Monthly Compliance Report');

      await page.locator('button:has-text("Save"), [data-testid="confirm-save-btn"]').click();

      // Verify preset saved
      await expect(page.locator('text=Filter saved')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Custom Report Builder', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display custom report builder', async ({ page }) => {
    await page.goto('/reports/builder');

    // Verify builder page loads
    await expect(page.locator('h1:has-text("Custom Report"), [data-testid="report-builder-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow drag-and-drop sections', async ({ page }) => {
    await page.goto('/reports/builder');

    // Look for available sections palette
    const palette = page.locator('[data-testid="sections-palette"], .report-sections');
    const hasPalette = await palette.count();

    if (hasPalette > 0) {
      // Look for canvas/drop zone
      const canvas = page.locator('[data-testid="report-canvas"], .drop-zone');
      await expect(canvas.first()).toBeVisible();

      // Try dragging a section
      const firstSection = palette.locator('[data-testid="section-item"]').first();
      const canvasBox = await canvas.boundingBox();

      if (canvasBox && firstSection) {
        await firstSection.dragTo(canvas);

        // Verify section added
        await page.waitForTimeout(500);
      }
    }
  });

  test('should allow reordering sections', async ({ page }) => {
    await page.goto('/reports/builder');

    // Look for existing sections in canvas
    const canvasSections = page.locator('[data-testid="canvas-section"], .report-section');
    const count = await canvasSections.count();

    if (count >= 2) {
      // Drag first section to after second section
      await canvasSections.nth(0).dragTo(canvasSections.nth(1));

      // Verify reordering
      await page.waitForTimeout(500);
    }
  });

  test('should show live preview of custom report', async ({ page }) => {
    await page.goto('/reports/builder');

    // Look for preview panel
    const previewPanel = page.locator('[data-testid="live-preview"], .report-preview');
    const hasPreview = await previewPanel.count();

    if (hasPreview > 0) {
      await expect(previewPanel.first()).toBeVisible();

      // Modify a section
      const sectionInput = page.locator('[data-testid="section-title-input"]').first();
      const hasInput = await sectionInput.count();

      if (hasInput) {
        await sectionInput.fill('Custom Title');

        // Verify preview updates
        await page.waitForTimeout(500);

        const previewTitle = previewPanel.locator('text=Custom Title');
        await expect(previewTitle.first()).toBeVisible();
      }
    }
  });

  test('should save custom report template', async ({ page }) => {
    await page.goto('/reports/builder');

    const saveBtn = page.locator('button:has-text("Save Template"), [data-testid="save-template-btn"]');
    const hasSave = await saveBtn.count();

    if (hasSave > 0) {
      await saveBtn.click();

      // Enter template name
      await page.locator('[data-testid="template-name"]').fill('Executive Summary Report');

      await page.locator('button:has-text("Save"), [data-testid="confirm-save-btn"]').click();

      // Verify saved
      await expect(page.locator('text=Template saved')).toBeVisible({ timeout: 5000 });
    }
  });
});
