# Arc Zero Codebase Structure Analysis

**Date**: 2026-01-13
**Status**: ⚠️ **CRITICAL ISSUES FOUND**

---

## 🔴 CRITICAL STRUCTURAL PROBLEMS

### 1. **Duplicate Directory Structure**

```
/home/tahopetis/dev/archzero/
├── archzero/                    # ❌ UNNECESSARY NESTING
│   ├── archzero-api/           # Duplicate of ../archzero-api
│   └── archzero-ui/            # Duplicate of ../archzero-ui
├── archzero-api/               # ✅ CORRECT LOCATION
└── archzero-ui/                # ✅ CORRECT LOCATION
```

**Issue**: There's a confusing nested structure with duplicates
**Impact**:
- Developer confusion about which directory to work in
- Potential for code divergence
- Wasted disk space
- Git history pollution

**Recommendation**:
```bash
# Remove the nested duplicates
rm -rf archzero/
```

---

### 2. **Root Level Package Files**

```
/home/tahopetis/dev/archzero/
├── package.json                # ❌ Should be in archzero-ui/
├── package-lock.json           # ❌ Should be in archzero-ui/
├── playwright.config.ts        # ❌ Misplaced - should be in e2e/
├── bdui-linux-x64              # ❌ Binary file in root!
├── archzero-ui/
│   ├── package.json            # ✅ CORRECT
│   └── vitest.config.ts        # ✅ CORRECT
└── e2e/
    └── example.spec.ts         # ⚠️ Should be organized better
```

**Issues**:
- Root `package.json` conflicts with `archzero-ui/package.json`
- `bdui-linux-x64` is a binary that shouldn't be in git
- Playwright config at root level
- No monorepo configuration (no `pnpm-workspace.yaml` or `package.json` with workspaces)

**Recommendation**:
```bash
# Remove root package files
rm package.json package-lock.json

# Move playwright config to e2e/
mv playwright.config.ts e2e/

# Remove binary
rm -rf bdui-linux-x64

# Add to .gitignore
echo "bdui-linux-x64" >> .gitignore
```

---

### 3. **Duplicate Migrations**

```
/home/tahopetis/dev/archzero/
├── migrations/                 # ❌ Root level - confusing
│   ├── 001_initial.up.sql
│   ├── 002_update_cards_schema.up.sql
│   └── ...
└── archzero-api/
    └── migrations/             # ✅ CORRECT LOCATION
        ├── 001_add_performance_indexes.sql
        ├── 002_query_analysis.sql
        └── 003_connection_pool_config.md
```

**Issue**: Two separate migrations directories
**Recommendation**:
- Consolidate all migrations into `archzero-api/migrations/`
- Remove root `migrations/` directory
- Update migration naming to be sequential

---

### 4. **Scattered Documentation**

```
/home/tahopetis/dev/archzero/
├── docs/                       # ⚠️ Mixed phase documentation
│   ├── 00-prd.md
│   ├── 05-api-spec.md
│   ├── 09-implementation-plan.md
│   └── 10-phase5-implementation-complete.md
└── archzero-api/
    └── docs/                   # ⚠️ API-specific docs
        ├── principles-implementation.md
        └── risk-implementation-summary.md
```

**Issue**: Documentation split across two locations
**Recommendation**:
- Keep high-level docs in `/docs/` (PRD, specs, architecture)
- Move implementation details to `/docs/implementation/`
- Keep API-specific docs in `archzero-api/docs/`

---

## 📊 CURRENT STRUCTURE SUMMARY

### ✅ CORRECT STRUCTURES

```
archzero-api/                   # Rust backend
├── src/
│   ├── config/                 # ✅ Configuration
│   ├── handlers/               # ✅ HTTP handlers
│   ├── middleware/             # ✅ Middleware
│   ├── models/                 # ✅ Data models
│   └── services/               # ✅ Business logic
├── migrations/                 # ✅ Database migrations
├── tests/                      # ✅ Integration tests
└── config/                     # ✅ Config files

archzero-ui/                    # React frontend
├── src/
│   ├── components/             # ✅ UI components
│   │   ├── cards/              # ✅ Feature components
│   │   ├── governance/         # ✅ Governance UI
│   │   └── shared/             # ✅ Shared components
│   ├── lib/                    # ✅ Utilities & hooks
│   ├── pages/                  # ✅ Route pages
│   ├── types/                  # ✅ TypeScript types
│   └── stores/                 # ✅ State management

docs/                           # ✅ Documentation root
e2e/                            # ✅ E2E tests
neo4j/                          # ✅ Graph DB scripts
```

