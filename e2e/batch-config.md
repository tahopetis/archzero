# E2E Test Batching Configuration

## Overview
This document describes the test batching strategy for ArchZero E2E tests.

## Test Tags

### @smoke
Critical happy-path tests that MUST pass for the application to be considered functional.
Run these on every commit/PR.

**Tests:**
- Login with valid credentials
- Navigate to cards page
- Create a card
- View card details
- Basic search
- Logout

### @critical
Tests covering critical business logic.
Run these before merging to main.

**Tests:**
- All authentication flows
- Card CRUD operations
- Relationship management
- RBAC permissions
- Data integrity

### @regression
Full test suite for pre-release validation.

### @slow
Tests that are particularly slow (network simulation, large datasets, etc).

## Test Batches

### Batch 1: Smoke Tests
```bash
npx playwright test --grep @smoke
```
**Time:** ~1-2 minutes
**When:** Every commit, PR validation

### Batch 2: Authentication & Access
```bash
npx playwright test auth/ multi-user/ --grep "@critical"
```
**Time:** ~3 minutes
**When:** Working on auth/RBAC features

### Batch 3: Core Cards & Relationships
```bash
npx playwright test cards/ relationships/
```
**Time:** ~4 minutes
**When:** Working on card/relationship features

### Batch 4: Governance & Strategy
```bash
npx playwright test governance/ risk-compliance/ strategic-planning/
```
**Time:** ~5 minutes
**When:** Working on governance features

### Batch 5: ARB Workflows
```bash
npx playwright test arb/
```
**Time:** ~4 minutes
**When:** Working on ARB features

### Batch 6: Search & Discovery
```bash
npx playwright test search/
```
**Time:** ~3 minutes
**When:** Working on search features

### Batch 7: Import/Export
```bash
npx playwright test import-export/
```
**Time:** ~3 minutes
**When:** Working on import/export features

### Batch 8: Visualizations
```bash
npx playwright test visualizations/
```
**Time:** ~5 minutes
**When:** Working on visualization features

### Batch 9: API Mocking & Edge Cases
```bash
npx playwright test api-mocking/ error-handling/
```
**Time:** ~6 minutes
**When:** Working on API integration or error handling

### Batch 10: Full Regression
```bash
npx playwright test
```
**Time:** ~15-20 minutes
**When:** Pre-release, weekly

## Running Batches

### Quick Development Loop
```bash
# Run only smoke tests
npm run test:smoke

# Run specific batch
npm run test:batch:auth
npm run test:batch:cards
npm run test:batch:governance
```

### Before Committing
```bash
# Run smoke + critical tests for the feature you're working on
npm run test:feature:cards
```

### Before Release
```bash
# Run full regression
npm run test:regression
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:smoke

  feature-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        batch: [auth, cards, governance, arb, search]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:batch:${{ matrix.batch }}

  regression:
    if: github.event_name == 'release'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:regression
```

## Test Data Management

### Test Isolation
Each test should:
1. Create its own test data
2. Clean up after itself
3. Use unique identifiers (timestamps, UUIDs)

### Fixtures Location
Test fixtures are located in:
- `e2e/fixtures/` - Static test data
- `e2e/factories/` - Data factories for generating test data

## Parallel Execution

Playwright supports parallel test execution. Configure in `playwright.config.ts`:

```typescript
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 4 : 2, // Fewer workers locally to save resources
});
```

## Debugging Failed Tests

### Run in headed mode
```bash
npx playwright test auth.spec.ts --headed
```

### Run with debugger
```bash
npx playwright test auth.spec.ts --debug
```

### Take screenshots on failure
Already configured in `playwright.config.ts`:
- Screenshot: `test-results/[test-name]-screenshot.png`
- Video: `test-results/[test-name]/video.webm`
- Trace: `test-results/[test-name]/trace.zip`

### View trace
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

## Best Practices

1. **Run smoke tests before every commit**
2. **Run feature batch when working on that feature**
3. **Run full regression before merging to main**
4. **Keep tests independent and isolated**
5. **Use descriptive test names**
6. **Add appropriate tags (@smoke, @critical, @slow)**
7. **Clean up test data after each test**
8. **Use factories instead of hardcoded data**
9. **Mock external services to improve reliability**
10. **Review test failures regularly and fix flaky tests**
