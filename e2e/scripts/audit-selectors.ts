/**
 * Selector Audit Script
 *
 * Scans the frontend application to find all data-testid attributes
 * and compares them against expected selectors used in E2E tests.
 *
 * Usage: npx ts-node scripts/audit-selectors.ts
 */

import { chromium } from 'playwright';

interface SelectorAudit {
  found: string[];
  missing: string[];
  unused: string[];
  stats: {
    totalFound: number;
    totalMissing: number;
    totalUnused: number;
  };
}

async function auditSelectors() {
  console.log('🔍 Starting Selector Audit...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const baseURL = process.env.BASE_URL || 'http://localhost:5173';
  const apiURL = process.env.API_URL || 'http://localhost:3000';

  console.log(`📝 Frontend: ${baseURL}`);
  console.log(`🔧 Backend: ${apiURL}\n`);

  try {
    // Navigate to the app
    console.log('🌐 Loading application...');
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);

    // Scan all pages for data-testid attributes
    console.log('🔎 Scanning for data-testid attributes...\n');

    const testIds = await page.$$eval('[data-testid]', (elements) =>
      elements
        .map((el) => el.getAttribute('data-testid'))
        .filter((id): id is string => id !== null)
    );

    // Remove duplicates
    const uniqueTestIds = Array.from(new Set(testIds)).sort();

    console.log(`✅ Found ${uniqueTestIds.length} unique data-testid attributes:\n`);
    uniqueTestIds.forEach((id) => console.log(`   - ${id}`));

    // Expected selectors based on our implementation plan
    const expectedSelectors: string[] = [
      // Navigation
      'nav-dashboard',
      'nav-cards',
      'nav-intelligence',
      'nav-reports',
      'nav-governance-toggle',
      'nav-principles',
      'nav-standards',
      'nav-policies',
      'nav-exceptions',
      'nav-initiatives',
      'nav-risks',
      'nav-compliance',
      'nav-arb',
      'nav-themes',
      'nav-objectives',
      'nav-logo',
      'desktop-nav',
      'mobile-nav',
      'mobile-menu-toggle',

      // Card components
      'card-list',
      'cards-pagination',
      'cards-pagination-prev',
      'cards-pagination-next',
      'card-detail',
      'card-detail-back-button',
      'card-detail-edit-button',
      'card-detail-intelligence-button',
      'card-form',
      'card-name-input',
      'card-type-select',
      'card-lifecycle-select',
      'card-description-input',
      'card-save-button',
      'card-cancel-button',

      // Governance forms - Principles
      'principle-name-input',
      'principle-statement-input',
      'principle-rationale-input',
      'principle-implications-input',
      'principle-category-select',
      'principle-owner-input',
      'principle-save-button',
      'principle-cancel-button',

      // Governance forms - Standards
      'standard-name-input',
      'standard-description-input',
      'standard-category-select',
      'standard-status-select',
      'standard-save-button',
      'standard-cancel-button',

      // Governance forms - Policies
      'policy-name-input',
      'policy-description-input',
      'policy-severity-select',
      'policy-enforcement-select',
      'policy-save-button',
      'policy-cancel-button',

      // Governance forms - Exceptions
      'exception-name-input',
      'exception-justification-input',
      'exception-controls-input',
      'exception-type-select',
      'exception-save-button',
      'exception-cancel-button',

      // Governance forms - Initiatives
      'initiative-name-input',
      'initiative-description-input',
      'initiative-budget-input',
      'initiative-startDate-input',
      'initiative-endDate-input',
      'initiative-type-select',
      'initiative-status-select',
      'initiative-save-button',
      'initiative-cancel-button',

      // Governance forms - Risks
      'risk-name-input',
      'risk-mitigation-input',
      'risk-type-select',
      'risk-likelihood-select',
      'risk-impact-select',
      'risk-status-select',
      'risk-save-button',
      'risk-cancel-button',

      // Governance forms - Compliance
      'compliance-name-input',
      'compliance-description-input',
      'compliance-framework-select',
      'compliance-save-button',
      'compliance-cancel-button',

      // Relationship components
      'relationship-type-filter',
      'relationship-depth-selector',
      'relationship-layout-toggle',
      'relationship-search-input',
      'relationship-refresh-button',
      'relationship-export-button',
      'relationship-graph-container',
      'matrix-source-type-filter',
      'matrix-target-type-filter',
      'matrix-refresh-button',
      'matrix-export-button',
      'impact-analyze-button',
      'impact-upstream-list',
      'impact-downstream-list',
      'impact-score-summary',
      'dependency-expand-all',
      'dependency-collapse-all',
      'dependency-depth-filter',
      'dependency-chain-list',

      // Auth
      'login-email',
      'login-password',
      'login-button',
    ];

    // Find missing selectors
    const missing = expectedSelectors.filter((s) => !uniqueTestIds.includes(s));

    // Find unused selectors (found but not expected)
    const unused = uniqueTestIds.filter((id) => !expectedSelectors.includes(id));

    // Calculate stats
    const stats = {
      totalFound: uniqueTestIds.length,
      totalMissing: missing.length,
      totalUnused: unused.length,
    };

    const audit: SelectorAudit = {
      found: uniqueTestIds,
      missing,
      unused,
      stats,
    };

    // Print results
    console.log('\n📊 Audit Results:\n');
    console.log(`   Found:    ${stats.totalFound}`);
    console.log(`   Missing:  ${stats.totalMissing}`);
    console.log(`   Unused:   ${stats.totalUnused}`);

    if (missing.length > 0) {
      console.log('\n❌ Missing selectors:\n');
      missing.forEach((id) => console.log(`   - ${id}`));
    }

    if (unused.length > 0) {
      console.log('\n⚠️  Unused selectors (found but not expected):\n');
      unused.forEach((id) => console.log(`   - ${id}`));
    }

    // Overall health
    console.log('\n' + '='.repeat(50));
    const coverage = ((expectedSelectors.length - missing.length) / expectedSelectors.length) * 100;
    console.log(`\n📈 Coverage: ${coverage.toFixed(1)}%`);

    if (coverage === 100) {
      console.log('✅ All expected selectors are present!');
    } else if (coverage >= 90) {
      console.log('🟡 Good coverage, but a few selectors missing');
    } else if (coverage >= 70) {
      console.log('🟠 Moderate coverage - several selectors missing');
    } else {
      console.log('🔴 Low coverage - many selectors missing');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    await browser.close();

    return audit;
  } catch (error) {
    console.error('❌ Audit failed:', error);
    await browser.close();
    throw error;
  }
}

// Run audit if executed directly
if (require.main === module) {
  auditSelectors()
    .then(() => {
      console.log('✅ Selector audit complete!\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Selector audit failed!\n', error);
      process.exit(1);
    });
}

export { auditSelectors };
