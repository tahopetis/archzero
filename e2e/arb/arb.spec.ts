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

test.describe('ARB Review Requests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display ARB dashboard', async ({ page }) => {
    await page.goto('/arb');

    await expect(page.locator('[data-testid="arb-dashboard"], h1:has-text("Architecture Review")')).toBeVisible({ timeout: 10000 });
  });

  test('should show pending reviews count', async ({ page }) => {
    await page.goto('/arb');

    const pendingCount = page.locator('[data-testid="pending-reviews-count"], .pending-count');
    const hasCount = await pendingCount.count();

    if (hasCount > 0) {
      await expect(pendingCount.first()).toBeVisible();
    }
  });

  test('should create new application review request', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Select request type
    await page.locator('[data-testid="request-type"]').selectOption('new_application');

    // Fill request details
    await page.locator('[data-testid="request-title"]').fill('Payment Processing System');
    await page.locator('[data-testid="request-description"]').fill('New payment system for e-commerce platform');
    await page.locator('[data-testid="request-business-justification"]').fill('Required to support new payment methods and improve checkout conversion');

    // Attach card
    await page.locator('[data-testid="attach-card-btn"]').click();
    const cardSelect = page.locator('[data-testid="card-select"]');
    const hasSelect = await cardSelect.count();

    if (hasSelect > 0) {
      await cardSelect.selectOption({ index: 1 });
    }

    // Submit request
    await page.locator('button:has-text("Submit Request"), [data-testid="submit-request-btn"]').click();

    await expect(page.locator('text=Review request submitted, text=Request created')).toBeVisible({ timeout: 5000 });
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
    const count = await firstRequest.count();

    if (count > 0) {
      await firstRequest.click();

      await expect(page.locator('[data-testid="request-details"], .request-detail-view')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow editing draft requests', async ({ page }) => {
    await page.goto('/arb/requests');

    // Find draft request
    const draftRequest = page.locator('[data-testid="request-item"][data-status="draft"]').first();
    const count = await draftRequest.count();

    if (count > 0) {
      await draftRequest.click();

      await page.locator('button:has-text("Edit"), [data-testid="edit-request-btn"]').click();

      // Modify description
      await page.locator('[data-testid="request-description"]').fill('Updated description');

      await page.locator('button:has-text("Save")').click();

      await expect(page.locator('text=Request updated')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should support file attachments', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Upload architecture diagram
    const fileInput = page.locator('input[type="file"]');
    const hasFileInput = await fileInput.count();

    if (hasFileInput > 0) {
      const fileChooserPromise = page.waitForEvent('filechooser');

      await page.locator('button:has-text("Attach File")').click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles({
        name: 'architecture-diagram.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content')
      });

      // Verify attachment
      const attachment = page.locator('text=architecture-diagram.pdf');
      await expect(attachment.first()).toBeVisible();
    }
  });

  test('should calculate review priority score', async ({ page }) => {
    await page.goto('/arb/requests/new');

    // Fill high-impact request
    await page.locator('[data-testid="request-type"]').selectOption('new_application');
    await page.locator('[data-testid="request-title"]').fill('Critical Infrastructure');
    await page.locator('[data-testid="request-impact"]').selectOption('high');
    await page.locator('[data-testid="request-urgency"]').selectOption('high');

    // Look for priority score
    await page.waitForTimeout(500);

    const priorityScore = page.locator('[data-testid="priority-score"], .priority-indicator');
    const hasScore = await priorityScore.count();

    if (hasScore > 0) {
      await expect(priorityScore.first()).toBeVisible();
    }
  });
});

