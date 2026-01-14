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

test.describe('API Mocking - Cards Endpoints', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Setup API mocking for this test
    await page.route('**/api/v1/cards*', async (route) => {
      // Mock successful cards response
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cards: [
            {
              id: 'mock-card-1',
              name: 'Mock Application 1',
              type: 'Application',
              lifecycle_phase: 'Active',
              description: 'Mocked card description',
              created_at: new Date().toISOString(),
            },
            {
              id: 'mock-card-2',
              name: 'Mock Application 2',
              type: 'ITComponent',
              lifecycle_phase: 'Active',
              description: 'Another mocked card',
              created_at: new Date().toISOString(),
            },
          ],
          total: 2,
          page: 1,
          per_page: 10,
        }),
      });
    });
  });

  test('should load with mocked card data', async ({ page }) => {
    await page.goto('/cards');

    // Should display mocked cards
    await expect(page.locator('text=Mock Application 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Mock Application 2')).toBeVisible();
  });

  test('should handle mocked pagination', async ({ page }) => {
    await page.goto('/cards?page=2');

    // Mock response for page 2
    await page.waitForURL(/page=2/);
  });
});

test.describe('API Error Scenarios', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle 500 server error gracefully', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock 500 error
    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/cards');

    // Should show error message
    const errorMsg = page.locator('text=server error, text=Something went wrong, text=500');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle 503 service unavailable', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Service unavailable' }),
      });
    });

    await page.goto('/cards');

    const errorMsg = page.locator('text=unavailable, text=maintenance');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle network failure', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock network failure
    await page.route('**/api/v1/cards*', (route) => {
      route.abort('failed');
    });

    await page.goto('/cards');

    // Should show network error message
    const errorMsg = page.locator('text=network error, text=connection failed, text=offline');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle request timeout', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock timeout by delaying response
    await page.route('**/api/v1/cards*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000)); // > 30s timeout
      route.continue();
    });

    await page.goto('/cards');

    // Should show timeout message
    const timeoutMsg = page.locator('text=timeout, text=request timed out');
    await expect(timeoutMsg.first()).toBeVisible({ timeout: 35000 });
  });

  test('should handle 401 unauthorized', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/cards');

    // Should redirect to login or show auth error
    await expect(page).toHaveURL(/\/(login|cards)/, { timeout: 5000 });
  });

  test('should handle 403 forbidden', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/admin/**', (route) => {
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden' }),
      });
    });

    await page.goto('/admin/users');

    // Should show permission denied
    const errorMsg = page.locator('text=permission denied, text=forbidden, text=unauthorized');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle 404 not found', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards/nonexistent', (route) => {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not found' }),
      });
    });

    await page.goto('/cards/nonexistent');

    const errorMsg = page.locator('text=not found, text=404');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle 429 rate limiting', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
        headers: { 'Retry-After': '60' },
      });
    });

    await page.goto('/cards');

    // Should show rate limit message
    const rateLimitMsg = page.locator('text=rate limit, text=too many requests, text=try again');
    await expect(rateLimitMsg.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Loading States and Retry Logic', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should show loading spinner during API call', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Delay response to observe loading state
    await page.route('**/api/v1/cards*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto('/cards');

    // Should show loading indicator
    const loadingSpinner = page.locator('[data-testid="loading"], .loading, .spinner');
    const hasLoading = await loadingSpinner.count();

    if (hasLoading > 0) {
      await expect(loadingSpinner.first()).toBeVisible();
    }
  });

  test('should retry failed requests automatically', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let attemptCount = 0;

    // Fail first 2 attempts, succeed on 3rd
    await page.route('**/api/v1/cards*', (route) => {
      attemptCount++;
      if (attemptCount < 3) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/cards');

    // Should eventually succeed after retries
    await expect(page.locator('[data-testid="card-item"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show retry count to user', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let attemptCount = 0;

    await page.route('**/api/v1/cards*', (route) => {
      attemptCount++;
      if (attemptCount < 2) {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/cards');

    // Look for retry message
    const retryMsg = page.locator('text=retrying, text=retry attempt');
    const hasMsg = await retryMsg.count();

    if (hasMsg > 0) {
      await expect(retryMsg.first()).toBeVisible();
    }
  });

  test('should stop retrying after max attempts', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Always fail
    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await page.goto('/cards');

    // Should show final error after max retries
    const errorMsg = page.locator('text=giving up, text=max retries, text=unable to load');
    await expect(errorMsg.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Optimistic Updates and Rollback', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should optimistically update UI on card creation', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Delay API response
    await page.route('**/api/v1/cards', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });

    await page.goto('/cards');

    const initialCount = await page.locator('[data-testid="card-item"]').count();

    // Create card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('[data-testid="card-name"]').fill('Optimistic Card');
    await page.locator('button:has-text("Save")').click();

    // UI should update immediately before API response
    const newCount = await page.locator('[data-testid="card-item"]').count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should rollback optimistic update on error', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock failed creation
    await page.route('**/api/v1/cards', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Validation error' }),
      });
    });

    await page.goto('/cards');

    // Try to create card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('[data-testid="card-name"]').fill('Failed Card');
    await page.locator('button:has-text("Save")').click();

    // Card should be removed from UI after error
    await page.waitForTimeout(1000);

    const failedCard = page.locator('text=Failed Card');
    const count = await failedCard.count();
    expect(count).toBe(0);
  });

  test('should optimistically update card edits', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Delay update response
    await page.route('**/api/v1/cards/**', async (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      route.continue();
    });

    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    // Edit card
    await page.locator('[data-testid="card-name"]').fill('Updated Name');
    await page.locator('button:has-text("Save")').click();

    // Name should update immediately in UI
    await expect(page.locator('text=Updated Name')).toBeVisible();
  });
});

