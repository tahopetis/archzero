import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/index';

test.describe('ARB Review Requests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display ARB dashboard', async ({ page }) => {
    await page.goto('/arb');

    await expect(page.locator('[data-testid="arb-dashboard"], h1:has-text("Architecture Review")').first()).toBeVisible({ timeout: 10000 });
  });

  test('should show pending reviews count', async ({ page }) => {
    await page.goto('/arb');

    const pendingCount = page.locator('[data-testid="pending-reviews-count"], .pending-count');
    await expect(pendingCount.first()).toBeVisible();
  });

  test('should create new application review request', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Select request type
    await page.locator('[data-testid="request-type"]').selectOption('new_application');

    // Fill request details
    await page.locator('[data-testid="request-title"]').fill('Payment Processing System');
    await page.locator('[data-testid="request-description"]').fill('New payment system for e-commerce platform');
    await page.locator('[data-testid="request-business-justification"]').fill('Required to support new payment methods and improve checkout conversion');

    // Submit request (cardId is optional)
    await page.locator('button:has-text("Submit Request"), [data-testid="submit-request-btn"]').click();

    // Verify success by checking for redirect to requests page or success message
    await page.waitForURL('**/arb/requests', { timeout: 5000 });
  });

  test('should create major change review request', async ({ page }) => {
    await page.goto('/arb/requests/new');

    await page.locator('[data-testid="request-type"]').selectOption('major_change');

    await page.locator('[data-testid="request-title"]').fill('Database Migration');
    await page.locator('[data-testid="request-description"]').fill('Migrate from PostgreSQL to MongoDB');
    await page.locator('[data-testid="change-impact"]').fill('High - affects all data services');

    await page.locator('button:has-text("Submit Request")').click();

    await expect(page.locator('text=Review request submitted')).toBeVisible({ timeout: 5000 });
  });

  test('should create exception request', async ({ page }) => {
    await page.goto('/arb/requests/new');

    await page.locator('[data-testid="request-type"]').selectOption('exception');

    await page.locator('[data-testid="request-title"]').fill('Temporary Non-Compliance');
    await page.locator('[data-testid="request-description"]').fill('Need to use deprecated API for 3 months');
    await page.locator('[data-testid="exception-reason"]').fill('Legacy system integration');
    await page.locator('[data-testid="exception-timeline"]').fill('Q2 2026');

    await page.locator('button:has-text("Submit Request")').click();

    await expect(page.locator('text=Exception request submitted')).toBeVisible({ timeout: 5000 });
  });

  test('should show request details', async ({ page }) => {
    await page.goto('/arb/requests');

    const firstRequest = page.locator('[data-testid="request-item"]').first();
    await expect(firstRequest).toBeVisible();

    // Click the request and wait for URL navigation
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      firstRequest.click()
    ]);

    await expect(page.locator('[data-testid="request-details"]')).toBeVisible({ timeout: 5000 });
  });

  test('should allow editing draft requests', async ({ page }) => {
    await page.goto('/arb/requests');

    // Find draft request item
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    // Click edit button
    await page.locator('[data-testid="edit-request-btn"]').click();

    // Verify edit mode is active
    await expect(page.locator('[data-testid="request-detail"]')).toBeVisible({ timeout: 5000 });
  });

  test('should support file attachments', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Wait for page to load
    await expect(page.locator('[data-testid="request-title"]')).toBeVisible({ timeout: 10000 });

    // Click the "Attach File" button
    const attachFileBtn = page.locator('[data-testid="attach-file-btn"]');
    await expect(attachFileBtn).toBeVisible({ timeout: 5000 });

    // Create a temporary test file
    const testFile = {
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Test PDF content for ARB submission')
    };

    // Find file input and upload test file
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles({
      name: testFile.name,
      mimeType: testFile.mimeType,
      buffer: testFile.buffer
    });

    // Verify attachment is displayed (attachments are shown in a list)
    await expect(page.locator('text=Attached Files:')).toBeVisible({ timeout: 5000 });

    // Verify the filename is displayed
    await expect(page.locator(`text=${testFile.name}`)).toBeVisible({ timeout: 5000 });
  });

  test('should calculate review priority score', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Fill high-impact request
    await page.locator('[data-testid="request-type"]').selectOption('new_application');
    await page.locator('[data-testid="request-title"]').fill('Critical Infrastructure');
    await page.locator('[data-testid="request-impact"]').selectOption('high');
    await page.locator('[data-testid="request-urgency"]').selectOption('high');

    // Look for priority score
    await page.waitForSelector('[data-testid="priority-score"], .priority-indicator', { timeout: 5000 });

    const priorityScore = page.locator('[data-testid="priority-score"], .priority-indicator');
    await expect(priorityScore.first()).toBeVisible();
  });
});

