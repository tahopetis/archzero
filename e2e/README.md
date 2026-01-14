# Arc Zero E2E Tests

End-to-end testing suite for Arc Zero using Playwright.

## Setup

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in specific file
npm test -- auth.spec.ts

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI
npm run test:ui

# Run tests in specific browser
npm test -- --project=chromium
npm test -- --project=firefox
npm test -- --project=webkit

# Run tests in debug mode
npm run test:debug

# Run tests and generate coverage
npm run test:coverage
```

## Test Structure

```
e2e/
├── fixtures/          # Test fixtures (auth, data)
├── factories/         # Test data factories
├── helpers/           # Test helpers and utilities
├── pages/             # Page object models
├── test-data/         # Static test data
├── auth/              # Authentication tests
├── cards/             # Card management tests
├── governance/        # Governance feature tests
├── reports/           # Visualization tests
└── *.spec.ts          # Test files
```

## Environment Variables

Create a `.env` file in the `e2e` directory:

```bash
BASE_URL=http://localhost:3000
API_URL=http://localhost:8080
TEST_ADMIN_EMAIL=admin@archzero.local
TEST_ADMIN_PASSWORD=changeme123
NODE_ENV=test
```

## Writing Tests

### Using Fixtures

```typescript
import { test } from '../fixtures/auth.fixture';

test('my test', async ({ authenticatedAsAdmin }) => {
  // Test code here - already authenticated as admin
});
```

### Using Page Objects

```typescript
import { DashboardPage } from '../pages/dashboard.page';

test('dashboard test', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await dashboard.verifyDashboardLoaded();
});
```

### Using Test Data Factories

```typescript
import { CardFactory } from '../factories/card.factory';

test('create card', async ({ page }) => {
  const cardData = CardFactory.createApplication({
    name: 'Test App',
  });
  // Use cardData in test
});
```

## Debugging

```bash
# Run in debug mode
npm run test:debug

# Run specific test in headed mode
npm test -- --headed --grep "test name"

# Take screenshot on failure (automatic)
# View trace in Playwright Inspector
npm run test:debug -- --trace on
```

## Test Reports

After running tests:

```bash
# View HTML report
npm run test:report

# View test results
cat test-results.json
```

## CI/CD Integration

Tests run automatically in CI on every PR:

```yaml
- name: Run E2E tests
  run: npm test
  env:
    CI: true
```

## Best Practices

1. **Use fixtures for auth** - Prefer `authenticatedAsAdmin` over manual login
2. **Use page objects** - Keep test code clean and maintainable
3. **Use factories** - Generate consistent test data
4. **Avoid hardcoded waits** - Use `waitForLoadState` instead
5. **Clean up test data** - Delete cards created during tests
6. **Run tests in parallel** - Tests should be independent
7. **Use descriptive names** - Test names should explain what they test

## Troubleshooting

### Tests fail with "Network error"
- Ensure backend is running on port 8080
- Check API_URL environment variable

### Tests timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if frontend is running

### Browser not found
- Install browsers: `npx playwright install`

### Tests are flaky
- Run with retries: `npm test -- --retries=3`
- Check for timing issues
- Ensure proper cleanup between tests