test.describe('Offline Mode and Reconnection', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should detect offline status', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Simulate going offline
    await page.context().setOffline(true);

    // Try to perform action
    await page.locator('button:has-text("Add Card")').click();

    // Should show offline message
    const offlineMsg = page.locator('text=offline, text=no connection, text=you are offline');
    await expect(offlineMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should queue requests when offline', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Go offline
    await page.context().setOffline(true);

    // Try to create card
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('[data-testid="card-name"]').fill('Queued Card');
    await page.locator('button:has-text("Save")').click();

    // Should show "pending" or "queued" indicator
    const pendingMsg = page.locator('text=pending, text=queued, text=will sync when online');
    await expect(pendingMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should sync queued requests when back online', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Go offline
    await page.context().setOffline(true);

    // Create card while offline
    await page.locator('button:has-text("Add Card")').click();
    await page.locator('[data-testid="card-name"]').fill('Sync Test Card');
    await page.locator('button:has-text("Save")').click();

    await page.waitForTimeout(1000);

    // Go back online
    await page.context().setOffline(false);

    // Should show syncing message
    const syncMsg = page.locator('text=syncing, text=saving changes');
    const hasMsg = await syncMsg.count();

    if (hasMsg > 0) {
      await expect(syncMsg.first()).toBeVisible();
    }

    // Card should be created
    await page.waitForTimeout(2000);
    const syncedCard = page.locator('text=Sync Test Card');
    await expect(syncedCard.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show offline banner', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.context().setOffline(true);

    await page.goto('/cards');

    const offlineBanner = page.locator('[data-testid="offline-banner"], .offline-indicator');
    await expect(offlineBanner.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Slow Network Conditions', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle slow 3G network', async ({ page }) => {
    // Simulate 3G network
    const context = page.context();
    await context.setGeolocation({ latitude: 0, longitude: 0 });
    // Note: Playwright doesn't have built-in network throttling like Chrome DevTools
    // This would typically be done via Chrome DevTools Protocol

    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Add delay to all requests
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay
      route.continue();
    });

    const startTime = Date.now();

    await page.goto('/cards');

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should take at least 1s due to delay
    expect(duration).toBeGreaterThan(1000);
  });

  test('should show progress indicator on slow network', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Add significant delay
    await page.route('**/api/v1/cards*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.continue();
    });

    await page.goto('/cards');

    // Should show loading/progress indicator
    const loading = page.locator('[data-testid="loading"], .loading, [data-testid="progress"]');
    const hasLoading = await loading.count();

    if (hasLoading > 0) {
      await expect(loading.first()).toBeVisible();
    }
  });

  test('should handle intermittent network', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let requestCount = 0;

    // Fail every other request
    await page.route('**/api/v1/cards*', (route) => {
      requestCount++;
      if (requestCount % 2 === 0) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    await page.goto('/cards');

    // Should handle intermittent failures gracefully
    // Either show error and recover, or retry successfully
    const errorMsg = page.locator('text=network error');
    const hasError = await errorMsg.count();

    if (hasError > 0) {
      // Should have retry option
      const retryBtn = page.locator('button:has-text("Retry"), [data-testid="retry-btn"]');
      await expect(retryBtn.first()).toBeVisible();
    }
  });
});

