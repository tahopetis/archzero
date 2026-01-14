import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Dashboard Page Object
 *
 * Handles dashboard interactions and widgets
 */
export class DashboardPage extends BasePage {
  // Widget locators
  readonly portfolioHealthWidget: Locator;
  readonly dataQualityWidget: Locator;
  readonly criticalityWatchWidget: Locator;
  readonly recentActivityWidget: Locator;

  constructor(page: Page) {
    super(page);

    this.portfolioHealthWidget = page.locator('[data-testid="widget-portfolio-health"]');
    this.dataQualityWidget = page.locator('[data-testid="widget-data-quality"]');
    this.criticalityWatchWidget = page.locator('[data-testid="widget-criticality-watch"]');
    this.recentActivityWidget = page.locator('[data-testid="widget-recent-activity"]');
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await this.goto('/');
  }

  /**
   * Verify dashboard loaded
   */
  async verifyDashboardLoaded() {
    await expect(this.portfolioHealthWidget).toBeVisible();
    await expect(this.dataQualityWidget).toBeVisible();
    await expect(this.criticalityWatchWidget).toBeVisible();
  }

  /**
   * Get portfolio health score
   */
  async getPortfolioHealthScore(): Promise<number> {
    const scoreText = await this.portfolioHealthWidget.locator('[data-testid="health-score"]').textContent();
    return scoreText ? parseInt(scoreText, 10) : 0;
  }

  /**
   * Get data quality score
   */
  async getDataQualityScore(): Promise<number> {
    const scoreText = await this.dataQualityWidget.locator('[data-testid="quality-score"]').textContent();
    return scoreText ? parseInt(scoreText, 10) : 0;
  }

  /**
   * Get critical applications count
   */
  async getCriticalAppsCount(): Promise<number> {
    const rows = await this.criticalityWatchWidget.locator('tbody tr').count();
    return rows;
  }

  /**
   * Click on portfolio health widget segment
   */
  async clickHealthSegment(segment: 'green' | 'yellow' | 'orange' | 'red') {
    await this.portfolioHealthWidget.locator(`[data-testid="segment-${segment}"]`).click();
    await this.waitForLoad();
  }

  /**
   * Navigate from dashboard widget to inventory
   */
  async navigateToInventoryFromWidget(widget: string) {
    const widgetElement = this.page.locator(`[data-testid="widget-${widget}"]`);
    await widgetElement.click();
    await this.waitForLoad();
    await this.verifyUrl('/cards');
  }
}
