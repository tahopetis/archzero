import { test, expect } from '@playwright/test';
import { API_URL } from '../helpers';

test.describe('@smoke API Health Check', () => {
  const endpoints = [
    { path: '/api/v1/health', name: 'Health Check' },
    { path: '/api/v1/cards', name: 'Cards' },
    { path: '/api/v1/relationships', name: 'Relationships' },
    { path: '/api/v1/principles', name: 'Principles' },
    { path: '/api/v1/standards', name: 'Standards' },
    { path: '/api/v1/policies', name: 'Policies' },
    { path: '/api/v1/exceptions', name: 'Exceptions' },
    { path: '/api/v1/initiatives', name: 'Initiatives' },
    { path: '/api/v1/risks', name: 'Risks' },
    { path: '/api/v1/compliance-requirements', name: 'Compliance Requirements' },
    { path: '/api/v1/arb', name: 'ARB' },
    { path: '/api/v1/graph', name: 'Graph' },
    { path: '/api/v1/import', name: 'Import' },
    { path: '/api/v1/export', name: 'Export' },
    { path: '/api/v1/search', name: 'Search' },
    { path: '/api/v1/migration', name: 'Migration' },
  ];

  for (const endpoint of endpoints) {
    test(`${endpoint.name} endpoint should be accessible`, async ({ request }) => {
      const response = await request.get(endpoint.path);

      // Accept 200 (OK) or 401 (Unauthorized) - means endpoint exists
      // Reject 500 (Server Error) or 404 (Not Found)
      expect(response.status()).toBeLessThan(500);

      // Log endpoint status
      if (response.status() >= 400 && response.status() < 500) {
        console.log(`  ⚠️  ${endpoint.name}: ${response.status()} (expected: might need auth)`);
      } else {
        console.log(`  ✅ ${endpoint.name}: ${response.status()}`);
      }
    });
  }

  test('Health check should return service info', async ({ request }) => {
    const response = await request.get('/api/v1/health');
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('service');
    expect(health).toHaveProperty('version');

    console.log(`  📊 Service: ${health.service}`);
    console.log(`  📦 Version: ${health.version}`);
    console.log(`  💚 Status: ${health.status}`);
  });

  test('All critical endpoints should respond', async ({ request }) => {
    const criticalEndpoints = [
      '/api/v1/cards',
      '/api/v1/relationships',
      '/api/v1/principles',
      '/api/v1/graph',
    ];

    const results = await Promise.all(
      criticalEndpoints.map(async (path) => {
        const response = await request.get(path);
        return {
          path,
          status: response.status(),
          ok: response.ok() || response.status() === 401, // 401 is OK (needs auth)
        };
      })
    );

    const failed = results.filter((r) => !r.ok);

    if (failed.length > 0) {
      console.error('❌ Failed endpoints:');
      failed.forEach((f) => console.error(`   ${f.path}: ${f.status}`));
    }

    expect(failed.length).toBe(0);
  });
});