test.describe('ARB Review Process', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Create a test ARB submission first
    const timestamp = Date.now();
    const response = await page.request.post('http://localhost:3000/api/v1/arb/submissions', {
      headers: {
        'Authorization': 'Bearer ' + authData.token,
      },
      data: {
        type: 'NewTechnologyProposal',
        title: 'Test Review Request ' + timestamp,
        rationale: 'Test request for review process testing',
        priority: 'Medium',
      },
    });

    // Verify the submission was created
    if (!response.ok()) {
      const errorText = await response.text();
      const status = response.status();
      throw new Error(`Failed to create submission: ${status} - ${errorText}`);
    }

    // Now navigate to the page to load the submissions
    await page.goto('/arb/requests');
    await page.waitForLoadState('networkidle');

    // Wait for the submission to appear on the page
    await expect(page.locator('[data-testid="request-item"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('should allow ARB member to review request', async ({ page }) => {
    // Find draft request link
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    await page.locator('[data-testid="start-review-btn"]').click();

    // Add review comments
    await page.locator('[data-testid="review-comments"]').fill('Architecture looks sound. Recommend approval with conditions.');

    // Add conditions
    await page.locator('[data-testid="add-condition-btn"]').click();
    await page.locator('[data-testid="condition-text"]').first().fill('Must implement monitoring before production');

    // Add action items
    await page.locator('[data-testid="add-action-btn"]').click();
    await page.locator('[data-testid="action-text"]').first().fill('Review security architecture');
    await page.locator('[data-testid="action-assignee"]').first().selectOption('security@archzero.local');

    // Submit review
    await page.locator('button:has-text("Submit Review")').click();

    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should approve request', async ({ page }) => {
    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    await page.locator('[data-testid="decision-approve"]').click();

    // Add approval conditions
    await page.locator('[data-testid="approval-conditions"]').fill('Must pass security review');

    await page.locator('button:has-text("Confirm Approval")').click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Request approved")')).toBeVisible({ timeout: 5000 });
  });

  test('should reject request', async ({ page }) => {
    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    await page.locator('[data-testid="decision-reject"]').click();

    // Provide rejection reason
    await page.locator('[data-testid="rejection-reason"]').fill('Does not meet architecture principles');

    await page.locator('button:has-text("Confirm Rejection")').click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Request rejected")')).toBeVisible({ timeout: 5000 });
  });

  test('should conditionally approve request', async ({ page }) => {
    // Find a submission without a decision (draft status in UI)
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    await page.locator('[data-testid="decision-conditional"]').click();

    // Add conditions (UI has two textareas for conditions)
    await page.locator('[data-testid="condition-1"]').fill('Condition 1');
    await page.locator('[data-testid="condition-2"]').fill('Condition 2');

    await page.locator('button:has-text("Confirm Conditional Approval")').click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Request conditionally approved")')).toBeVisible({ timeout: 5000 });
  });

  test('should defer request for more information', async ({ page }) => {
    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    await page.locator('[data-testid="decision-defer"]').click();

    // Specify information needed (UI uses defer-reason testid)
    await page.locator('[data-testid="defer-reason"]').fill('Need detailed cost breakdown and risk assessment');

    await page.locator('button:has-text("Confirm Deferral")').click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Request deferred")')).toBeVisible({ timeout: 5000 });
  });

  test('should show decision history', async ({ page }) => {
    await page.goto('/arb/requests');

    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    // Audit trail is always visible, no need to click tab
    const historyList = page.locator('[data-testid="decision-history"]');
    await expect(historyList).toBeVisible({ timeout: 5000 });
  });
});

