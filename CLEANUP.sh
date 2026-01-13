#!/bin/bash
# Arc Zero Codebase Cleanup Script
# Run this to fix the structural issues identified in CODEBASE_STRUCTURE_ANALYSIS.md

set -e

echo "🔧 Arc Zero Codebase Cleanup"
echo "=============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /home/tahopetis/dev/archzero

echo "📊 Current Issues:"
echo "  ❌ Duplicate archzero/ directory: 44KB"
echo "  ❌ Binary file bdui-linux-x64: 107MB"
echo "  ❌ Root level package.json files (conflict)"
echo "  ❌ Root level playwright.config.ts (misplaced)"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will DELETE files and directories. Review first!${NC}"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

echo "🚀 Starting cleanup..."
echo ""

# 1. Remove duplicate archzero directory
echo -e "${GREEN}[1/5]${NC} Removing duplicate archzero/ directory..."
if [ -d "archzero" ]; then
    rm -rf archzero
    echo "   ✅ Removed archzero/"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 2. Remove binary file
echo -e "${GREEN}[2/5]${NC} Removing binary file bdui-linux-x64 (107MB)..."
if [ -f "bdui-linux-x64" ]; then
    rm -f bdui-linux-x64
    echo "   ✅ Removed bdui-linux-x64"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 3. Remove root package files
echo -e "${GREEN}[3/5]${NC} Removing root level package.json files..."
if [ -f "package.json" ]; then
    rm -f package.json package-lock.json
    echo "   ✅ Removed package.json & package-lock.json"
else
    echo "   ⏭️  Skipped (already removed)"
fi

# 4. Move playwright config
echo -e "${GREEN}[4/5]${NC} Moving playwright.config.ts to e2e/..."
if [ -f "playwright.config.ts" ]; then
    mkdir -p e2e
    mv playwright.config.ts e2e/
    echo "   ✅ Moved to e2e/playwright.config.ts"
else
    echo "   ⏭️  Skipped (already moved)"
fi

# 5. Update .gitignore
echo -e "${GREEN}[5/5]${NC} Updating .gitignore..."
{
    echo ""
    echo "# Binaries"
    echo "bdui-linux-x64"
    echo "*.exe"
    echo "*.dll"
    echo "*.so"
    echo "*.dylib"
    echo ""
    echo "# Duplicate directories (legacy)"
    echo "archzero/"
} >> .gitignore
echo "   ✅ Updated .gitignore"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Review changes: git status"
echo "   2. Commit cleanup: git add .gitignore && git commit -m 'chore: Remove duplicate directories and binaries'"
echo "   3. See full analysis: cat CODEBASE_STRUCTURE_ANALYSIS.md"
echo ""
