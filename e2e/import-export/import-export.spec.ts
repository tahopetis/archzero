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

test.describe('Bulk Import', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display import wizard', async ({ page }) => {
    await page.goto('/import');

    // Verify import page loads
    await expect(page.locator('h1:has-text("Import"), [data-testid="import-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should upload CSV file for import', async ({ page }) => {
    await page.goto('/import');

    // Create test CSV file
    const csvContent = `name,type,lifecycle_phase,description
Test Card 1,Application,Active,Test description 1
Test Card 2,ITComponent,Active,Test description 2`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    // Create a temporary file
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-cards.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Verify file is uploaded
    const uploadedFileName = page.locator('text=test-cards.csv, [data-testid="uploaded-file-name"]');
    await expect(uploadedFileName.first()).toBeVisible();
  });

  test('should validate import file format', async ({ page }) => {
    await page.goto('/import');

    // Create invalid CSV (missing required columns)
    const invalidCsv = `name
Test Card 1`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCsv)
    });

    // Should show validation error
    const errorMsg = page.locator('text=Invalid format, text=Missing required columns, text=validation error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show import preview', async ({ page }) => {
    await page.goto('/import');

    // Upload valid CSV
    const csvContent = `name,type,lifecycle_phase,description
Preview Card,Application,Active,Preview description`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'preview.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for and verify preview section
    const preview = page.locator('[data-testid="import-preview"], .preview-table');
    await expect(preview.first()).toBeVisible({ timeout: 10000 });
  });

  test('should confirm import', async ({ page }) => {
    await page.goto('/import');

    const csvContent = `name,type,lifecycle_phase,description
Import Test Card,Application,Active,Import test description`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'import-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for and click import button
    const importBtn = page.locator('button:has-text("Import"), [data-testid="confirm-import-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 10000 });
    await importBtn.click();

    // Verify success message
    await expect(page.locator('text=Import successful, text=Cards imported')).toBeVisible({ timeout: 10000 });
  });

  test('should handle import errors gracefully', async ({ page }) => {
    await page.goto('/import');

    // Create CSV with duplicate names (should cause error)
    const csvContent = `name,type,lifecycle_phase,description
Duplicate Card,Application,Active,Test 1
Duplicate Card,Application,Active,Test 2`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'duplicate-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for and click import button
    const importBtn = page.locator('button:has-text("Import"), [data-testid="confirm-import-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 10000 });
    await importBtn.click();

    // Should show error message
    const errorMsg = page.locator('text=Import failed, text=Duplicate, text=Error');
    await expect(errorMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show import progress', async ({ page }) => {
    await page.goto('/import');

    const csvContent = `name,type,lifecycle_phase
${Array.from({ length: 10 }, (_, i) => `Card ${i},Application,Active`).join('\n')}`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'bulk-test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for and click import button
    const importBtn = page.locator('button:has-text("Import"), [data-testid="confirm-import-btn"]');
    await expect(importBtn).toBeVisible({ timeout: 10000 });
    await importBtn.click();

    // Look for progress indicator
    const progress = page.locator('[data-testid="import-progress"], .progress-bar');
    await expect(progress.first()).toBeVisible({ timeout: 10000 });
  });

  test('should support JSON import format', async ({ page }) => {
    await page.goto('/import');

    // Wait for and use format selector
    const formatSelect = page.locator('[data-testid="import-format-select"], select[name="format"]');
    await expect(formatSelect).toBeVisible({ timeout: 10000 });
    await formatSelect.selectOption('json');

    // Verify JSON-specific help text appears
    const helpText = page.locator('text=JSON format, text=.json');
    await expect(helpText.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Bulk Export', () => {
  let loginPage: LoginPage;
  let cardListPage: CardListPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    cardListPage = new CardListPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
    await cardListPage.goto();
  });

  test('should display export options', async ({ page }) => {
    // Wait for and click export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 });
    await exportBtn.first().click();

    // Verify export dialog/menu
    const exportDialog = page.locator('[data-testid="export-dialog"], .export-menu');
    await expect(exportDialog.first()).toBeVisible({ timeout: 10000 });
  });

  test('should export cards as CSV', async ({ page }) => {
    // Wait for and click export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 });

    // Setup download handler
    const downloadPromise = page.waitForEvent('download');

    await exportBtn.first().click();

    // Wait for and select CSV format
    const csvOption = page.locator('button:has-text("CSV"), [data-testid="export-csv-btn"]');
    await expect(csvOption).toBeVisible({ timeout: 10000 });
    await csvOption.click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export cards as JSON', async ({ page }) => {
    // Wait for and click export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');

    await exportBtn.first().click();

    // Wait for and select JSON format
    const jsonOption = page.locator('button:has-text("JSON"), [data-testid="export-json-btn"]');
    await expect(jsonOption).toBeVisible({ timeout: 10000 });
    await jsonOption.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('should export filtered results only', async ({ page }) => {
    // Apply filter
    await cardListPage.filterByType('Application');

    // Wait for and click export button
    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-btn"]');
    await expect(exportBtn.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');

    await exportBtn.first().click();

    // Wait for and select CSV format
    const csvOption = page.locator('button:has-text("CSV"), [data-testid="export-csv-btn"]');
    await expect(csvOption).toBeVisible({ timeout: 10000 });
    await csvOption.click();

    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should export selected cards only', async ({ page }) => {
    // Select cards
    const firstCard = page.locator('[data-testid="card-item"]').first();
    const cardCheckbox = firstCard.locator('[type="checkbox"], [data-testid="select-card"]');

    // Wait for and use checkbox
    await expect(cardCheckbox.first()).toBeVisible({ timeout: 10000 });
    await cardCheckbox.first().click();

    // Wait for and click export selected button
    const exportSelectedBtn = page.locator('button:has-text("Export Selected"), [data-testid="export-selected-btn"]');
    await expect(exportSelectedBtn.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');

    await exportSelectedBtn.first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(csv|json)$/);
  });
});

test.describe('Export History and Scheduling', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display export history', async ({ page }) => {
    await page.goto('/export/history');

    // Verify history page loads
    await expect(page.locator('h1:has-text("Export History"), [data-testid="export-history-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should show previous exports', async ({ page }) => {
    await page.goto('/export/history');

    // Wait for and verify export history list
    const historyList = page.locator('[data-testid="export-history-list"], .history-items');
    await expect(historyList.first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow re-downloading previous exports', async ({ page }) => {
    await page.goto('/export/history');

    // Wait for and find first export item
    const firstExport = page.locator('[data-testid="export-item"]').first();
    await expect(firstExport).toBeVisible({ timeout: 10000 });

    // Wait for and click download button
    const downloadBtn = firstExport.locator('button:has-text("Download"), [data-testid="download-again-btn"]');
    await expect(downloadBtn.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');

    await downloadBtn.first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });

  test('should schedule recurring export', async ({ page }) => {
    await page.goto('/export');

    // Wait for and click schedule option
    const scheduleBtn = page.locator('button:has-text("Schedule"), [data-testid="schedule-export-btn"]');
    await expect(scheduleBtn.first()).toBeVisible({ timeout: 10000 });
    await scheduleBtn.click();

    // Configure schedule
    await page.locator('[data-testid="export-name"]').fill('Weekly Cards Export');
    await page.locator('[data-testid="schedule-frequency"]').selectOption('weekly');

    // Wait for and save schedule
    const saveScheduleBtn = page.locator('button:has-text("Save Schedule"), [data-testid="save-schedule-btn"]');
    await expect(saveScheduleBtn).toBeVisible({ timeout: 10000 });
    await saveScheduleBtn.click();

    // Verify success
    await expect(page.locator('text=Schedule created, text=Export scheduled')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Import Mapping and Transformation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should allow column mapping', async ({ page }) => {
    await page.goto('/import');

    // Upload file with non-standard columns
    const csvContent = `Card Name,Card Type,Status,Notes
Test Card,Application,Active,Test note`;

    // Wait for and use file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });

    const fileChooserPromise = page.waitForEvent('filechooser');

    await page.locator('button:has-text("Upload"), [data-testid="upload-btn"]').click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'custom-columns.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });

    // Wait for and verify mapping interface
    const mappingInterface = page.locator('[data-testid="column-mapping"], .field-mapping');
    await expect(mappingInterface.first()).toBeVisible({ timeout: 10000 });

    // Map columns
    const nameMapping = page.locator('[data-testid="map-name"], select[name="map-name"]');
    await expect(nameMapping).toBeVisible({ timeout: 10000 });
    await nameMapping.selectOption('name');

    const typeMapping = page.locator('[data-testid="map-type"], select[name="map-type"]');
    await expect(typeMapping).toBeVisible({ timeout: 10000 });
    await typeMapping.selectOption('type');

    // Wait for and confirm mapping
    const confirmMappingBtn = page.locator('button:has-text("Confirm"), [data-testid="confirm-mapping-btn"]');
    await expect(confirmMappingBtn).toBeVisible({ timeout: 10000 });
    await confirmMappingBtn.click();
  });

  test('should save mapping as preset', async ({ page }) => {
    await page.goto('/import');

    // Wait for mapping interface to be visible
    const mappingInterface = page.locator('[data-testid="column-mapping"], .field-mapping');
    await expect(mappingInterface.first()).toBeVisible({ timeout: 10000 });

    // Wait for and click save option
    const saveMappingBtn = page.locator('button:has-text("Save Mapping"), [data-testid="save-mapping-btn"]');
    await expect(saveMappingBtn).toBeVisible({ timeout: 10000 });
    await saveMappingBtn.click();

    // Fill mapping name
    const mappingName = page.locator('[data-testid="mapping-name"]');
    await expect(mappingName).toBeVisible({ timeout: 10000 });
    await mappingName.fill('Custom CSV Format');

    // Wait for and confirm save
    const confirmSaveBtn = page.locator('button:has-text("Save"), [data-testid="confirm-save-btn"]');
    await expect(confirmSaveBtn).toBeVisible({ timeout: 10000 });
    await confirmSaveBtn.click();

    await expect(page.locator('text=Mapping saved')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Template Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should download import template', async ({ page }) => {
    await page.goto('/import');

    // Wait for and click template download
    const templateBtn = page.locator('button:has-text("Download Template"), [data-testid="download-template-btn"]');
    await expect(templateBtn.first()).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');

    await templateBtn.first().click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/template\.(csv|xlsx)$/);
  });

  test('should show template documentation', async ({ page }) => {
    await page.goto('/import');

    // Wait for and verify documentation or help section
    const docs = page.locator('[data-testid="import-docs"], .template-documentation');
    await expect(docs.first()).toBeVisible({ timeout: 10000 });

    // Verify required fields are listed
    const requiredFields = docs.locator('text=Required fields, text=name, text=type');
    await expect(requiredFields.first()).toBeVisible({ timeout: 10000 });
  });
});