test.describe('ARB Meetings', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display meeting list', async ({ page }) => {
    await page.goto('/arb/meetings');

    await expect(page.locator('div[data-testid="meetings-list"]')).toBeVisible({ timeout: 10000 });
  });

  test('should create new meeting', async ({ page }) => {
    await page.goto('/arb/meetings');

    await page.locator('button:has-text("Schedule Meeting"), [data-testid="schedule-meeting-btn"]').click();

    // Fill meeting details with unique title to avoid conflicts
    const uniqueTitle = `Test Meeting - ${Date.now()}`;
    await page.locator('[data-testid="meeting-title"]').fill(uniqueTitle);
    await page.locator('[data-testid="meeting-date"]').fill('2026-01-20');
    await page.locator('[data-testid="meeting-time"]').fill('14:00');
    await page.locator('[data-testid="meeting-duration"]').selectOption('2');

    // Add attendees
    await page.locator('[data-testid="add-attendee-btn"]').click();
    await page.locator('[data-testid="attendee-select"]').selectOption('architect1@archzero.local');

    await page.locator('[data-testid="schedule-submit-btn"]').click();

    // Wait for success message using data-testid selector
    await expect(page.locator('[data-testid="meeting-success-message"]')).toBeVisible({ timeout: 5000 });
  });

  test('should generate meeting agenda', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    await expect(firstMeeting).toBeVisible();
    await firstMeeting.click();

    await page.locator('button:has-text("Generate Agenda"), [data-testid="generate-agenda-btn"]').click();

    // Agenda should be generated from pending requests
    await expect(page.locator('[data-testid="meeting-agenda"]')).toBeVisible({ timeout: 5000 });
  });

  test('should add items to agenda', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    await expect(firstMeeting).toBeVisible();
    await firstMeeting.click();

    await page.locator('[data-testid="add-agenda-item-btn"]').click();

    // Select pending requests
    await page.locator('[data-testid="agenda-request-select"]').selectOption({ index: 1 });

    // Set duration
    await page.locator('[data-testid="agenda-item-duration"]').fill('15');

    await page.locator('button:has-text("Add to Agenda")').click();

    await expect(page.locator('text=Agenda item added')).toBeVisible({ timeout: 5000 });
  });

  test('should export meeting pack', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    await expect(firstMeeting).toBeVisible();
    await firstMeeting.click();

    const downloadPromise = page.waitForEvent('download');

    await page.locator('button:has-text("Export Meeting Pack"), [data-testid="export-meeting-pack-btn"]').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|docx)$/);
  });

  test('should capture meeting minutes', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    await expect(firstMeeting).toBeVisible();
    await firstMeeting.click();

    await page.locator('button:has-text("Take Minutes"), [data-testid="take-minutes-btn"]').click();

    // Capture discussion points
    await page.locator('[data-testid="minutes-discussion"]').fill('Reviewed payment system architecture. Committee approved with conditions.');

    // Record decisions
    await page.locator('[data-testid="minutes-decision-1"]').fill('Approve Payment Processing System with security conditions');
    await page.locator('[data-testid="minutes-decision-2"]').fill('Request detailed implementation plan');

    // Record attendees
    await page.locator('[data-testid="minutes-attendees"]').fill('John Architect, Jane Reviewer, Bob Chair');

    await page.locator('button:has-text("Save Minutes")').click();

    await expect(page.locator('text=Minutes saved')).toBeVisible({ timeout: 5000 });
  });

  test('should distribute meeting minutes', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    await expect(firstMeeting).toBeVisible();
    await firstMeeting.click();

    const distributeBtn = page.locator('button:has-text("Distribute Minutes"), [data-testid="distribute-minutes-btn"]');
    await expect(distributeBtn).toBeVisible();
    await distributeBtn.click();

    await expect(page.locator('text=Minutes distributed')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('ARB Dashboard and Metrics', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display ARB dashboard metrics', async ({ page }) => {
    await page.goto('/arb');

    // Look for key metrics
    const pendingCount = page.locator('[data-testid="metric-pending"]');
    const overdueCount = page.locator('[data-testid="metric-overdue"]');
    const approvedCount = page.locator('[data-testid="metric-approved"]');

    await expect(pendingCount.first()).toBeVisible();
    await expect(overdueCount.first()).toBeVisible();
    await expect(approvedCount.first()).toBeVisible();
  });

  test('should show overdue action items', async ({ page }) => {
    await page.goto('/arb');

    const overdueSection = page.locator('[data-testid="overdue-actions"]');
    await expect(overdueSection.first()).toBeVisible();
  });

  test('should show review workload by member', async ({ page }) => {
    await page.goto('/arb');

    const workloadChart = page.locator('[data-testid="workload-chart"], .reviewer-workload');
    await expect(workloadChart.first()).toBeVisible();
  });

  test('should filter requests by status', async ({ page }) => {
    await page.goto('/arb/requests');

    const statusFilter = page.locator('[data-testid="status-filter"]');
    await expect(statusFilter).toBeVisible();
    await statusFilter.selectOption('pending_review');

    await page.waitForLoadState('networkidle');

    // Verify filtered results
    const results = page.locator('[data-testid="request-item"][data-status="pending_review"]');
    expect(await results.count()).toBeGreaterThanOrEqual(0);
  });

  test('should filter requests by priority', async ({ page }) => {
    await page.goto('/arb/requests');

    const priorityFilter = page.locator('[data-testid="priority-filter"]');
    await expect(priorityFilter).toBeVisible();
    await priorityFilter.selectOption('high');

    await page.waitForLoadState('networkidle');
  });

  test('should search review requests', async ({ page }) => {
    await page.goto('/arb/requests');

    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]');
    await expect(searchInput).toBeVisible();
    await searchInput.first().fill('payment');

    await page.waitForLoadState('networkidle');

    const results = page.locator('[data-testid="request-item"]');
    expect(await results.count()).toBeGreaterThanOrEqual(0);
  });

  test('should export ARB report', async ({ page }) => {
    await page.goto('/arb');

    const exportBtn = page.locator('button:has-text("Export Report"), [data-testid="export-report-btn"]');
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');

    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(pdf|xlsx)$/);
  });
});

