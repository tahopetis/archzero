#!/bin/bash
# E2E Test Batch Runner
# Usage: ./run-tests.sh [batch-name|smoke|critical|regression]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Display usage
usage() {
    cat << EOF
E2E Test Batch Runner

Usage: ./run-tests.sh [BATCH_NAME] [OPTIONS]

Batches:
  smoke              Run smoke tests only (fast)
  critical           Run critical tests
  regression         Run full regression suite

  auth               Authentication & RBAC tests
  cards              Core cards & relationships
  governance         Governance, risk & compliance, strategic planning
  arb                ARB workflow tests
  search             Search & discovery tests
  import-export      Import/export tests
  visualizations     Visualization & reports tests
  api-mocking        API mocking & error handling tests

Options:
  --headed           Run tests in headed mode (show browser)
  --debug            Run tests in debug mode
  --ui               Run tests with Playwright UI
  --project=BROWSER  Run on specific browser (chromium, firefox, webkit)
  --workers=N        Set number of parallel workers

Examples:
  ./run-tests.sh smoke
  ./run-tests.sh cards --project=chromium
  ./run-tests.sh auth --headed --workers=1
  ./run-tests.sh regression --ui

EOF
    exit 1
}

# Check if batch name is provided
if [ $# -eq 0 ]; then
    usage
fi

BATCH_NAME=$1
shift
EXTRA_ARGS="$@"

# Map batch names to npm scripts
case $BATCH_NAME in
    smoke)
        print_info "Running smoke tests..."
        npm run test:smoke $EXTRA_ARGS
        ;;
    critical)
        print_info "Running critical tests..."
        npm run test:critical $EXTRA_ARGS
        ;;
    regression)
        print_info "Running full regression suite..."
        npm run test:regression $EXTRA_ARGS
        ;;
    auth)
        print_info "Running authentication & access control tests..."
        npm run test:batch:auth $EXTRA_ARGS
        ;;
    cards)
        print_info "Running core cards & relationships tests..."
        npm run test:batch:cards $EXTRA_ARGS
        ;;
    governance)
        print_info "Running governance & strategic planning tests..."
        npm run test:batch:governance $EXTRA_ARGS
        ;;
    arb)
        print_info "Running ARB workflow tests..."
        npm run test:batch:arb $EXTRA_ARGS
        ;;
    search)
        print_info "Running search & discovery tests..."
        npm run test:batch:search $EXTRA_ARGS
        ;;
    import-export)
        print_info "Running import/export tests..."
        npm run test:batch:import-export $EXTRA_ARGS
        ;;
    visualizations)
        print_info "Running visualization & reports tests..."
        npm run test:batch:visualizations $EXTRA_ARGS
        ;;
    api-mocking)
        print_info "Running API mocking & error handling tests..."
        npm run test:batch:api-mocking $EXTRA_ARGS
        ;;
    failures)
        print_info "Re-running failed tests..."
        npm run test:failures $EXTRA_ARGS
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        print_error "Unknown batch: $BATCH_NAME"
        echo ""
        usage
        ;;
esac

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    print_info "✓ Tests passed!"
    echo ""
    echo "View test report: npm run test:report"
else
    print_error "✗ Tests failed!"
    echo ""
    echo "Re-run failed tests: ./run-tests.sh failures"
    echo "View test report: npm run test:report"
    exit $EXIT_CODE
fi