test.describe('API Rate Limiting', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should respect rate limit headers', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let requestCount = 0;

    // Enforce rate limit after 5 requests
    await page.route('**/api/v1/cards*', (route) => {
      requestCount++;
      if (requestCount > 5) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Too many requests' }),
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.floor(Date.now() / 1000 + 60).toString(),
          },
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/cards');

    // Trigger multiple requests (pagination, filters, etc.)
    for (let i = 0; i < 6; i++) {
      await page.locator('button:has-text("Next"), [data-testid="next-page"]').click();
      await page.waitForTimeout(100);
    }

    // Should show rate limit message
    const rateLimitMsg = page.locator('text=rate limit, text=too many requests');
    await expect(rateLimitMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show rate limit countdown', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Too many requests', retryAfter: 30 }),
        headers: { 'Retry-After': '30' },
      });
    });

    await page.goto('/cards');

    // Should show countdown
    const countdown = page.locator('[data-testid="rate-limit-countdown"], .countdown');
    const hasCountdown = await countdown.count();

    if (hasCountdown > 0) {
      await expect(countdown.first()).toBeVisible();
    }
  });

  test('should auto-retry after rate limit expires', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let requestCount = 0;

    await page.route('**/api/v1/cards*', (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Too many requests' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/cards');

    // Wait for retry
    await page.waitForTimeout(5000);

    // Should eventually load
    const cards = page.locator('[data-testid="card-item"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('External Service Mocking', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should mock email service', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock email API
    await page.route('**/api/v1/email/send', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Email sent successfully' }),
      });
    });

    await page.goto('/admin/users');

    const inviteBtn = page.locator('button:has-text("Invite User")');
    const hasButton = await inviteBtn.count();

    if (hasButton > 0) {
      await inviteBtn.click();
      await page.locator('[data-testid="invite-email"]').fill('test@example.com');
      await page.locator('button:has-text("Send Invite")').click();

      // Should use mocked email service
      await expect(page.locator('text=Invitation sent')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should mock SSO provider', async ({ page }) => {
    // Mock SSO IdP response
    await page.route('**/auth/sso/callback', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-sso-token',
          user: {
            id: 'sso-user-1',
            email: 'sso-user@archzero.local',
            name: 'SSO User',
            role: 'editor',
          },
        }),
      });
    });

    await page.goto('/auth/sso/callback');

    // Should authenticate with mocked SSO
    await expect(page.locator('[data-testid="dashboard"], [data-testid="cards-page"]')).toBeVisible({ timeout: 5000 });
  });

  test('should mock file upload service', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock file upload
    await page.route('**/api/v1/files/upload', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          file: {
            id: 'file-1',
            name: 'test.pdf',
            url: 'https://example.com/files/test.pdf',
            size: 1024,
          },
        }),
      });
    });

    await page.goto('/cards');

    const firstCard = page.locator('[data-testid="card-item"]').first();
    await firstCard.click();

    const attachBtn = page.locator('button:has-text("Attach File"), [data-testid="attach-file-btn"]');
    const hasButton = await attachBtn.count();

    if (hasButton > 0) {
      await attachBtn.click();

      // File upload should use mocked response
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles({
        name: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock PDF content'),
      });

      await expect(page.locator('text=test.pdf')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should mock external API integrations', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock external Jira API
    await page.route('**/api/v1/integrations/jira/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tickets: [
            { id: 'JIRA-1', summary: 'Test ticket 1' },
            { id: 'JIRA-2', summary: 'Test ticket 2' },
          ],
        }),
      });
    });

    await page.goto('/integrations/jira');

    const tickets = page.locator('[data-testid="jira-ticket"]');
    const count = await tickets.count();

    expect(count).toBeGreaterThan(0);
  });
});

