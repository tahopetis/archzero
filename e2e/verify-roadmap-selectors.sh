#!/bin/bash

echo "=== Verifying RoadmapPage Test Selectors ==="
echo ""

FILE="/home/tahopetis/dev/archzero/archzero-ui/src/pages/governance/strategic-planning/RoadmapPage.tsx"

echo "Checking for required test selectors:"
echo ""

# Array of required selectors
declare -a selectors=(
  "data-testid=\"transformation-roadmap\""
  "data-testid=\"roadmap-timeline\""
  "data-testid=\"generate-roadmap-btn\""
  "data-testid=\"baseline-select\""
  "data-testid=\"target-select\""
  "data-testid=\"roadmap-dependencies\""
  "data-testid=\"roadmap-milestone\""
  "data-testid=\"add-milestone-btn\""
  "data-testid=\"milestone-name\""
  "data-testid=\"milestone-date\""
  "data-testid=\"milestone-description\""
  "data-testid=\"phase-filter\""
)

passed=0
failed=0

for selector in "${selectors[@]}"; do
  if grep -q "$selector" "$FILE"; then
    echo "✅ Found: $selector"
    ((passed++))
  else
    echo "❌ Missing: $selector"
    ((failed++))
  fi
done

echo ""
echo "=== Summary ==="
echo "✅ Passed: $passed"
echo "❌ Failed: $failed"
echo ""

if [ $failed -eq 0 ]; then
  echo "🎉 All required test selectors are present!"
  exit 0
else
  echo "⚠️  Some test selectors are missing!"
  exit 1
fi
