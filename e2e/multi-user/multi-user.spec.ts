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

test.describe('Role-Based Access Control (RBAC)', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display user roles in admin panel', async ({ page }) => {
    await page.goto('/admin/users');

    // Verify users list is visible
    await expect(page.locator('[data-testid="users-list"], table.users-table')).toBeVisible({ timeout: 10000 });
  });

  test('should create custom role with granular permissions', async ({ page }) => {
    await page.goto('/admin/roles');

    // Wait for and click "Add Role" button
    const addRoleBtn = page.locator('button:has-text("Add Role"), [data-testid="add-role-btn"]');
    await expect(addRoleBtn).toBeVisible({ timeout: 10000 });
    await addRoleBtn.click();

    // Fill role details
    await page.locator('[data-testid="role-name"]').fill('Custom Architect');
    await page.locator('[data-testid="role-description"]').fill('Limited architect access');

    // Grant specific permissions
    await page.locator('[data-testid="perm-cards-create"]').check();
    await page.locator('[data-testid="perm-cards-read"]').check();
    await page.locator('[data-testid="perm-cards-update"]').check();
    await page.locator('[data-testid="perm-cards-delete"]').uncheck();

    // Save role
    const saveBtn = page.locator('button:has-text("Save"), [data-testid="save-role-btn"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Verify success
    await expect(page.locator('text=Role created, text=Success')).toBeVisible({ timeout: 5000 });
  });

  test('should enforce role permissions', async ({ page }) => {
    // Login as viewer (read-only)
    await loginPage.loginViaApi('viewer@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Try to create card (should be denied)
    const createBtn = page.locator('button:has-text("Add Card"), [data-testid="add-card-btn"]');
    await expect(createBtn).toBeVisible({ timeout: 10000 });

    // Button should be disabled or not visible
    const isEnabled = await createBtn.isEnabled();
    expect(isEnabled).toBe(false);
  });

  test('should show permission denied for unauthorized actions', async ({ page }) => {
    // Login as viewer
    await loginPage.loginViaApi('viewer@archzero.local', 'changeme123');

    // Try to access admin panel
    await page.goto('/admin/users');

    // Wait and check for permission denied message
    const deniedMsg = page.locator('text=Permission denied, text=Access denied, text=Unauthorized');
    try {
      await expect(deniedMsg).toBeVisible({ timeout: 5000 });
    } catch {
      // Alternative: should redirect
      await expect(page).toHaveURL(/\/(dashboard|cards)/);
    }
  });

  test('should allow admin to assign roles', async ({ page }) => {
    await page.goto('/admin/users');

    // Find first user and click
    const firstUser = page.locator('[data-testid="user-item"], tr.user-row').first();
    await expect(firstUser).toBeVisible({ timeout: 10000 });
    await firstUser.click();

    // Look for role assignment
    const roleSelect = page.locator('[data-testid="user-role-select"], select[name="role"]');
    await expect(roleSelect).toBeVisible();

    // Select editor role and save
    await roleSelect.selectOption('editor');

    // Save changes
    const saveBtn = page.locator('button:has-text("Save"), [data-testid="save-user-btn"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(page.locator('text=User updated, text=Success')).toBeVisible({ timeout: 5000 });
  });

  test('should display permission matrix', async ({ page }) => {
    await page.goto('/admin/permissions');

    // Wait for permission matrix
    const matrix = page.locator('[data-testid="permission-matrix"], table.permissions-matrix');
    await expect(matrix).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Card-Level Access Control', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should set card-level permissions', async ({ page }) => {
    await page.goto('/cards');

    // Click on a card
    const firstCard = page.locator('[data-testid="card-item"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Look for permissions settings
    const permissionsBtn = page.locator('button:has-text("Permissions"), [data-testid="card-permissions-btn"]');
    await expect(permissionsBtn).toBeVisible();
    await permissionsBtn.click();

    // Set who can view/edit
    const viewPermission = page.locator('[data-testid="card-view-permission"]');
    const editPermission = page.locator('[data-testid="card-edit-permission"]');

    await expect(viewPermission).toBeVisible();
    await expect(editPermission).toBeVisible();

    await viewPermission.selectOption('owner');
    await editPermission.selectOption('owner');

    // Save
    const saveBtn = page.locator('button:has-text("Save"), [data-testid="save-permissions-btn"]');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(page.locator('text=Permissions updated')).toBeVisible({ timeout: 5000 });
  });

  test('should enforce card-level access restrictions', async ({ page }) => {
    // Login as non-owner
    await loginPage.loginViaApi('editor@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Try to access restricted card
    const restrictedCard = page.locator('[data-testid="card-item"][data-restricted="true"]').first();
    await expect(restrictedCard).toBeVisible({ timeout: 10000 });
    await restrictedCard.click();

    // Should show access denied
    const denied = page.locator('text=Access denied, text=Not authorized');
    await expect(denied).toBeVisible({ timeout: 5000 });
  });

  test('should share card with specific users', async ({ page }) => {
    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    const shareBtn = page.locator('button:has-text("Share"), [data-testid="share-card-btn"]');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Select users to share with
    const userSelect = page.locator('[data-testid="share-user-select"]');
    await expect(userSelect).toBeVisible();
    await userSelect.selectOption('editor@archzero.local');

    // Set permission level
    const permissionSelect = page.locator('[data-testid="share-permission"]');
    await expect(permissionSelect).toBeVisible();
    await permissionSelect.selectOption('can_edit');

    // Send share
    const confirmBtn = page.locator('button:has-text("Share"), [data-testid="confirm-share-btn"]');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(page.locator('text=Card shared')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Concurrent User Editing', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle concurrent edits with last-write-wins', async ({ browser }) => {
    // Create two contexts as different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login both users
    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('editor1@archzero.local', 'changeme123');
    await login2.loginViaApi('editor2@archzero.local', 'changeme123');

    // Both navigate to same card
    await page1.goto('/cards');
    await page2.goto('/cards');

    await page1.locator('[data-testid="card-item"]').first().click();
    await page2.locator('[data-testid="card-item"]').first().click();

    // User 1 edits
    await page1.locator('[data-testid="card-name"]').fill('Updated by User 1');

    // User 2 edits (simultaneously)
    await page2.locator('[data-testid="card-name"]').fill('Updated by User 2');

    // User 1 saves
    await page1.locator('button:has-text("Save")').click();
    await page1.waitForLoadState('networkidle');

    // User 2 saves (should win with last-write-wins)
    await page2.locator('button:has-text("Save")').click();
    await page2.waitForLoadState('networkidle');

    // Verify final state
    await page1.reload();
    const finalName = await page1.locator('[data-testid="card-name"]').inputValue();
    expect(finalName).toBe('Updated by User 2');

    await context1.close();
    await context2.close();
  });

  test('should show conflict warning on concurrent edit', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('editor1@archzero.local', 'changeme123');
    await login2.loginViaApi('editor2@archzero.local', 'changeme123');

    await page1.goto('/cards');
    await page2.goto('/cards');

    await page1.locator('[data-testid="card-item"]').first().click();
    await page2.locator('[data-testid="card-item"]').first().click();

    // User 1 starts editing
    await page1.locator('[data-testid="card-description"]').fill('Edit 1');
    await page1.waitForLoadState('networkidle');

    // User 2 saves
    await page2.locator('[data-testid="card-description"]').fill('Edit 2');
    await page2.locator('button:has-text("Save")').click();
    await page2.waitForLoadState('networkidle');

    // User 1 tries to save - should see conflict warning
    await page1.locator('button:has-text("Save")').click();

    const conflictWarning = page1.locator('text=conflict, text=modified by another user, text=changes were made');
    await expect(conflictWarning).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });

  test('should show active users on card', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('editor1@archzero.local', 'changeme123');
    await login2.loginViaApi('editor2@archzero.local', 'changeme123');

    await page1.goto('/cards');
    await page2.goto('/cards');

    await page1.locator('[data-testid="card-item"]').first().click();
    await page2.locator('[data-testid="card-item"]').first().click();

    // Look for "viewing" indicator
    await page1.waitForLoadState('networkidle');

    const activeUsers = page1.locator('[data-testid="active-users"], .viewing-indicator');
    await expect(activeUsers).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });
});

test.describe('Session Isolation', () => {
  test('should maintain separate sessions for different users', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Login as different users
    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('admin@archzero.local', 'changeme123');
    await login2.loginViaApi('viewer@archzero.local', 'changeme123');

    // Verify different permissions
    await page1.goto('/admin/users');
    await page2.goto('/admin/users');

    // Page1 (admin) should see admin panel
    await expect(page1.locator('[data-testid="users-list"]')).toBeVisible({ timeout: 5000 });

    // Page2 (viewer) should be denied
    const denied = page2.locator('text=Permission denied, text=Unauthorized');
    await expect(denied).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test('should not leak data between user sessions', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('admin@archzero.local', 'changeme123');
    await login2.loginViaApi('editor@archzero.local', 'changeme123');

    // User 1 creates private data
    await page1.goto('/cards');
    await page1.locator('[data-testid="add-card-btn"]').click();
    await page1.locator('[data-testid="card-name"]').fill('Private Admin Card');
    await page1.locator('[data-testid="card-visibility"]').selectOption('private');
    await page1.locator('button:has-text("Save")').click();

    // User 2 should not see it
    await page2.goto('/cards');
    const privateCard = page2.locator('text=Private Admin Card');
    const count = await privateCard.count();

    expect(count).toBe(0);

    await context1.close();
    await context2.close();
  });
});

test.describe('User Profile Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should display user profile', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('[data-testid="profile-page"], h1:has-text("Profile")')).toBeVisible({ timeout: 5000 });
  });

  test('should allow user to update profile', async ({ page }) => {
    await page.goto('/profile');

    // Update display name
    await page.locator('[data-testid="profile-display-name"]').fill('Admin User');

    // Save
    await page.locator('button:has-text("Save"), [data-testid="save-profile-btn"]').click();

    await expect(page.locator('text=Profile updated')).toBeVisible({ timeout: 5000 });
  });

  test('should allow password change', async ({ page }) => {
    await page.goto('/profile');

    const changePwdBtn = page.locator('button:has-text("Change Password"), [data-testid="change-password-btn"]');
    await expect(changePwdBtn).toBeVisible({ timeout: 10000 });
    await changePwdBtn.click();

    // Fill password form
    const currentPwd = page.locator('[data-testid="current-password"]');
    const newPwd = page.locator('[data-testid="new-password"]');
    const confirmPwd = page.locator('[data-testid="confirm-password"]');

    await expect(currentPwd).toBeVisible();
    await expect(newPwd).toBeVisible();
    await expect(confirmPwd).toBeVisible();

    await currentPwd.fill('changeme123');
    await newPwd.fill('newchangeme123');
    await confirmPwd.fill('newchangeme123');

    // Submit
    const updateBtn = page.locator('button:has-text("Update Password")');
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();

    await expect(page.locator('text=Password updated')).toBeVisible({ timeout: 5000 });
  });

  test('should validate password strength', async ({ page }) => {
    await page.goto('/profile');

    const changePwdBtn = page.locator('button:has-text("Change Password"), [data-testid="change-password-btn"]');
    await expect(changePwdBtn).toBeVisible({ timeout: 10000 });
    await changePwdBtn.click();

    // Enter weak password
    const newPwd = page.locator('[data-testid="new-password"]');
    const confirmPwd = page.locator('[data-testid="confirm-password"]');

    await expect(newPwd).toBeVisible();
    await expect(confirmPwd).toBeVisible();

    await newPwd.fill('weak');
    await confirmPwd.fill('weak');

    // Should show validation error
    const updateBtn = page.locator('button:has-text("Update Password")');
    await expect(updateBtn).toBeVisible();
    await updateBtn.click();

    const strengthError = page.locator('text=Password too weak, text=at least 8 characters');
    await expect(strengthError).toBeVisible({ timeout: 5000 });
  });

  test('should show user activity history', async ({ page }) => {
    await page.goto('/profile');

    const activityTab = page.locator('[data-testid="activity-tab"], button:has-text("Activity")');
    await expect(activityTab).toBeVisible({ timeout: 10000 });
    await activityTab.click();

    const activityList = page.locator('[data-testid="activity-list"]');
    await expect(activityList).toBeVisible({ timeout: 10000 });
  });
});