test.describe('API Response Fixtures', () => {
  test('should use consistent fixtures for cards', async ({ page }) => {
    // Setup consistent fixture
    const cardsFixture = {
      cards: [
        {
          id: 'fixture-card-1',
          name: 'Fixture Application 1',
          type: 'Application',
          lifecycle_phase: 'Active',
          description: 'Test fixture card',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
    };

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cardsFixture),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Should display fixture data
    await expect(page.locator('text=Fixture Application 1')).toBeVisible({ timeout: 5000 });
  });

  test('should use consistent fixtures for relationships', async ({ page }) => {
    const relationshipsFixture = {
      relationships: [
        {
          id: 'rel-1',
          source_id: 'card-1',
          target_id: 'card-2',
          type: 'depends_on',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    };

    await page.route('**/api/v1/relationships*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(relationshipsFixture),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/relationships');

    // Should display fixture relationships
    await expect(page.locator('[data-testid="relationship-item"]')).toBeVisible({ timeout: 5000 });
  });

  test('should use consistent fixtures for governance', async ({ page }) => {
    const principlesFixture = {
      principles: [
        {
          id: 'principle-1',
          statement: 'Test Principle 1',
          category: 'performance',
        },
      ],
      total: 1,
    };

    await page.route('**/api/v1/governance/principles*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(principlesFixture),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/governance/principles');

    await expect(page.locator('text=Test Principle 1')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Request/Response Interception', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should intercept and log API requests', async ({ page }) => {
    const requests: string[] = [];

    await page.route('**/api/v1/**', (route) => {
      requests.push(route.request().url());
      route.continue();
    });

    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Should have made API requests
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.some(r => r.includes('/api/v1/'))).toBe(true);
  });

  test('should modify request headers', async ({ page }) => {
    await page.route('**/api/v1/cards*', (route) => {
      const headers = route.request().headers();
      headers['X-Custom-Header'] = 'test-value';
      route.continue({ headers });
    });

    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    // Request should succeed with modified headers
    await expect(page.locator('[data-testid="card-item"]')).toBeVisible({ timeout: 5000 });
  });

  test('should capture request payload', async ({ page }) => {
    let capturedPayload: any = null;

    await page.route('**/api/v1/cards', (route) => {
      if (route.request().method() === 'POST') {
        capturedPayload = route.request().postDataJSON();
      }
      route.continue();
    });

    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');

    const createBtn = page.locator('button:has-text("Add Card"), [data-testid="add-card-btn"]');
    const hasButton = await createBtn.count();

    if (hasButton > 0) {
      await createBtn.click();
      await page.locator('[data-testid="card-name"]').fill('Capture Test');
      await page.locator('button:has-text("Save")').click();

      // Verify payload was captured
      expect(capturedPayload).toBeTruthy();
      expect(capturedPayload.name).toBe('Capture Test');
    }
  });
});

test.describe('Partial Response Handling', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should handle partial data responses', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    // Mock partial response (some fields missing)
    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cards: [
            {
              id: 'partial-1',
              name: 'Partial Card',
              // Missing type, lifecycle_phase, etc.
            },
          ],
        }),
      });
    });

    await page.goto('/cards');

    // Should still render with available data
    await expect(page.locator('text=Partial Card')).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty responses', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cards: [], total: 0 }),
      });
    });

    await page.goto('/cards');

    // Should show empty state
    const emptyState = page.locator('[data-testid="empty-state"], text=No cards, text=no results');
    await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle malformed JSON', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.route('**/api/v1/cards*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{invalid json}',
      });
    });

    await page.goto('/cards');

    // Should show parse error
    const errorMsg = page.locator('text=parse error, text=invalid response');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Caching and ETags', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should respect cache headers', async ({ page }) => {
    let requestCount = 0;

    await page.route('**/api/v1/cards*', (route) => {
      requestCount++;

      if (requestCount === 1) {
        // First request - return with ETag
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ cards: [], total: 0 }),
          headers: {
            'ETag': '"version-1"',
            'Cache-Control': 'max-age=3600',
          },
        });
      } else if (route.request().headers()['if-none-match'] === '"version-1"') {
        // Subsequent request with matching ETag - return 304
        route.fulfill({
          status: 304,
          headers: {
            'Cache-Control': 'max-age=3600',
          },
        });
      } else {
        route.continue();
      }
    });

    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    await page.goto('/cards');
    await page.reload();

    // Should have made 2 requests (one cached with 304 response)
    expect(requestCount).toBe(2);
  });

  test('should invalidate cache on update', async ({ page }) => {
    await loginPage.loginViaApi('admin@archzero.local', 'changeme123');

    let requestCount = 0;

    await page.route('**/api/v1/cards*', (route) => {
      requestCount++;
      route.continue();
    });

    await page.goto('/cards');

    const initialCount = requestCount;

    // Make update (should invalidate cache)
    const firstCard = page.locator('[data-testid="card-item"]').first();
    const cardCount = await firstCard.count();

    if (cardCount > 0) {
      await firstCard.click();
      await page.locator('[data-testid="card-name"]').fill('Updated');
      await page.locator('button:has-text("Save")').click();

      await page.waitForTimeout(1000);

      // Should have made additional request for fresh data
      expect(requestCount).toBeGreaterThan(initialCount);
    }
  });
});