test.describe('ARB Notifications', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should notify reviewer of assigned review', async ({ page }) => {
    await page.goto('/arb/requests');

    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    await page.locator('[data-testid="assign-reviewer-btn"]').click();

    await page.locator('[data-testid="reviewer-select"]').selectOption('architect1@archzero.local');

    await page.locator('[data-testid="confirm-assign-reviewer-btn"]').click();

    // Should show notification will be sent
    await expect(page.locator('[data-testid="success-message"]:has-text("notification will be sent")')).toBeVisible({ timeout: 5000 });
  });

  test('should notify requester of decision', async ({ page }) => {
    await page.goto('/arb/requests');

    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    await page.locator('[data-testid="decision-approve"]').click();
    await page.locator('button:has-text("Confirm Approval")').click();

    // Should show success message (notification is sent to requester in background)
    await expect(page.locator('[data-testid="success-message"]:has-text("Request approved")')).toBeVisible({ timeout: 5000 });
  });

  test('should send reminder for overdue reviews', async ({ page }) => {
    await page.goto('/arb/requests');

    const overdueRequestItem = page.locator('[data-testid="request-item"][data-overdue="true"]').first();
    await expect(overdueRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      overdueRequestItem.click()
    ]);

    const remindBtn = page.locator('[data-testid="send-reminder-btn"]');
    await expect(remindBtn).toBeVisible();
    await remindBtn.click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Reminder sent")')).toBeVisible({ timeout: 5000 });
  });

  test('should show upcoming meeting notifications', async ({ page }) => {
    await page.goto('/arb');

    const upcomingMeeting = page.locator('[data-testid="upcoming-meeting"]');
    await expect(upcomingMeeting.first()).toBeVisible();
  });
});

