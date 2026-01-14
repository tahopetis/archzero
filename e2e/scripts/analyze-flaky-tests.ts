/**
 * Flaky Test Detection Script
 *
 * Analyzes Playwright test results to identify flaky tests.
 * A test is considered flaky if it fails on first run but passes on retry.
 *
 * Usage: node scripts/analyze-flaky-tests.js
 */

import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: string;
  retries?: number;
  duration: number;
}

interface SuiteStats {
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  duration: number;
}

interface FlakyTest {
  name: string;
  file: string;
  attempts: number;
  failures: number;
  passRate: number;
  avgDuration: number;
}

function analyzeFlakyTests(resultsPath: string): {
  stats: SuiteStats;
  flakyTests: FlakyTest[];
  recommendations: string[];
} {
  console.log('🔍 Analyzing test results for flakiness...\n');

  // Read test results
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Test results not found: ${resultsPath}`);
    console.log('   Run tests first: npx playwright test');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

  // Analyze each test
  const flakyTests: FlakyTest[] = [];
  const allTests: TestResult[] = [];

  results.suites?.forEach((suite: any) => {
    suite.specs?.forEach((spec: any) => {
      spec.tests?.forEach((test: any) => {
        allTests.push({
          name: test.title,
          status: test.results[0]?.status,
          retries: test.results.length - 1,
          duration: test.results.reduce((sum: number, r: any) => sum + r.duration, 0),
        });

        // Check if test is flaky (failed initially but passed after retry)
        if (test.results.length > 1) {
          const firstRun = test.results[0];
          const lastRun = test.results[test.results.length - 1];

          if (firstRun.status === 'failed' && lastRun.status === 'passed') {
            flakyTests.push({
              name: test.title,
              file: suite.file,
              attempts: test.results.length,
              failures: test.results.filter((r: any) => r.status === 'failed').length,
              passRate: (1 / test.results.length) * 100,
              avgDuration: test.results.reduce((sum: number, r: any) => sum + r.duration, 0) / test.results.length,
            });
          }
        }
      });
    });
  });

  // Calculate stats
  const stats: SuiteStats = {
    total: results.stats?.expected || 0,
    passed: results.stats?.expected - (results.stats?.failed || 0) || 0,
    failed: results.stats?.failed || 0,
    flaky: flakyTests.length,
    skipped: results.stats?.skipped || 0,
    duration: results.stats?.duration || 0,
  };

  // Generate recommendations
  const recommendations: string[] = [];

  if (flakyTests.length > 0) {
    recommendations.push(`🔴 Found ${flakyTests.length} flaky test(s) that need attention`);

    const highFlakiness = flakyTests.filter((t) => t.failures >= 2);
    if (highFlakiness.length > 0) {
      recommendations.push(`   - ${highFlakiness.length} test(s) with high flakiness (2+ retries)`);
    }

    // Check for specific patterns
    const slowFlakyTests = flakyTests.filter((t) => t.avgDuration > 5000);
    if (slowFlakyTests.length > 0) {
      recommendations.push('⏱️  Some flaky tests are slow - consider timeouts or race conditions');
    }

    recommendations.push('💡 Common flaky test fixes:');
    recommendations.push('   1. Replace waitForTimeout with explicit waits');
    recommendations.push('   2. Use waitForSelector or waitForResponse for dynamic content');
    recommendations.push('   3. Check for race conditions in parallel execution');
    recommendations.push('   4. Ensure test data cleanup between runs');
    recommendations.push('   5. Add proper retries in playwright.config.ts');
  } else {
    recommendations.push('✅ No flaky tests detected!');
  }

  if (stats.failed > flakyTests.length) {
    const realFailures = stats.failed - flakyTests.length;
    recommendations.push(`🔴 ${realFailures} test(s) genuinely failed (not flaky)`);
  }

  // Print results
  console.log('📊 Test Suite Statistics:\n');
  console.log(`   Total Tests:    ${stats.total}`);
  console.log(`   Passed:         ${stats.passed}`);
  console.log(`   Failed:         ${stats.failed}`);
  console.log(`   Flaky:          ${stats.flaky}`);
  console.log(`   Skipped:        ${stats.skipped}`);
  console.log(`   Duration:       ${(stats.duration / 1000).toFixed(2)}s`);
  console.log(`   Pass Rate:      ${((stats.passed / stats.total) * 100).toFixed(1)}%`);

  if (flakyTests.length > 0) {
    console.log('\n⚠️  Flaky Tests Detected:\n');
    flakyTests.forEach((test, index) => {
      console.log(`   ${index + 1}. ${test.name}`);
      console.log(`      File:     ${test.file}`);
      console.log(`      Attempts: ${test.attempts} (${test.failures} failures)`);
      console.log(`      Pass Rate: ${test.passRate.toFixed(1)}%`);
      console.log(`      Duration:  ${test.avgDuration.toFixed(0)}ms`);
      console.log('');
    });
  }

  console.log('\n💡 Recommendations:\n');
  recommendations.forEach((rec) => console.log(`   ${rec}`));

  console.log('\n' + '='.repeat(60));

  // Flakiness threshold
  const flakinessRate = (stats.flaky / stats.total) * 100;

  if (flakinessRate === 0) {
    console.log('\n✅ EXCELLENT: No flaky tests!');
  } else if (flakinessRate < 2) {
    console.log('\n🟢 GOOD: Low flakiness rate');
  } else if (flakinessRate < 5) {
    console.log('\n🟡 ACCEPTABLE: Moderate flakiness - consider improvements');
  } else if (flakinessRate < 10) {
    console.log('\n🟠 CONCERNING: High flakiness - needs attention');
  } else {
    console.log('\n🔴 CRITICAL: Very high flakiness - immediate action required');
  }

  console.log('\n' + '='.repeat(60) + '\n');

  return {
    stats,
    flakyTests,
    recommendations,
  };
}

// Run analysis if executed directly
if (require.main === module) {
  const resultsPath = process.argv[2] || path.join(process.cwd(), 'test-results.json');

  try {
    analyzeFlakyTests(resultsPath);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Analysis failed!\n');
    console.error(error);
    process.exit(1);
  }
}

export { analyzeFlakyTests };
