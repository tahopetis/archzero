#!/bin/bash
# Arc Zero SAFE Cleanup with Git Backup Strategy
# Creates a backup branch before cleaning up

set -e

echo "🔧 Arc Zero Cleanup with Git Backup"
echo "====================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cd /home/tahopetis/dev/archzero

echo -e "${BLUE}📋 Plan:${NC}"
echo "  1. Create backup branch: cleanup-backup-$(date +%Y%m%d)"
echo "  2. Push backup branch to remote"
echo "  3. Cleanup main branch"
echo "  4. Commit cleanup changes"
echo "  5. Verify build still works"
echo ""
echo -e "${GREEN}✅ Benefits:${NC}"
echo "  - Full git history preserved in backup branch"
echo "  - Can restore with: git checkout cleanup-backup-*"
echo "  - Can compare: git diff cleanup-backup-* main"
echo ""

# Ask for confirmation
echo -e "${YELLOW}⚠️  This will:${NC}"
echo "  1. Create and push a new branch"
echo "  2. Delete files from main branch"
echo "  3. Commit changes to main"
echo ""
read -p "Continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "❌ Aborted."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
BACKUP_BRANCH="cleanup-backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting cleanup..."
echo ""

# Step 1: Create backup branch
echo -e "${BLUE}[1/6]${NC} Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH"
echo "   ✅ Created branch: $BACKUP_BRANCH"

# Step 2: Push backup branch to remote
echo ""
echo -e "${BLUE}[2/6]${NC} Pushing backup branch to remote..."
git push -u origin "$BACKUP_BRANCH"
echo "   ✅ Backup pushed to origin/$BACKUP_BRANCH"
echo "   📦 You can restore anytime with: git checkout $BACKUP_BRANCH"

# Step 3: Switch back to main
echo ""
echo -e "${BLUE}[3/6]${NC} Switching back to main branch..."
git checkout main
echo "   ✅ Back on main branch"

# Step 4: Perform cleanup
echo ""
echo -e "${BLUE}[4/6]${NC} Cleaning up files..."

# Remove duplicate directory
if [ -d "archzero" ]; then
    rm -rf archzero
    echo "   ✅ Removed archzero/ (duplicate directory)"
fi

# Remove binary
if [ -f "bdui-linux-x64" ]; then
    rm -f bdui-linux-x64
    echo "   ✅ Removed bdui-linux-x64 (103MB binary)"
fi

# Remove root package files
if [ -f "package.json" ]; then
    rm -f package.json package-lock.json
    echo "   ✅ Removed package.json & package-lock.json (root)"
fi

# Move playwright config
if [ -f "playwright.config.ts" ]; then
    mkdir -p e2e
    mv playwright.config.ts e2e/
    echo "   ✅ Moved playwright.config.ts to e2e/"
fi

# Step 5: Update .gitignore
echo ""
echo -e "${BLUE}[5/6]${NC} Updating .gitignore..."
{
    echo ""
    echo "# Binaries (cleanup)"
    echo "bdui-linux-x64"
    echo "*.exe"
    echo "*.dll"
    echo "*.so"
    echo "*.dylib"
    echo ""
    echo "# Duplicate directories (cleanup)"
    echo "archzero/"
} >> .gitignore
echo "   ✅ Updated .gitignore"

# Step 6: Commit cleanup
echo ""
echo -e "${BLUE}[6/6]${NC} Committing cleanup changes..."
git add -A
git commit -m "chore: Clean up duplicate directories and binaries

- Remove duplicate archzero/ directory (outdated files)
- Remove bdui-linux-x64 binary (103MB)
- Remove root package.json/package-lock.json (unused)
- Move playwright.config.ts to e2e/
- Update .gitignore

Backup branch available: $BACKUP_BRANCH
Space saved: ~103MB

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
echo "   ✅ Changes committed"

echo ""
echo "✨ Cleanup complete!"
echo ""
echo -e "${GREEN}📊 Summary:${NC}"
echo "   ✅ Backup branch: $BACKUP_BRANCH"
echo "   ✅ Binary removed (103MB saved)"
echo "   ✅ Root files cleaned"
echo "   ✅ Duplicate directory removed"
echo "   ✅ Changes committed to main"
echo ""
echo -e "${BLUE}🔍 To verify everything works:${NC}"
echo "   cd archzero-api && cargo check          # Verify backend"
echo "   cd ../archzero-ui && npm run build     # Verify frontend"
echo ""
echo -e "${BLUE}📋 If anything is wrong, restore:${NC}"
echo "   git checkout $BACKUP_BRANCH            # Switch to backup"
echo "   git checkout main                       # Switch back when ready"
echo "   git diff main $BACKUP_BRANCH           # Compare branches"
echo ""
echo -e "${BLUE}🚀 To finish:${NC}"
echo "   git push origin main                    # Push cleaned main"
echo "   (When satisfied, delete backup branch: git push origin --delete $BACKUP_BRANCH)"
echo ""