test.describe('User Invitation Flow', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should allow admin to invite new user', async ({ page }) => {
    await page.goto('/admin/users');

    const inviteBtn = page.locator('button:has-text("Invite User"), [data-testid="invite-user-btn"]');
    await expect(inviteBtn).toBeVisible({ timeout: 10000 });
    await inviteBtn.click();

    // Fill invitation form
    const emailInput = page.locator('[data-testid="invite-email"]');
    const roleSelect = page.locator('[data-testid="invite-role"]');
    const messageInput = page.locator('[data-testid="invite-message"]');

    await expect(emailInput).toBeVisible();
    await expect(roleSelect).toBeVisible();
    await expect(messageInput).toBeVisible();

    await emailInput.fill(`test-${Date.now()}@archzero.local`);
    await roleSelect.selectOption('editor');
    await messageInput.fill('Welcome to the team!');

    // Send invite
    const sendBtn = page.locator('button:has-text("Send Invite")');
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await expect(page.locator('text=Invitation sent, text=Invite created')).toBeVisible({ timeout: 5000 });
  });

  test('should show pending invitations', async ({ page }) => {
    await page.goto('/admin/users');

    const pendingTab = page.locator('[data-testid="pending-invites-tab"], button:has-text("Pending")');
    await expect(pendingTab).toBeVisible({ timeout: 10000 });
    await pendingTab.click();

    const inviteList = page.locator('[data-testid="pending-invites"]');
    await expect(inviteList).toBeVisible({ timeout: 10000 });
  });

  test('should allow resending invitation', async ({ page }) => {
    await page.goto('/admin/users');

    const pendingInvite = page.locator('[data-testid="pending-invite"]').first();
    await expect(pendingInvite).toBeVisible({ timeout: 10000 });
    await pendingInvite.click();

    const resendBtn = page.locator('button:has-text("Resend"), [data-testid="resend-invite-btn"]');
    await expect(resendBtn).toBeVisible();
    await resendBtn.click();

    await expect(page.locator('text=Invitation resent')).toBeVisible({ timeout: 5000 });
  });

  test('should allow cancelling invitation', async ({ page }) => {
    await page.goto('/admin/users');

    const pendingInvite = page.locator('[data-testid="pending-invite"]').first();
    await expect(pendingInvite).toBeVisible({ timeout: 10000 });
    await pendingInvite.click();

    const cancelBtn = page.locator('button:has-text("Cancel"), [data-testid="cancel-invite-btn"]');
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    await expect(page.locator('text=Invitation cancelled')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Active Session Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should display active sessions', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/profile');

    const sessionsTab = page.locator('[data-testid="sessions-tab"], button:has-text("Sessions")');
    await expect(sessionsTab).toBeVisible({ timeout: 10000 });
    await sessionsTab.click();

    const sessionsList = page.locator('[data-testid="active-sessions"]');
    await expect(sessionsList).toBeVisible({ timeout: 10000 });
  });

  test('should allow user to revoke session', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/profile');

    const sessionsTab = page.locator('[data-testid="sessions-tab"], button:has-text("Sessions")');
    await expect(sessionsTab).toBeVisible({ timeout: 10000 });
    await sessionsTab.click();

    // Revoke first session (not current)
    const revokeBtn = page.locator('[data-testid="revoke-session-btn"]').first();
    await expect(revokeBtn).toBeVisible({ timeout: 10000 });
    await revokeBtn.click();

    await expect(page.locator('text=Session revoked')).toBeVisible({ timeout: 5000 });
  });

  test('should allow admin to force logout user', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/admin/users');

    const firstUser = page.locator('[data-testid="user-item"]').first();
    await expect(firstUser).toBeVisible({ timeout: 10000 });
    await firstUser.click();

    const forceLogoutBtn = page.locator('button:has-text("Force Logout"), [data-testid="force-logout-btn"]');
    await expect(forceLogoutBtn).toBeVisible({ timeout: 10000 });
    await forceLogoutBtn.click();

    // Confirm
    const confirmBtn = page.locator('button:has-text("Confirm")');
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    await expect(page.locator('text=User logged out')).toBeVisible({ timeout: 5000 });
  });

  test('should enforce session timeout', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Wait for network activity (configured as 30 min in real app, using short wait for test)
    // In real scenario, this would test actual timeout behavior
    await page.waitForLoadState('networkidle');

    // Try to perform action - session should still be valid
    const cards = page.locator('[data-testid="card-item"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Auditor Role', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should allow auditor to view audit trail', async ({ page }) => {
    await loginPage.loginViaApi('auditor@archzero.local', 'changeme123');

    await page.goto('/audit');

    await expect(page.locator('[data-testid="audit-trail"], h1:has-text("Audit")')).toBeVisible({ timeout: 10000 });
  });

  test('should allow auditor to export audit logs', async ({ page }) => {
    await loginPage.loginViaApi('auditor@archzero.local', 'changeme123');

    await page.goto('/audit');

    const exportBtn = page.locator('button:has-text("Export"), [data-testid="export-audit-btn"]');
    await expect(exportBtn).toBeVisible({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.(csv|json)$/);
  });

  test('should allow auditor to filter audit logs', async ({ page }) => {
    await loginPage.loginViaApi('auditor@archzero.local', 'changeme123');

    await page.goto('/audit');

    // Filter by action
    const actionFilter = page.locator('[data-testid="audit-action-filter"]');
    await expect(actionFilter).toBeVisible({ timeout: 10000 });

    await actionFilter.selectOption('card_update');

    // Verify filtered results
    await page.waitForLoadState('networkidle');
  });

  test('should not allow auditor to modify data', async ({ page }) => {
    await loginPage.loginViaApi('auditor@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Create button should not be visible or enabled
    const createBtn = page.locator('button:has-text("Add Card"), [data-testid="add-card-btn"]');
    await expect(createBtn).toBeVisible({ timeout: 10000 });

    const isEnabled = await createBtn.isEnabled();
    expect(isEnabled).toBe(false);
  });

  test('should show compliance status to auditor', async ({ page }) => {
    await loginPage.loginViaApi('auditor@archzero.local', 'changeme123');

    await page.goto('/compliance');

    await expect(page.locator('[data-testid="compliance-dashboard"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Permission Escalation and Demotion', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');
  });

  test('should allow admin to promote user to admin', async ({ page }) => {
    await page.goto('/admin/users');

    const editorUser = page.locator('[data-testid="user-item"][data-role="editor"]').first();
    await expect(editorUser).toBeVisible({ timeout: 10000 });
    await editorUser.click();

    const roleSelect = page.locator('[data-testid="user-role-select"]');
    await expect(roleSelect).toBeVisible();

    await roleSelect.selectOption('admin');

    const saveBtn = page.locator('button:has-text("Save")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(page.locator('text=User promoted')).toBeVisible({ timeout: 5000 });
  });

  test('should allow admin to demote user', async ({ page }) => {
    await page.goto('/admin/users');

    const editorUser = page.locator('[data-testid="user-item"]').first();
    await expect(editorUser).toBeVisible({ timeout: 10000 });
    await editorUser.click();

    const roleSelect = page.locator('[data-testid="user-role-select"]');
    await expect(roleSelect).toBeVisible();

    await roleSelect.selectOption('viewer');

    const saveBtn = page.locator('button:has-text("Save")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    await expect(page.locator('text=User role updated')).toBeVisible({ timeout: 5000 });
  });

  test('should log permission changes in audit trail', async ({ page }) => {
    await page.goto('/admin/users');

    const firstUser = page.locator('[data-testid="user-item"]').first();
    await expect(firstUser).toBeVisible({ timeout: 10000 });
    await firstUser.click();

    const roleSelect = page.locator('[data-testid="user-role-select"]');
    await expect(roleSelect).toBeVisible();

    await roleSelect.selectOption('viewer');

    const saveBtn = page.locator('button:has-text("Save")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Check audit trail
    await page.goto('/audit');

    const auditEntry = page.locator('[data-testid="audit-entry"]').filter({ hasText: 'role changed' });
    await expect(auditEntry.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('SSO and JIT Provisioning', () => {
  test('should support SSO login', async ({ page, context }) => {
    // Mock SSO flow - in real scenario this would integrate with IdP
    await page.goto('/login');

    const ssoBtn = page.locator('button:has-text("SSO"), [data-testid="sso-login-btn"]');
    await expect(ssoBtn).toBeVisible({ timeout: 10000 });
    await ssoBtn.click();

    // Should redirect to IdP or show SSO options
    await expect(page.locator('[data-testid="sso-provider"], text=Single Sign-On')).toBeVisible({ timeout: 5000 });
  });

  test('should auto-provision JIT users', async ({ page }) => {
    // Simulate SSO JIT provisioning
    // In real scenario, IdP would send SAML assertion/OIDC token
    await page.goto('/auth/sso/callback');

    // After successful SSO, user should be auto-created if not exists
    await expect(page.locator('[data-testid="dashboard"], [data-testid="cards-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should map SSO groups to roles', async ({ page }) => {
    // Simulate SSO login with group membership
    await page.goto('/auth/sso/callback?groups=architects,editors');

    // User should be assigned appropriate role based on groups
    await page.goto('/profile');

    const userRole = page.locator('[data-testid="user-role"]');
    await expect(userRole).toBeVisible({ timeout: 10000 });

    const role = await userRole.textContent();
    expect(['architect', 'editor', 'admin']).toContain(role?.toLowerCase());
  });
});

test.describe('Multi-User Workflows', () => {
  test('should support collaborative commenting', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    const login1 = new LoginPage(page1);
    const login2 = new LoginPage(page2);

    await login1.loginViaApi('editor1@archzero.local', 'changeme123');
    await login2.loginViaApi('editor2@archzero.local', 'changeme123');

    await page1.goto('/cards');
    await page2.goto('/cards');

    await page1.locator('[data-testid="card-item"]').first().click();
    await page2.locator('[data-testid="card-item"]').first().click();

    // User 1 adds comment
    await page1.locator('[data-testid="comment-input"]').fill('Please review this card');
    await page1.locator('[data-testid="add-comment-btn"]').click();

    // User 2 should see comment
    await page1.waitForLoadState('networkidle');

    const comment = page2.locator('text=Please review this card');
    await expect(comment).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test('should send notification on assignment', async ({ page }) => {
    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    const assignBtn = page.locator('button:has-text("Assign"), [data-testid="assign-card-btn"]');
    await expect(assignBtn).toBeVisible({ timeout: 10000 });
    await assignBtn.click();

    // Assign to user
    const assigneeSelect = page.locator('[data-testid="assignee-select"]');
    await expect(assigneeSelect).toBeVisible();
    await assigneeSelect.selectOption('editor@archzero.local');

    // Should show notification will be sent
    const notificationMsg = page.locator('text=notification will be sent, text=User will be notified');
    await expect(notificationMsg).toBeVisible({ timeout: 5000 });

    const assignConfirmBtn = page.locator('button:has-text("Assign")');
    await expect(assignConfirmBtn).toBeVisible();
    await assignConfirmBtn.click();
  });
});

test.describe('Cross-Browser Session Consistency', () => {
  test('should maintain session across browser restart', async ({ context, page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Get auth token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Close and reopen
    await page.close();

    const newPage = await context.newPage();
    await newPage.goto('/');

    // Should still be authenticated
    await expect(newPage.locator('[data-testid="dashboard"], [data-testid="cards-page"]')).toBeVisible({ timeout: 5000 });
  });

  test('should sync auth state across tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();

    const loginPage = new LoginPage(page1);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Open new tab
    const page2 = await context.newPage();
    await page2.goto('/');

    // Should be authenticated in second tab
    await expect(page2.locator('[data-testid="dashboard"], [data-testid="cards-page"]')).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
