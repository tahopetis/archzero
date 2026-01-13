#!/bin/bash
# Arc Zero SAFE Cleanup Script
# Run this to safely clean up the codebase without losing work

set -e

echo "🔧 Arc Zero SAFE Codebase Cleanup"
echo "=================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /home/tahopetis/dev/archzero

echo -e "${BLUE}📊 What will be cleaned:${NC}"
echo "  ❌ Binary: bdui-linux-x64 (103MB)"
echo "  ❌ Root: package.json, package-lock.json"
echo "  ❌ Root: playwright.config.ts"
echo "  ⚠️  Duplicate: archzero/ (2 files differ - will backup first)"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  PROCEED WITH CAUTION${NC}"
echo "The duplicate archzero/ directory contains 2 files that differ from main."
echo "We will BACK UP these files before cleanup."
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo "🚀 Starting safe cleanup..."
echo ""

# 1. Backup different files from duplicate directory
echo -e "${GREEN}[1/6]${NC} Backing up differing files..."
mkdir -p .backup/archzero-duplicate

if [ -f "archzero/archzero-ui/src/components/relationships/ImpactAnalysis.tsx" ]; then
    cp archzero/archzero-ui/src/components/relationships/ImpactAnalysis.tsx \
       .backup/archzero-duplicate/ImpactAnalysis.tsx
    echo "   ✅ Backed up ImpactAnalysis.tsx (duplicate version)"
fi

if [ -f "archzero/archzero-api/tests/phase2_smoke_test.rs" ]; then
    cp archzero/archzero-api/tests/phase2_smoke_test.rs \
       .backup/archzero-duplicate/phase2_smoke_test.rs
    echo "   ✅ Backed up phase2_smoke_test.rs (duplicate version)"
fi

echo "   📦 Backup location: .backup/archzero-duplicate/"

# 2. Show what differs
echo ""
echo -e "${BLUE}[2/6]${NC} File comparison summary:"
if [ -f ".backup/archzero-duplicate/ImpactAnalysis.tsx" ]; then
    echo "   📄 ImpactAnalysis.tsx:"
    echo "      Duplicate: $(wc -l < .backup/archzero-duplicate/ImpactAnalysis.tsx) lines"
    echo "      Main:      $(wc -l < archzero-ui/src/components/relationships/ImpactAnalysis.tsx) lines"
    echo "      → Main version is NEWER (will be kept)"
fi

# 3. Remove binary file
echo ""
echo -e "${GREEN}[3/6]${NC} Removing binary file bdui-linux-x64 (103MB)..."
if [ -f "bdui-linux-x64" ]; then
    rm -f bdui-linux-x64
    echo "   ✅ Removed bdui-linux-x64 (frees 103MB!)"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 4. Remove root package files
echo -e "${GREEN}[4/6]${NC} Removing root level package.json files..."
if [ -f "package.json" ]; then
    rm -f package.json package-lock.json
    echo "   ✅ Removed package.json & package-lock.json"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 5. Move playwright config
echo -e "${GREEN}[5/6]${NC} Moving playwright.config.ts to e2e/..."
if [ -f "playwright.config.ts" ]; then
    mkdir -p e2e
    mv playwright.config.ts e2e/
    echo "   ✅ Moved to e2e/playwright.config.ts"
else
    echo "   ⏭️  Skipped (already moved)"
fi

# 6. Remove duplicate directory (NOW SAFE)
echo -e "${GREEN}[6/6]${NC} Removing duplicate archzero/ directory..."
if [ -d "archzero" ]; then
    rm -rf archzero
    echo "   ✅ Removed archzero/ (differing files backed up)"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 7. Update .gitignore
echo ""
echo -e "${GREEN}[7/7]${NC} Updating .gitignore..."
{
    echo ""
    echo "# Binaries"
    echo "bdui-linux-x64"
    echo "*.exe"
    echo "*.dll"
    echo "*.so"
    echo "*.dylib"
    echo ""
    echo "# Backup directory"
    echo ".backup/"
    echo ""
    echo "# Duplicate directories (legacy)"
    echo "archzero/"
} >> .gitignore
echo "   ✅ Updated .gitignore"

echo ""
echo "✨ Safe cleanup complete!"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   ✅ Binary removed (103MB saved)"
echo "   ✅ Root package files cleaned"
echo "   ✅ Playwright config moved"
echo "   ✅ Duplicate directory removed"
echo "   ✅ Differing files backed up to .backup/archzero-duplicate/"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   Check the backup files:"
echo "   - .backup/archzero-duplicate/ImpactAnalysis.tsx"
echo "   - .backup/archzero-duplicate/phase2_smoke_test.rs"
echo ""
echo "   If these contain important work not in main, merge them manually!"
echo ""
echo "📋 Next steps:"
echo "   1. Review backup: ls -la .backup/archzero-duplicate/"
echo "   2. Compare files: diff .backup/archzero-duplicate/ImpactAnalysis.tsx archzero-ui/src/components/relationships/ImpactAnalysis.tsx"
echo "   3. Commit cleanup: git add .gitignore && git commit -m 'chore: Safe cleanup of duplicate files and binaries'"
echo "   4. Delete backup when ready: rm -rf .backup/"
echo ""