---

## 🔧 RECOMMENDED CLEANUP ACTIONS

### Priority 1: Remove Duplicate Directories
```bash
cd /home/tahopetis/dev/archzero
rm -rf archzero/
```

### Priority 2: Clean Root Level
```bash
# Remove misplaced files
rm package.json package-lock.json playwright.config.ts
rm -rf bdui-linux-x64

# Move playwright config to proper location
mv playwright.config.ts e2e/ 2>/dev/null || true

# Update .gitignore
cat >> .gitignore << 'EOF'
# Binaries
bdui-linux-x64
*.exe
*.dll
*.so
*.dylib

# Build artifacts
dist/
build/
*.tsbuildinfo
EOF
```

### Priority 3: Consolidate Migrations
```bash
# Move root migrations to archzero-api
# (Manual review needed first to avoid conflicts)
ls migrations/
# Review content, then move if appropriate
```

### Priority 4: Documentation Reorganization
```bash
# Create proper structure
mkdir -p docs/implementation docs/api docs/architecture

# Move files appropriately
mv archzero-api/docs/* docs/implementation/
mv docs/0*.md docs/
mv docs/0[5-9]-*.md docs/specifications/
```

---

## 📁 IDEAL STRUCTURE

```
archzero/                        # Repository root
├── README.md                    # Project overview
├── .gitignore                   # Properly configured
├── docker-compose.yml           # Dev setup
│
├── archzero-api/               # Backend
│   ├── src/
│   │   ├── config/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── services/
│   │   └── lib.rs
│   ├── migrations/             # ALL migrations here
│   ├── tests/
│   ├── config/
│   ├── docs/                   # API-specific docs
│   ├── Cargo.toml
│   └── Dockerfile
│
├── archzero-ui/                # Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── cards/
│   │   │   ├── governance/
│   │   │   ├── intelligence/
│   │   │   ├── shared/
│   │   │   └── ...
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   └── stores/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── docs/                       # All documentation
│   ├── specifications/
│   │   ├── prd.md
│   │   ├── metamodel.md
│   │   └── api-spec.md
│   ├── implementation/
│   │   ├── phase-4-report.md
│   │   ├── phase-5-report.md
│   │   └── principles.md
│   ├── architecture/
│   │   └── adr.md
│   └── deployment/
│
├── e2e/                        # E2E tests
│   ├── playwright.config.ts
│   └── tests/
│
├── migrations/                 # Legacy migrations (archive)
│   └── README.md               # "See archzero-api/migrations"
│
└── scripts/                    # Utility scripts
    ├── setup.sh
    └── deploy.sh
```

---

## ⚠️ FILES TO ADD TO .GITIGNORE

```
# Binaries
bdui-linux-x64
*.exe
*.dll
*.so
*.dylib

# Build artifacts
archzero-api/target/
archzero-ui/dist/
archzero-ui/build/

# Dependencies
node_modules/
archzero-ui/node_modules/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/
```

---

## 🎯 NEXT STEPS

1. **Immediate**: Remove `archzero/` duplicate directory
2. **High**: Clean up root level files and binaries
3. **Medium**: Consolidate migrations
4. **Low**: Reorganize documentation
5. **Optional**: Convert to proper monorepo with workspace management

---

## 📈 IMPACT ASSESSMENT

| Issue | Severity | Impact | Effort |
|-------|----------|--------|--------|
| Duplicate `archzero/` | 🔴 HIGH | Confusion, disk waste | Low (5 min) |
| Root binaries | 🟡 MEDIUM | Git bloat, security | Low (5 min) |
| Duplicate migrations | 🟡 MEDIUM | Deployment confusion | Medium (30 min) |
| Scattered docs | 🟢 LOW | Findability | Medium (1 hour) |

**Total Effort**: ~2 hours
**Risk Level**: Low (mostly deletions and moves)
**Benefits**:
- Cleaner structure
- Less confusion
- Smaller git repository
- Faster onboarding

---

**Generated**: 2026-01-13
**Tool**: Tree analysis + manual review