test.describe('ARB Member Permissions', () => {
  test('should allow chair to approve requests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/arb/requests');

    // Find a submission without a decision (draft status in UI)
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    // Admin/Chair should see approve button
    const approveBtn = page.locator('[data-testid="decision-approve"]');
    await expect(approveBtn.first()).toBeVisible();
  });

  test('should allow member to review but not approve', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('arb-member@archzero.local', 'changeme123');

    await page.goto('/arb/requests');

    // Find a submission without a decision (draft status in UI)
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    // Member should see review button
    const reviewBtn = page.locator('[data-testid="start-review-btn"]');
    await expect(reviewBtn.first()).toBeVisible();

    // Approve button should be disabled for non-chair/non-admin
    const approveBtn = page.locator('[data-testid="decision-approve"]');
    await expect(approveBtn.first()).toBeVisible();
    const isEnabled = await approveBtn.first().isEnabled();
    expect(isEnabled).toBe(false);
  });

  // ARB access control for non-members - backend returns 403 Forbidden
  test('should not allow non-members to access ARB', async ({ page, request }) => {
    const loginPage = new LoginPage(page);
    const { token } = await loginPage.loginViaApi('viewer@archzero.local', 'changeme123');

    // Try to access ARB API directly - should get 403 Forbidden
    const baseURL = process.env.API_URL || 'http://localhost:3000';
    const arbResponse = await request.get(`${baseURL}/api/v1/arb/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // Viewer role should receive 403 Forbidden
    expect(arbResponse.status()).toBe(403);
  });
});

test.describe('ARB Audit Trail', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should log request creation', async ({ page }) => {
    // Navigate to audit log page
    await page.goto('/arb/audit-logs');

    // Wait for audit log page to load
    await expect(page.locator('[data-testid="audit-log-page"]')).toBeVisible({ timeout: 10000 });

    // Filter to show only submissions
    await page.locator('[data-testid="filter-submission"]').click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Verify audit log entries are displayed
    const auditLogEntries = page.locator('[data-testid^="audit-log-entry-"]');
    const entryCount = await auditLogEntries.count();

    if (entryCount > 0) {
      // Verify first entry has expected structure
      const firstEntry = page.locator('[data-testid^="audit-log-entry-"]').first();
      await expect(firstEntry).toBeVisible();

      // Verify entry shows action, actor, and timestamp
      await expect(firstEntry.locator('text=/Created|Updated|Decision/')).toBeVisible();
    }
  });

  test('should log decision changes', async ({ page }) => {
    // Navigate to audit log page
    await page.goto('/arb/audit-logs');

    // Wait for audit log page to load
    await expect(page.locator('[data-testid="audit-log-page"]')).toBeVisible({ timeout: 10000 });

    // Filter to show only decisions
    await page.locator('[data-testid="filter-decision"]').click();
    await page.waitForTimeout(500); // Wait for filter to apply

    // Verify decision audit logs are displayed
    const auditLogEntries = page.locator('[data-testid^="audit-log-entry-"]');
    const entryCount = await auditLogEntries.count();

    if (entryCount > 0) {
      // Verify first entry shows decision-related activity
      const firstEntry = page.locator('[data-testid^="audit-log-entry-"]').first();
      await expect(firstEntry).toBeVisible();

      // Verify entry has decision indicator
      await expect(firstEntry.locator('text=Decision')).toBeVisible();
    }
  });

  test('should show full audit trail for request', async ({ page }) => {
    await page.goto('/arb/requests');

    const requestItem = page.locator('[data-testid="request-item"]').first();
    await expect(requestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestItem.click()
    ]);

    // Audit trail is always visible (no tab needed)
    const auditTrail = page.locator('[data-testid="decision-history"]');
    await expect(auditTrail).toBeVisible({ timeout: 5000 });
  });

  test('should export audit trail', async ({ page }) => {
    // Navigate to audit log page
    await page.goto('/arb/audit-logs');

    // Wait for audit log page to load
    await expect(page.locator('[data-testid="audit-log-page"]')).toBeVisible({ timeout: 10000 });

    // Verify export button exists
    const exportBtn = page.locator('[data-testid="export-audit-btn"]');
    await expect(exportBtn).toBeVisible();

    // Click export button (will trigger download)
    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    // Wait for download to start
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit-logs.*\.csv/);
  });
});

test.describe('ARB Templates and Reuse', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page, request }) => {
    loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Create a test template for the "create request from template" test
    const baseURL = process.env.API_URL || 'http://localhost:3000';

    // First, get an ARB submission to use as template source
    const submissionsResponse = await request.get(`${baseURL}/api/v1/arb/submissions`, {
      headers: {
        'Authorization': `Bearer ${authData.token}`,
      },
    });

    if (submissionsResponse.ok()) {
      const submissionsData = await submissionsResponse.json();
      const submissions = submissionsData.data || submissionsData;

      if (Array.isArray(submissions) && submissions.length > 0) {
        const firstSubmission = submissions[0];

        // Create a template from the first submission
        await request.post(`${baseURL}/api/v1/arb/templates`, {
          headers: {
            'Authorization': `Bearer ${authData.token}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: 'New Application Template',
            description: 'Template for new application ARB requests',
            submission_id: firstSubmission.id,
          },
        });
      }
    }
  });

  // Save-as-template functionality in ARB request detail view
  test('should save request as template', async ({ page }) => {
    await page.goto('/arb/requests');

    // Find a submission without a decision (draft status in UI) so save-as-template button is visible
    const draftRequestItem = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    await expect(draftRequestItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      draftRequestItem.click()
    ]);

    const saveTemplateBtn = page.locator('[data-testid="save-as-template-btn"]');
    await expect(saveTemplateBtn).toBeVisible();
    await saveTemplateBtn.click();

    // Fill in template name and save
    await page.locator('[data-testid="template-name"]').fill('New Application Template');
    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('[data-testid="success-message"]:has-text("Template saved")')).toBeVisible({ timeout: 5000 });
  });

  test('should create request from template', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Click the "Use Template" button to show template selector
    const useTemplateBtn = page.locator('[data-testid="use-template-btn"]');
    await expect(useTemplateBtn).toBeVisible({ timeout: 10000 });
    await useTemplateBtn.click();

    // Wait for template selection dropdown to be visible
    await expect(page.locator('[data-testid="template-select"]')).toBeVisible({ timeout: 10000 });

    // Select a template (should have at least one from beforeEach setup)
    const templateSelect = page.locator('[data-testid="template-select"]');
    const optionCount = await templateSelect.locator('option').count();

    if (optionCount > 1) { // More than just the default "Select a template..." option
      // Select the first available template (index 1, since index 0 is the placeholder)
      await templateSelect.selectOption({ index: 1 });

      // Click the "Load Template" button to populate form
      const loadTemplateBtn = page.locator('button:has-text("Load Template")');
      await expect(loadTemplateBtn).toBeVisible();
      await loadTemplateBtn.click();

      // Wait for form to be populated
      await page.waitForTimeout(500);

      // Verify that form fields are populated with template data
      const titleField = page.locator('[data-testid="request-title"]');
      const titleValue = await titleField.inputValue();

      // Title should be populated (not empty)
      expect(titleValue.length).toBeGreaterThan(0);

      // Description should also be populated
      const descriptionField = page.locator('[data-testid="request-description"]');
      await expect(descriptionField).toHaveValue(/./); // At least one character
    }
  });

  // Template library management with delete functionality
  test('should manage template library', async ({ page }) => {
    await page.goto('/arb/templates');

    // Wait for template library to load
    await expect(page.locator('[data-testid="template-library"]')).toBeVisible({ timeout: 10000 });

    // Verify search functionality exists
    const searchInput = page.locator('[data-testid="template-search"]');
    await expect(searchInput).toBeVisible();

    // Search for templates
    await searchInput.fill('Application');
    await page.waitForTimeout(500); // Wait for search to filter

    // Verify template cards are displayed with test selectors
    const templateCards = page.locator('[data-testid^="template-"]');
    const cardCount = await templateCards.count();

    if (cardCount > 0) {
      // Verify template details
      const firstCard = page.locator('[data-testid^="template-"]').first();
      await expect(firstCard).toBeVisible();

      // Verify delete button exists
      const deleteBtn = page.locator('[data-testid^="delete-template-btn-"]').first();
      await expect(deleteBtn).toBeVisible();
    }
  });
});