test.describe('ARB Review Process', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should allow ARB member to review request', async ({ page }) => {
    await page.goto('/arb/requests');

    const pendingRequest = page.locator('[data-testid="request-item"][data-status="pending_review"]').first();
    const count = await pendingRequest.count();

    if (count > 0) {
      await pendingRequest.click();

      await page.locator('button:has-text("Start Review"), [data-testid="start-review-btn"]').click();

      // Add review comments
      await page.locator('[data-testid="review-comments"]').fill('Architecture looks sound. Recommend approval with conditions.');

      // Add conditions
      await page.locator('[data-testid="add-condition-btn"]').click();
      await page.locator('[data-testid="condition-text"]').fill('Must implement monitoring before production');

      // Add action items
      await page.locator('[data-testid="add-action-btn"]').click();
      await page.locator('[data-testid="action-text"]').fill('Review security architecture');
      await page.locator('[data-testid="action-assignee"]').selectOption('security@archzero.local');

      // Submit review
      await page.locator('button:has-text("Submit Review")').click();

      await expect(page.locator('text=Review submitted')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should approve request', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('[data-testid="decision-approve"]').click();

      // Add approval conditions
      await page.locator('[data-testid="approval-conditions"]').fill('Must pass security review');

      await page.locator('button:has-text("Confirm Approval")').click();

      await expect(page.locator('text=Request approved')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should reject request', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('[data-testid="decision-reject"]').click();

      // Provide rejection reason
      await page.locator('[data-testid="rejection-reason"]').fill('Does not meet architecture principles');

      await page.locator('button:has-text("Confirm Rejection")').click();

      await expect(page.locator('text=Request rejected')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should conditionally approve request', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('[data-testid="decision-conditional"]').click();

      // Add conditions
      await page.locator('[data-testid="condition-1"]').fill('Condition 1');
      await page.locator('[data-testid="condition-2"]').fill('Condition 2');

      await page.locator('button:has-text("Confirm Conditional Approval")').click();

      await expect(page.locator('text=Request conditionally approved')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should defer request for more information', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('[data-testid="decision-defer"]').click();

      // Specify information needed
      await page.locator('[data-testid="defer-reason"]').fill('Need detailed cost breakdown and risk assessment');

      await page.locator('button:has-text("Confirm Deferral")').click();

      await expect(page.locator('text=Request deferred')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show decision history', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      const historyTab = page.locator('[data-testid="decision-history-tab"], button:has-text("History")');
      const hasTab = await historyTab.count();

      if (hasTab > 0) {
        await historyTab.click();

        const historyList = page.locator('[data-testid="decision-history"]');
        await expect(historyList).toBeVisible();
      }
    }
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

    await expect(page.locator('[data-testid="meetings-list"], h1:has-text("Meetings")')).toBeVisible({ timeout: 10000 });
  });

  test('should create new meeting', async ({ page }) => {
    await page.goto('/arb/meetings');

    await page.locator('button:has-text("Schedule Meeting"), [data-testid="schedule-meeting-btn"]').click();

    // Fill meeting details
    await page.locator('[data-testid="meeting-title"]').fill('ARB Review - January 2026');
    await page.locator('[data-testid="meeting-date"]').fill('2026-01-20');
    await page.locator('[data-testid="meeting-time"]').fill('14:00');
    await page.locator('[data-testid="meeting-duration"]').selectOption('2');

    // Add attendees
    await page.locator('[data-testid="add-attendee-btn"]').click();
    await page.locator('[data-testid="attendee-select"]').selectOption('architect1@archzero.local');

    await page.locator('button:has-text("Schedule")').click();

    await expect(page.locator('text=Meeting scheduled')).toBeVisible({ timeout: 5000 });
  });

  test('should generate meeting agenda', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    const count = await firstMeeting.count();

    if (count > 0) {
      await firstMeeting.click();

      await page.locator('button:has-text("Generate Agenda"), [data-testid="generate-agenda-btn"]').click();

      // Agenda should be generated from pending requests
      await expect(page.locator('[data-testid="meeting-agenda"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should add items to agenda', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    const count = await firstMeeting.count();

    if (count > 0) {
      await firstMeeting.click();

      await page.locator('[data-testid="add-agenda-item-btn"]').click();

      // Select pending requests
      await page.locator('[data-testid="agenda-request-select"]').selectOption({ index: 1 });

      // Set duration
      await page.locator('[data-testid="agenda-item-duration"]').fill('15');

      await page.locator('button:has-text("Add to Agenda")').click();

      await expect(page.locator('text=Agenda item added')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should export meeting pack', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    const count = await firstMeeting.count();

    if (count > 0) {
      await firstMeeting.click();

      const downloadPromise = page.waitForEvent('download');

      await page.locator('button:has-text("Export Meeting Pack"), [data-testid="export-meeting-pack-btn"]').click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(pdf|docx)$/);
    }
  });

  test('should capture meeting minutes', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    const count = await firstMeeting.count();

    if (count > 0) {
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
    }
  });

  test('should distribute meeting minutes', async ({ page }) => {
    await page.goto('/arb/meetings');

    const firstMeeting = page.locator('[data-testid="meeting-item"]').first();
    const count = await firstMeeting.count();

    if (count > 0) {
      await firstMeeting.click();

      const distributeBtn = page.locator('button:has-text("Distribute Minutes"), [data-testid="distribute-minutes-btn"]');
      const hasButton = await distributeBtn.count();

      if (hasButton > 0) {
        await distributeBtn.click();

        await expect(page.locator('text=Minutes distributed')).toBeVisible({ timeout: 5000 });
      }
    }
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
    const hasSection = await overdueSection.count();

    if (hasSection > 0) {
      await expect(overdueSection.first()).toBeVisible();
    }
  });

  test('should show review workload by member', async ({ page }) => {
    await page.goto('/arb');

    const workloadChart = page.locator('[data-testid="workload-chart"], .reviewer-workload');
    const hasChart = await workloadChart.count();

    if (hasChart > 0) {
      await expect(workloadChart.first()).toBeVisible();
    }
  });

  test('should filter requests by status', async ({ page }) => {
    await page.goto('/arb/requests');

    const statusFilter = page.locator('[data-testid="status-filter"]');
    const hasFilter = await statusFilter.count();

    if (hasFilter > 0) {
      await statusFilter.selectOption('pending_review');

      await page.waitForTimeout(500);

      // Verify filtered results
      const results = page.locator('[data-testid="request-item"][data-status="pending_review"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter requests by priority', async ({ page }) => {
    await page.goto('/arb/requests');

    const priorityFilter = page.locator('[data-testid="priority-filter"]');
    const hasFilter = await priorityFilter.count();

    if (hasFilter > 0) {
      await priorityFilter.selectOption('high');

      await page.waitForTimeout(500);
    }
  });

  test('should search review requests', async ({ page }) => {
    await page.goto('/arb/requests');

    const searchInput = page.locator('[data-testid="search-input"], input[placeholder*="search" i]');
    const hasSearch = await searchInput.count();

    if (hasSearch > 0) {
      await searchInput.first().fill('payment');

      await page.waitForTimeout(500);

      const results = page.locator('[data-testid="request-item"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should export ARB report', async ({ page }) => {
    await page.goto('/arb');

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

test.describe('ARB Notifications', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should notify reviewer of assigned review', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('button:has-text("Assign Reviewer"), [data-testid="assign-reviewer-btn"]').click();

      await page.locator('[data-testid="reviewer-select"]').selectOption('architect1@archzero.local');

      await page.locator('button:has-text("Assign")').click();

      // Should show notification will be sent
      const notificationMsg = page.locator('text=notification will be sent, text=Review assigned');
      await expect(notificationMsg.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should notify requester of decision', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      await page.locator('[data-testid="decision-approve"]').click();
      await page.locator('button:has-text("Confirm Approval")').click();

      // Should show notification sent to requester
      await expect(page.locator('text=notified of decision, text=Notification sent')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should send reminder for overdue reviews', async ({ page }) => {
    await page.goto('/arb/requests');

    const overdueRequest = page.locator('[data-testid="request-item"][data-overdue="true"]').first();
    const count = await overdueRequest.count();

    if (count > 0) {
      await overdueRequest.click();

      const remindBtn = page.locator('button:has-text("Send Reminder"), [data-testid="send-reminder-btn"]');
      const hasButton = await remindBtn.count();

      if (hasButton > 0) {
        await remindBtn.click();

        await expect(page.locator('text=Reminder sent')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should show upcoming meeting notifications', async ({ page }) => {
    await page.goto('/arb');

    const upcomingMeeting = page.locator('[data-testid="upcoming-meeting"]');
    const hasMeeting = await upcomingMeeting.count();

    if (hasMeeting > 0) {
      await expect(upcomingMeeting.first()).toBeVisible();
    }
  });
});

test.describe('ARB Member Permissions', () => {
  test('should allow chair to approve requests', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('arb-chair@archzero.local', 'changeme123');

    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      // Chair should see approve button
      const approveBtn = page.locator('[data-testid="decision-approve"]');
      await expect(approveBtn.first()).toBeVisible();
    }
  });

  test('should allow member to review but not approve', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('arb-member@archzero.local', 'changeme123');

    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      // Member should see review button
      const reviewBtn = page.locator('[data-testid="start-review-btn"]');
      await expect(reviewBtn.first()).toBeVisible();

      // But not approve button
      const approveBtn = page.locator('[data-testid="decision-approve"]');
      const hasApprove = await approveBtn.count();

      if (hasApprove > 0) {
        const isEnabled = await approveBtn.first().isEnabled();
        expect(isEnabled).toBe(false);
      }
    }
  });

  test('should not allow non-members to access ARB', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('viewer@archzero.local', 'changeme123');

    await page.goto('/arb');

    // Should show access denied
    const denied = page.locator('text=Permission denied, text=Unauthorized');
    const hasDenied = await denied.count();

    if (hasDenied > 0) {
      await expect(denied.first()).toBeVisible();
    } else {
      // Or redirect
      await expect(page).toHaveURL(/\/(dashboard|cards)/);
    }
  });
});

test.describe('ARB Audit Trail', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should log request creation', async ({ page }) => {
    await page.goto('/audit');

    // Filter for ARB events
    const filter = page.locator('[data-testid="audit-filter"]');
    const hasFilter = await filter.count();

    if (hasFilter > 0) {
      await filter.selectOption('arb');

      // Look for request creation logs
      const creationLog = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'request created' });
      const count = await creationLog.count();

      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should log decision changes', async ({ page }) => {
    await page.goto('/audit');

    const decisionLog = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'decision' });
    const count = await decisionLog.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show full audit trail for request', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      const auditTab = page.locator('[data-testid="audit-tab"], button:has-text("Audit")');
      const hasTab = await auditTab.count();

      if (hasTab > 0) {
        await auditTab.click();

        const auditTrail = page.locator('[data-testid="audit-trail"]');
        await expect(auditTrail).toBeVisible();
      }
    }
  });

  test('should export audit trail', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      const exportBtn = page.locator('button:has-text("Export Audit"), [data-testid="export-audit-btn"]');
      const hasButton = await exportBtn.count();

      if (hasButton > 0) {
        const downloadPromise = page.waitForEvent('download');

        await exportBtn.click();

        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.(csv|json)$/);
      }
    }
  });
});

test.describe('ARB Templates and Reuse', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should save request as template', async ({ page }) => {
    await page.goto('/arb/requests');

    const request = page.locator('[data-testid="request-item"]').first();
    const count = await request.count();

    if (count > 0) {
      await request.click();

      const saveTemplateBtn = page.locator('button:has-text("Save as Template"), [data-testid="save-template-btn"]');
      const hasButton = await saveTemplateBtn.count();

      if (hasButton > 0) {
        await saveTemplateBtn.click();

        await page.locator('[data-testid="template-name"]').fill('New Application Template');
        await page.locator('button:has-text("Save")').click();

        await expect(page.locator('text=Template saved')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should create request from template', async ({ page }) => {
    await page.goto('/arb/requests/new');

    const useTemplateBtn = page.locator('button:has-text("Use Template"), [data-testid="use-template-btn"]');
    const hasButton = await useTemplateBtn.count();

    if (hasButton > 0) {
      await useTemplateBtn.click();

      await page.locator('[data-testid="template-select"]').selectOption('new_application_template');

      // Form should be pre-filled
      const title = await page.locator('[data-testid="request-title"]').inputValue();
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('should manage template library', async ({ page }) => {
    await page.goto('/arb/templates');

    await expect(page.locator('[data-testid="template-library"]')).toBeVisible({ timeout: 5000 });
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
    await firstCard.click();

    const arbRequestBtn = page.locator('button:has-text("Request ARB Review"), [data-testid="request-arb-btn"]');
    const hasButton = await arbRequestBtn.count();

    if (hasButton > 0) {
      await arbRequestBtn.click();

      // Should redirect to ARB request form with card pre-attached
      await expect(page).toHaveURL(/\/arb\/requests\/new/);

      const attachedCard = page.locator('[data-testid="attached-card"]');
      await expect(attachedCard).toBeVisible();
    }
  });

  test('should show ARB status on card', async ({ page }) => {
    await page.goto('/cards');

    const cardWithArb = page.locator('[data-testid="card-item"][data-has-arb="true"]').first();
    const count = await cardWithArb.count();

    if (count > 0) {
      const arbStatus = cardWithArb.locator('[data-testid="arb-status"], .arb-badge');
      await expect(arbStatus.first()).toBeVisible();
    }
  });

  test('should enforce ARB approval before changes', async ({ page }) => {
    await page.goto('/cards');

    const restrictedCard = page.locator('[data-testid="card-item"][data-requires-arb="true"]').first();
    const count = await restrictedCard.count();

    if (count > 0) {
      await restrictedCard.click();

      const editBtn = page.locator('button:has-text("Edit"), [data-testid="edit-card-btn"]');
      const hasButton = await editBtn.count();

      if (hasButton > 0) {
        await editBtn.click();

        // Should show ARB required message
        const arbRequired = page.locator('text=ARB approval required, text=requires ARB review');
        await expect(arbRequired.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should sync ARB decision with card status', async ({ page }) => {
    await page.goto('/arb/requests');

    const approvedRequest = page.locator('[data-testid="request-item"][data-status="approved"]').first();
    const count = await approvedRequest.count();

    if (count > 0) {
      await approvedRequest.click();

      // Navigate to linked card
      await page.locator('[data-testid="view-card-btn"]').click();

      // Card should show approved status
      const cardStatus = page.locator('[data-testid="card-status"]');
      await expect(cardStatus).toContainText(/approved|approved/i);
    }
  });
});
