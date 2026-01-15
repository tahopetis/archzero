import { FullConfig, request } from '@playwright/test';
import { TestDataSeeder } from './helpers/test-data-seeder';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Arc Zero E2E Test Suite - Global Setup');
  console.log('============================================');

  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:3000';
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL || 'admin@archzero.local';
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || 'changeme123';

  console.log(`📝 Frontend URL: ${baseURL}`);
  console.log(`🔧 Backend API: ${apiURL}`);
  console.log(`🌍 Test Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`👤 Test Admin User: ${testAdminEmail}`);

  // Create a request context for API calls
  const requestContext = await request.newContext({
    baseURL: apiURL,
  });

  try {
    // 1. Verify backend health
    console.log('🏥 Checking backend health...');
    const healthResponse = await requestContext.get('/api/v1/health');
    if (healthResponse.ok()) {
      const health = await healthResponse.json();
      console.log(`✅ Backend is healthy: ${health.status} - ${health.service} v${health.version}`);
    } else {
      throw new Error(`Backend health check failed: ${healthResponse.status()}`);
    }

    // 2. Verify test user exists by attempting to login
    console.log('🔐 Verifying test admin user exists...');
    const loginResponse = await requestContext.post('/api/v1/auth/login', {
      data: {
        email: testAdminEmail,
        password: testAdminPassword,
      },
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      console.log('✅ Test admin user verified and can authenticate');
      if (loginData.token) {
        console.log('✅ Authentication token obtained');
        // Store token for use in data seeding
        process.env.TEST_AUTH_TOKEN = loginData.token;

        // 4. Clean up ALL old test data from database (including soft-deleted)
        console.log('🧹 Cleaning up ALL old test data from database...');
        const cleanupResponse = await requestContext.post('/api/v1/test/cleanup-all-cards', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          },
        });

        if (cleanupResponse.ok()) {
          const cleanupData = await cleanupResponse.json();
          console.log(`✅ Database cleanup complete: ${cleanupData.deleted_count} cards removed`);
        } else {
          console.warn(`⚠️  Database cleanup failed: ${cleanupResponse.status()}`);
        }

        // 5. Seed test data
        console.log('🌱 Seeding test data...');
        const seeder = new TestDataSeeder(requestContext, loginData.token);
        await seeder.seedAll();
        console.log('✅ Test data seeding complete');
      }
    } else {
      const errorText = await loginResponse.text();
      console.error(`❌ Test admin user verification failed: ${errorText}`);
      throw new Error(`Cannot verify test admin user: ${loginResponse.status()}`);
    }

    // 3. Clear any stale authentication state (call test reset endpoint if available)
    console.log('🧹 Clearing stale authentication state...');
    const resetResponse = await requestContext.post('/api/v1/test/reset-auth');
    if (resetResponse.ok()) {
      console.log('✅ Authentication state reset');
    } else {
      console.warn('⚠️  Auth reset endpoint not available (may not be implemented yet)');
    }

    // 5. Store API URL for tests to use
    process.env.API_URL = apiURL;
    process.env.BASE_URL = baseURL;

    console.log('✅ Global setup complete');
    console.log('============================================');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await requestContext.dispose();
  }
}

export default globalSetup;
