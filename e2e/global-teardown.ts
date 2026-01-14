import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('============================================');
  console.log('🧹 Arc Zero E2E Test Suite - Global Teardown');

  const apiURL = process.env.API_URL || 'http://localhost:3000';

  console.log(`🔧 Backend API: ${apiURL}`);

  // 1. Report test completion statistics
  console.log('📊 Test Results Summary:');
  const testResultsPath = path.join(process.cwd(), 'test-results.json');
  if (fs.existsSync(testResultsPath)) {
    try {
      const testResults = JSON.parse(fs.readFileSync(testResultsPath, 'utf-8'));
      const stats = testResults.stats;
      console.log(`   Total: ${stats.expected}`);
      console.log(`   Passed: ${stats.expected - stats.failed}`);
      console.log(`   Failed: ${stats.failed}`);
      console.log(`   Skipped: ${stats.skipped || 0}`);
      console.log(`   Duration: ${Math.round(stats.duration / 1000)}s`);
    } catch (error) {
      console.warn('⚠️  Could not parse test results:', error);
    }
  } else {
    console.warn('⚠️  No test results found');
  }

  // 2. Note: Individual test cleanup is handled in afterEach hooks
  // Global teardown focuses on reporting and final cleanup

  console.log('✅ Global teardown complete');
  console.log('============================================');
}

export default globalTeardown;
