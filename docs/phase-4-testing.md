# Phase 4 Testing Documentation

## Overview
Comprehensive test suite for Phase 4: Advanced Features, ensuring all new functionality works correctly and doesn't break existing features from Phases 0-3.

## Test Structure

### 1. Test Utilities
**Location**: `src/lib/__tests__/test-utils.tsx`

Provides:
- `renderWithProviders()` - Custom render with QueryClient and Router
- Mock data generators (mockCard, mockRelationship, etc.)
- API response mocking helpers

### 2. Hook Tests

#### Bulk Operations Hooks
**File**: `src/lib/__tests__/bulk-hooks.test.ts`
- ✅ useBulkDeleteCards - Single and batch deletions
- ✅ useBulkUpdateCards - Field updates and partial updates
- ✅ useBulkExportCards - CSV and Excel export formats

#### Export Hooks
**File**: `src/lib/__tests__/export-hooks.test.ts`
- ✅ useExportCards - Format selection, templates, filters
- ✅ useExportGovernance - Domain-specific exports
- ✅ useDownloadExport - Blob download trigger

#### Search Hooks
**File**: `src/lib/__tests__/search-hooks.test.ts`
- ✅ useGlobalSearch - Query validation, domain filtering
- ✅ useSearchSuggestions - Autocomplete functionality
- ✅ useSavedSearches - CRUD operations

#### Keyboard Shortcuts Hooks
**File**: `src/lib/__tests__/useKeyboardShortcuts.test.ts`
- ✅ useKeyboardShortcuts - Event registration, context filtering
- ✅ formatShortcut - Key combination formatting
- ✅ findConflicts - Conflict detection

#### Relationship Hooks
**File**: `src/lib/__tests__/relationship-hooks.test.ts`
- ✅ useDependencyChains - Chain fetching with depth control
- ✅ useRelationshipMatrix - Matrix generation with filters
- ✅ useImpactAnalysis - Risk assessment and dependency counts
- ✅ useRelationshipTypes - Type enumeration
- ✅ useCriticalPaths - Critical path identification

#### Import Hooks
**File**: `src/lib/__tests__/import-hooks.test.ts`
- ✅ useBulkImportCards - File upload with column mapping
- ✅ useImportStatus - Job status polling

### 3. Component Tests

#### Bulk Components
**File**: `src/components/bulk/__tests__/BulkActionsToolbar.test.tsx`
- ✅ Conditional rendering based on selection
- ✅ Singular/plural text
- ✅ All button callbacks

**File**: `src/components/bulk/__tests__/BulkEditDialog.test.tsx`
- ✅ Dialog open/close states
- ✅ Form field interactions
- ✅ Form submission

### 4. Regression Tests
**File**: `src/__tests__/regression.test.ts`

Ensures Phase 4 doesn't break existing functionality:

#### Phase 0: Basic Architecture
- ✅ Layout component renders without errors
- ✅ Routing structure intact

#### Phase 1: Core Card Management
- ✅ Card listing functionality
- ✅ Card creation
- ✅ Card CRUD operations

#### Phase 2: Intelligence Features
- ✅ BIA profile fetching
- ✅ TCO calculation
- ✅ Migration assessment

#### Phase 3: Governance & Compliance
- ✅ Architecture principles listing
- ✅ Technology standards
- ✅ ARB meetings
- ✅ Policy compliance checks

#### Cross-Phase Integration
- ✅ Cards with governance relationships
- ✅ Existing card relationships preserved

### 5. Backend Integration Tests
**File**: `archzero-api/src/handlers/tests/bulk_tests.rs`

Tests for Rust backend handlers:
- ✅ bulk_delete_cards endpoint
- ✅ bulk_update_cards endpoint
- ✅ bulk_export_cards endpoint
- ✅ Error handling (invalid UUIDs, empty lists)
- ✅ Field preservation during updates

## Running Tests

### Install Dependencies
```bash
cd archzero-ui
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in UI Mode
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- bulk-hooks.test.ts
```

## Coverage Goals

Target coverage:
- **Hooks**: 90%+ coverage
- **Components**: 80%+ coverage
- **Handlers**: 85%+ coverage
- **Regression**: 100% (all existing features tested)

## Test Categories

### Unit Tests
- Individual hook logic
- Utility functions
- Data transformations

### Integration Tests
- Hook + API interactions
- Component + state management
- Cross-component workflows

### Regression Tests
- Existing feature preservation
- API contract maintenance
- Database schema compatibility

### E2E Tests (Future)
- Complete user workflows
- Cross-page interactions
- Real browser automation (Playwright)

## Continuous Integration

Tests should run on:
- Every pull request
- Before merging to main
- During deployment pipeline

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Run: `npm install`
   - Check tsconfig.json paths

2. **Mock not working**
   - Ensure vi.clearAllMocks() in beforeEach
   - Check mock path is correct

3. **Test timeout**
   - Increase timeout: `test.setTimeout(5000)`
   - Check for async/await issues

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Performance testing for bulk operations
- [ ] Visual regression tests for components
- [ ] Load testing for import/export
- [ ] API contract testing

## Summary

**Total Test Files**: 11
**Total Test Cases**: 80+
**Coverage Areas**:
- ✅ All 7 Phase 4 features tested
- ✅ Regression tests for Phases 0-3
- ✅ Backend handler integration tests
- ✅ Error scenarios covered

All tests ensure Phase 4 features work correctly while maintaining backward compatibility with existing functionality.
