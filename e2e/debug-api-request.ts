import { request } from '@playwright/test';

async function debugRequest() {
  console.log('🔍 Debugging API request...');

  const apiURL = 'http://localhost:3000';
  const email = 'admin@archzero.local';
  const password = 'changeme123';

  // Create request context
  const requestContext = await request.newContext({
    baseURL: apiURL,
  });

  try {
    // 1. Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await requestContext.post('/api/v1/auth/login', {
      data: { email, password },
    });

    console.log(`Login status: ${loginResponse.status()}`);
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginData.token) {
      throw new Error('No token received');
    }

    const token = loginData.token;
    console.log('✅ Got token:', token.substring(0, 20) + '...');

    // 2. Try creating a card with curl-style request
    console.log('\n2️⃣ Creating card via Playwright request...');
    const cardData = {
      name: 'Test-Application',
      type: 'Application',
      lifecyclePhase: 'Active',
      description: 'A test application for E2E testing',
      tags: ['test', 'e2e', 'automation'],
      attributes: {},
    };

    console.log('Request data:', JSON.stringify(cardData, null, 2));

    const createResponse = await requestContext.post('/api/v1/cards', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: cardData,
    });

    console.log(`\nCreate status: ${createResponse.status()}`);
    console.log('Create headers:', JSON.stringify(createResponse.headers(), null, 2));

    const responseText = await createResponse.text();
    console.log('Create response:', responseText);

    if (createResponse.ok()) {
      console.log('✅ Card created successfully!');
    } else {
      console.log('❌ Card creation failed');

      // Try with curl for comparison
      console.log('\n3️⃣ Testing with curl for comparison...');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await requestContext.dispose();
  }
}

debugRequest().catch(console.error);