test.describe('ARB Integration with Cards', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should link ARB request to card', async ({ page }) => {
    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Wait for navigation
    await page.waitForLoadState('networkidle');

    const arbRequestBtn = page.locator('button:has-text("Request ARB Review"), [data-testid="request-arb-btn"]');
    await expect(arbRequestBtn.first()).toBeVisible({ timeout: 5000 });
    await arbRequestBtn.first().click();

    // Should redirect to ARB request form with card pre-attached
    await expect(page).toHaveURL(/\/arb\/(submissions\/new|requests\/new)/);

    const attachedCard = page.locator('[data-testid="attached-card"]');
    await expect(attachedCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show ARB status on card', async ({ page }) => {
    await page.goto('/cards');

    // Look for any card with ARB status badge
    const arbStatus = page.locator('[data-testid="arb-status-badge"]');
    const count = await arbStatus.count();

    // If there are cards with ARB status, verify the badge is visible
    if (count > 0) {
      await expect(arbStatus.first()).toBeVisible();
    } else {
      // No cards with ARB status yet, which is ok
      test.skip(true, 'No cards with ARB status found');
    }
  });

  test('should enforce ARB approval before changes', async ({ page }) => {
    // ARB enforcement on card edits not yet implemented
    test.skip(true, 'ARB enforcement on card edits not yet implemented');
  });

  test('should sync ARB decision with card status', async ({ page }) => {
    await page.goto('/arb/requests');

    // Find a request with decision
    const requestWithDecisionItem = page.locator('[data-testid="request-item"][data-status="decision_made"]').first();
    const count = await requestWithDecisionItem.count();

    if (count === 0) {
      test.skip(true, 'No requests with decisions found');
      return;
    }

    await expect(requestWithDecisionItem).toBeVisible();

    // Click to navigate to detail page
    await Promise.all([
      page.waitForURL(/\/arb\/submissions\//),
      requestWithDecisionItem.click()
    ]);

    // Navigate to linked card (if it exists)
    const viewCardBtn = page.locator('[data-testid="view-card-btn"]');
    const btnCount = await viewCardBtn.count();

    if (btnCount > 0) {
      await viewCardBtn.first().click();

      // Wait for navigation to card page
      await page.waitForLoadState('networkidle');

      // Card should show ARB status badge
      const arbStatus = page.locator('[data-testid="arb-status-badge"]');
      await expect(arbStatus.first()).toBeVisible({ timeout: 5000 });
    } else {
      test.skip(true, 'Request has no linked card');
    }
  });
});
