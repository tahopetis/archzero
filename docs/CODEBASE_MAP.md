# Arc Zero Codebase Map

**Version**: 2.0.0
**Last Updated**: 2026-01-21
**Status**: Production-Ready (Docker Infrastructure Complete, E2E Testing 67%)

---

## 📋 Table of Contents

1. [Quick Start](#quick-start) ⚡
2. [Current Status](#current-status) 📊
3. [Quick Navigation](#quick-navigation) 🔍
4. [Project Overview](#project-overview)
5. [Architecture](#architecture)
6. [Directory Structure](#directory-structure)
7. [Backend (Rust)](#backend-rust)
8. [Frontend (React)](#frontend-react)
9. [Docker & Deployment](#docker--deployment)
10. [E2E Testing](#e2e-testing)
11. [Data Flow](#data-flow)
12. [Technology Stack](#technology-stack)
13. [Development Workflow](#development-workflow)
14. [Architecture Principles](#architecture-principles)

---

## Quick Start ⚡

Get Arc Zero running locally in **5 minutes**.

### Prerequisites

**Required**:
- Docker & Docker Compose (for infrastructure)
- Git

**Optional** (for local development):
- Rust 1.88+ (backend)
- Node 20+ & npm (frontend)
- psql, cypher-shell, redis-cli (database access)

### 1. Clone & Start Infrastructure

```bash
# Clone the repository
git clone <repository-url>
cd archzero

# Start PostgreSQL, Neo4j, Redis in Docker
docker-compose -f docker-compose.dev.yml up -d

# Verify infrastructure is running
docker ps  # Should show postgres, neo4j, redis containers
```

### 2. Initialize Database

```bash
# Run database migrations
cargo run --bin migrate

# (Optional) Seed sample data
cargo run --bin seed
```

### 3. Start Backend Server

```bash
cd archzero-api
cargo run --bin server
```

Backend starts on: **http://localhost:8080**

Verify health: `curl http://localhost:8080/api/v1/health`

### 4. Start Frontend Dev Server

```bash
# In a new terminal
cd archzero-ui
npm install  # First time only
npm run dev
```

Frontend starts on: **http://localhost:3000**

### 5. Login & Verify

**Default Credentials**:
- Email: `admin@archzero.local`
- Password: `changeme123`

**Verification Checklist**:
- ✅ Login successful
- ✅ Dashboard loads
- ✅ Can create a card
- ✅ Can view relationships graph

### Common Issues

**Problem**: `Error: Database connection refused`
```bash
# Solution: Verify containers running
docker-compose -f docker-compose.dev.yml ps
# If not running, restart:
docker-compose -f docker-compose.dev.yml up -d
```

**Problem**: `Migration failed`
```bash
# Solution: Reset and retry
cargo run --bin migrate -- --reset
```

**Problem**: `Frontend shows API errors`
```bash
# Solution: Verify backend is running
curl http://localhost:8080/api/v1/health
# Check backend logs for errors
```

### Next Steps

- Explore features: See [Project Overview](#project-overview)
- Understand architecture: See [Architecture](#architecture)
- Start development: See [Development Workflow](#development-workflow)

---

## Current Status 📊

**Last Updated**: January 21, 2026

### 48-Week Roadmap Progress

```
Phase 0: Foundation              ████████████████████ 100% ✅ COMPLETE
Phase 1: Core Functionality      ████████████████████ 100% ✅ COMPLETE
Phase 2: Intelligence Engines    ████████████████████ 100% ✅ COMPLETE
Phase 3: Governance & Compliance ████████████████████ 100% ✅ COMPLETE
Phase 4: Advanced Features       ████████████████████ 100% ✅ COMPLETE
Phase 5: Production Hardening    ████████████████░░░░  75% 🔄 IN PROGRESS
Phase 6: Initial Deployment      ░░░░░░░░░░░░░░░░░░░░   0% ⏳ READY TO START
```

**Overall Completion**: ~85% of platform development

### E2E Testing Progress: 67%

**Target**: 466/466 tests passing (100%)
**Current**: 310+/466 tests passing

```
Phase 1: Foundation        ████████████████████ 100% ✅ (52/52 tests)
Phase 2: Backend API      ███████████████████░  95% ✅ (All APIs working)
Phase 3: Frontend         ████████████████████ 100% ✅ (All UI complete)
Phase 4: Test Quality     ████████░░░░░░░░░░░░░░  30% 🔄 (+86 tests remaining)
```

**Recent Achievement** (Jan 19-20, 2026):
- Phase 4.2 Risk Management: 37/123 tests passing (30% improvement from baseline)
- Regulatory Changes page implemented
- Test selectors and DOM stability fixes applied

See [E2E Testing](#e2e-testing) for detailed test plans.

### Docker Readiness: ✅ COMPLETE

Both container images build successfully:

| Component | Status | Image Size |
|-----------|--------|------------|
| **Backend API** | ✅ Building | ~500MB (compressed) |
| **Frontend UI** | ✅ Building | ~50MB (compressed) |
| **Production Compose** | ✅ Ready | Multi-container setup |

**Features**:
- Multi-stage builds with dependency caching
- Automated migrations on startup
- Non-root user security
- Nginx for static file serving

See [Docker & Deployment](#docker--deployment) for deployment guide.

### Currently In Progress

**Phase 5: Production Hardening** (4 weeks, ~75% complete)
- ✅ Security audit completed
- ✅ Monitoring infrastructure designed
- 🔄 Logging implementation in progress
- ⏳ Load testing pending
- ⏳ Performance optimization pending

**Phase 4: E2E Test Stabilization** (5-7 days, 30% complete)
- ✅ API mocking tests complete
- ✅ Risk Management selectors added
- 🔄 Remaining 86 tests in progress
- ⏳ Test quality improvements ongoing

### Next Steps (Priority Order)

1. **Complete Phase 4 E2E Tests** - Target: +86 tests, 100% pass rate
2. **Finish Phase 5 Hardening** - Monitoring, logging, load testing
3. **Execute Phase 6 Deployment** - Infrastructure, DNS, SSL, cutover
4. **Hypercare Support** - Post-deployment stabilization

### Blocked Issues

**Blocked**: 5 issues
**Ready to Work**: 14 issues (3 unblocked)

Top priority ready tasks:
- `archzero-5aq` [P0] - Achieve 100% E2E Test Success Rate
- `archzero-ojj` [P0] - Complete Platform Development
- `archzero-g7i` [P1] - Create E2E testing documentation

---

## Quick Navigation 🔍

**Jump directly to feature implementations**

### Find Card Implementation
- **Backend**: `archzero-api/src/handlers/cards.rs`, `archzero-api/src/services/card_service.rs`
- **Frontend**: `archzero-ui/src/components/cards/`, `archzero-ui/src/lib/card-hooks.ts`
- **E2E Tests**: `e2e/e2e/cards/card-management.spec.ts`

### Find Graph Implementation
- **Backend**: `archzero-api/src/handlers/graph.rs`, `archzero-api/src/services/neo4j_service.rs`
- **Frontend**: `archzero-ui/src/components/graph/`, `archzero-ui/src/lib/graph-hooks.ts`
- **E2E Tests**: `e2e/e2e/relationships/relationships.spec.ts`

### Find Auth Implementation
- **Backend**: `archzero-api/src/handlers/auth.rs`, `archzero-api/src/middleware/auth.rs`
- **Frontend**: `archzero-ui/src/stores/useAuthStore.ts`
- **E2E Tests**: `e2e/e2e/auth/auth.spec.ts`

### Find Governance Features
- **Backend**: `archzero-api/src/handlers/{principles,standards,policies,exceptions}.rs`
- **Frontend**: `archzero-ui/src/components/governance/{principles,standards,policies,exceptions}/`
- **Pages**: `archzero-ui/src/pages/governance/{Principles,Standards,Policies,Exceptions}Page.tsx`
- **E2E Tests**: `e2e/e2e/governance/governance.spec.ts`

### Find Risk Management
- **Backend**: `archzero-api/src/handlers/risks.rs`
- **Frontend**: `archzero-ui/src/components/governance/risks/` (RisksList, RiskForm, RiskDetail, HeatMap)
- **Pages**: `archzero-ui/src/pages/governance/RisksPage.tsx`
- **E2E Tests**: `e2e/e2e/risk-compliance/risk-compliance.spec.ts`

### Find Compliance Management
- **Backend**: `archzero-api/src/handlers/compliance.rs`
- **Frontend**: `archzero-ui/src/components/governance/compliance/`
- **Pages**: `archzero-ui/src/pages/governance/CompliancePage.tsx`
- **E2E Tests**: `e2e/e2e/risk-compliance/risk-compliance.spec.ts`

### Find ARB Workflows
- **Backend**: `archzero-api/src/handlers/arb/`
- **Frontend**: `archzero-ui/src/components/governance/arb/`
- **Pages**: `archzero-ui/src/pages/governance/ARBPortal.tsx`
- **E2E Tests**: `e2e/e2e/arb/arb.spec.ts`

### Find Strategic Planning
- **Backend**: `archzero-api/src/handlers/initiatives.rs`
- **Frontend**: `archzero-ui/src/components/governance/initiatives/`
- **Pages**: `archzero-ui/src/pages/governance/InitiativesPage.tsx`
- **E2E Tests**: `e2e/e2e/strategic-planning/strategic-planning.spec.ts`

### Find Intelligence Engines (BIA, TCO, 6R)
- **Backend**: `archzero-api/src/handlers/{bia,tco,migration}.rs`
- **Frontend**: `archzero-ui/src/components/intelligence/`
- **E2E Tests**: `e2e/e2e/visualizations/visualizations.spec.ts`

### Find Docker Configuration
- **Backend**: `archzero-api/Dockerfile`, `archzero-api/.dockerignore`
- **Frontend**: `archzero-ui/Dockerfile`, `archzero-ui/.dockerignore`
- **Development**: `docker-compose.dev.yml`
- **Production**: `docker-compose.prod.yml`
- **Commands**: `Makefile` (root directory)

### Find E2E Test Infrastructure
- **Test Plan**: `e2e/100-percent-test-success-plan.md`
- **Test Data**: `e2e/helpers/test-data-seeder.ts`
- **API Mocking**: `e2e/helpers/api-mocking.ts`
- **Configuration**: `e2e/playwright.config.ts`, `e2e/package.json`
- **Documentation**: `e2e/CLAUDE.md`

---

## Project Overview

**Arc Zero** is an Enterprise Architecture platform v2.0 that bridges the gap between rigid legacy EA tools and flexible custom solutions.

### Core Philosophy
- **Opinionated Core**: Industry-standard metamodels (TOGAF, ArchiMate)
- **Flexible Periphery**: Schema-less JSONB customization
- **Hybrid Architecture**: PostgreSQL (transactional) + Neo4j (graph relationships)

### Key Capabilities
- 🎯 **Application Portfolio Management** (APM)
- 📊 **Business Impact Analysis** (BIA)
- 🔄 **6R Migration Strategy** Advisor
- 💰 **Total Cost of Ownership** (TCO) Calculator
- 🛡️ **Governance & Compliance** (Principles, Standards, Policies, ARB)
- ⚠️ **Risk Management** & Register
- 📈 **Strategic Planning** & Initiatives
- 🔍 **Graph-based Dependency Tracking**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
│                      React + TypeScript + Vite                  │
│                     (archzero-ui/)                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                     Axum Web Framework                           │
│                    (archzero-api/src/)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Middleware  │→ │   Handlers   │→ │   Services   │          │
│  │  Auth/CSRF   │  │  REST CRUD   │  │ Business Log │          │
│  │ Rate Limit   │  │  Validation  │  │  Data Access │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
  │  PostgreSQL   │  │    Neo4j     │  │    Redis     │
  │  (Primary)    │  │  (Graph)     │  │   (Cache)    │
  │  - Cards      │  │  - Relations │  │  - Sessions  │
  │  - Users      │  │  - Impact    │  │  - Rate Lim  │
  │  - Migrations │  │  - Paths     │  │              │
  └───────────────┘  └──────────────┘  └──────────────┘
```

---

## Directory Structure

```
archzero/
├── archzero-api/              # Backend Rust application
│   ├── src/                   # Source code
│   │   ├── handlers/          # HTTP request handlers (20+ modules)
│   │   ├── services/          # Business logic layer (15+ modules)
│   │   ├── models/            # Data models & schemas
│   │   ├── middleware/        # Auth, CSRF, rate limiting
│   │   ├── config/            # Configuration management
│   │   ├── error.rs           # Error types
│   │   ├── lib.rs             # Library exports
│   │   └── main.rs            # Application entry point
│   ├── migrations/            # PostgreSQL schema migrations (10 files)
│   ├── tests/                 # Integration & unit tests
│   ├── config/                # Configuration files
│   ├── docs/                  # API documentation
│   ├── Cargo.toml             # Rust dependencies
│   ├── Dockerfile             # Docker image (multi-stage build)
│   ├── .dockerignore          # Docker build exclusions
│   ├── run-migrations.sh      # Migration runner script
│   └── CLAUDE.md              # AI agent instructions
│
├── archzero-ui/               # Frontend React application
│   ├── src/
│   │   ├── components/        # React components (organized by feature)
│   │   │   ├── cards/          # Card list, detail, forms
│   │   │   ├── graph/          # Relationship visualization
│   │   │   ├── intelligence/   # BIA, TCO, 6R advisor
│   │   │   ├── governance/     # Principles, policies, ARB, risks, compliance
│   │   │   ├── bulk/           # Bulk operations
│   │   │   ├── import/         # Excel import wizard
│   │   │   ├── export/         # Data export
│   │   │   ├── search/         # Global search
│   │   │   ├── relationships/  # Relationship management
│   │   │   ├── shortcuts/      # Quick actions
│   │   │   ├── layout/         # App shell, navigation
│   │   │   └── ui/             # Base UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── governance/     # Governance pages (10 modules)
│   │   │   │   ├── PrinciplesPage.tsx
│   │   │   │   ├── StandardsPage.tsx
│   │   │   │   ├── PoliciesPage.tsx
│   │   │   │   ├── ExceptionsPage.tsx
│   │   │   │   ├── RisksPage.tsx
│   │   │   │   ├── CompliancePage.tsx
│   │   │   │   ├── InitiativesPage.tsx
│   │   │   │   ├── ARBPortal.tsx
│   │   │   │   └── RegulatoryChangesPage.tsx
│   │   │   ├── import/         # Import pages
│   │   │   └── export/         # Export pages
│   │   ├── lib/                # Utilities, hooks, API client
│   │   ├── stores/             # Zustand state management
│   │   ├── types/              # TypeScript type definitions
│   │   ├── assets/             # Static assets (images, styles)
│   │   └── __tests__/          # Test files
│   ├── public/                 # Static files
│   ├── dist/                   # Build output (generated)
│   ├── package.json            # NPM dependencies
│   ├── vite.config.ts          # Vite bundler config
│   ├── tsconfig.json           # TypeScript config
│   ├── Dockerfile              # Docker image (multi-stage with Nginx)
│   ├── .dockerignore          # Docker build exclusions
│   └── CLAUDE.md              # AI agent instructions
│
├── e2e/                        # End-to-end tests (Playwright)
│   ├── e2e/                    # Test suites (20 spec files)
│   │   ├── auth/               # Authentication tests
│   │   ├── cards/              # Card CRUD tests
│   │   ├── relationships/      # Graph visualization tests
│   │   ├── governance/         # Governance feature tests
│   │   ├── risk-compliance/    # Risk & compliance tests
│   │   ├── strategic-planning/ # Initiative tests
│   │   ├── arb/                # ARB workflow tests
│   │   ├── visualizations/     # Chart & graph tests
│   │   ├── import-export/      # Data import/export tests
│   │   ├── search/             # Search functionality tests
│   │   ├── error-handling/     # Error scenario tests
│   │   ├── multi-user/         # Multi-user session tests
│   │   ├── api-mocking/        # API mocking tests
│   │   ├── pages/              # Page-level tests
│   │   └── smoke/              # Smoke tests
│   ├── helpers/                # Test utilities
│   │   ├── test-data-seeder.ts # Database seeding
│   │   └── api-mocking.ts      # API mock handlers
│   ├── 100-percent-test-success-plan.md  # E2E improvement plan
│   ├── phase3-report.md        # Phase 3 completion report
│   ├── CLAUDE.md               # E2E testing guide
│   └── package.json            # E2E test dependencies
│
├── docs/                       # Documentation
│   ├── 00-prd.md               # Product Requirements Document
│   ├── 01-metamodel-spec.md    # Metamodel specification
│   ├── 02-relationship-spec.md # Relationship types
│   ├── 03-logic-scoring-profile.md # Scoring algorithms
│   ├── 04-sql-ddl.md           # Database schema
│   ├── 05-api-spec.md          # REST API specification
│   ├── 06-uiux-sitemap.md      # UI/UX structure
│   ├── 07-architecture-decision-records.md # ADRs
│   ├── 08-deployment.md        # Deployment guide
│   ├── 09-implementation-plan.md # 48-week roadmap
│   ├── CODEBASE_MAP.md         # This file
│   ├── CLAUDE.md               # AI agent instructions
│   ├── phase-4-testing.md      # Phase 4 testing strategy
│   ├── phase-4-completion-report.md # Phase 4 results
│   └── phase-5-security-audit-report.md # Security review
│
├── .github/                    # GitHub workflows, templates
├── docker-compose.dev.yml      # Development infrastructure (PostgreSQL, Neo4j, Redis)
├── docker-compose.prod.yml     # Production deployment
├── Makefile                    # Build & deployment commands
├── .gitignore                  # Git ignore rules
├── .env.example                # Environment variables template
├── README.md                   # Project documentation
└── CLAUDE.md                   # Project-level AI instructions
```

---

## Backend (Rust)

### Entry Point
**`archzero-api/src/main.rs`**
- Initializes configuration (`.env`, `config/`)
- Sets up database connections (PostgreSQL, Neo4j, Redis)
- Registers middleware (Auth, CSRF, Rate Limiting)
- Mounts API routes
- Starts Axum HTTP server on `:8080`

### Layer Architecture

#### 1. **Middleware Layer** (`src/middleware/`)
```
middleware/
├── mod.rs              # Middleware exports
├── auth.rs             # JWT authentication, protected routes
├── csrf.rs             # CSRF token generation & validation
├── rate_limit.rs       # Rate limiting (Redis-backed)
└── security.rs         # Security headers, logging
```

**Purpose**: Pre-process HTTP requests before handlers
- Authentication: Validates JWT tokens, extracts user context
- CSRF: Double-submit cookie pattern for mutations
- Rate Limiting: Per-user and per-IP rate limits
- Security: CORS, CSP, security headers

#### 2. **Handlers Layer** (`src/handlers/`)
```
handlers/
├── mod.rs              # Route aggregation
├── auth.rs             # POST /auth/login, /auth/refresh
├── cards.rs            # GET/POST/PUT/DELETE /api/v1/cards
├── relationships.rs    # GET/POST/PUT/DELETE /api/v1/relationships
├── principles.rs       # Architecture principles CRUD
├── standards.rs        # Technology standards CRUD
├── policies.rs         # Architecture policies CRUD
├── exceptions.rs       # Exception requests CRUD
├── initiatives.rs      # Initiatives CRUD
├── risks.rs            # Risks CRUD
├── compliance.rs       # Compliance requirements CRUD
├── arb.rs              # ARB submissions & decisions
├── graph.rs            # Graph traversal, impact analysis
├── bia.rs              # Business Impact Analysis
├── tco.rs              # Total Cost of Ownership
├── bulk.rs             # Bulk import/export
├── import.rs           # Excel import jobs
├── migration.rs        # Legacy data migration
├── cache.rs            # Cache invalidation
└── health.rs           # Health check endpoint
```

**Purpose**: HTTP request/response handling
- Extract request data (path params, query, body)
- Call service layer for business logic
- Return JSON responses or errors
- Handle pagination, filtering, sorting

#### 3. **Services Layer** (`src/services/`)
```
services/
├── mod.rs                    # Service exports
├── card_service.rs           # Card CRUD, search, filtering
├── relationship_service.rs   # Relationship CRUD, graph sync
├── auth_service.rs           # JWT generation, user validation
├── saga_service.rs           # Dual-write coordination (PG + Neo4j)
├── bia_service.rs            # BIA scoring, impact calculation
├── tco_service.rs            # TCO calculation, cost aggregation
├── cached_card_service.rs    # Cached card queries (Redis)
├── topology_service.rs       # Graph topology queries
├── neo4j_service.rs          # Neo4j client wrapper
├── cache.rs                  # Redis cache client
├── db_service.rs             # PostgreSQL connection pool
├── csrf.rs                   # CSRF token store
├── rate_limit.rs             # Rate limit counter
└── migration_service.rs      # Data migration utilities
```

**Purpose**: Business logic & data access
- Implement use cases (BIA, TCO, impact analysis)
- Orchestrate database operations
- Handle dual-write SAGA pattern (PostgreSQL → Neo4j)
- Manage caching strategies

#### 4. **Models Layer** (`src/models/`)
```
models/
├── card.rs             # Card, CardType, LifecyclePhase enums
├── relationship.rs     # Relationship, RelationshipType enums
├── user.rs             # User, UserRole, Claims
├── compliance.rs       # ComplianceRequirement, Framework
├── exceptions.rs       # Exception, ExceptionStatus
├── initiatives.rs      # Initiative, InitiativeStatus
└── ...
```

**Purpose**: Data structures & validation
- Rust structs matching database schemas
- SQLx-compatible types for PostgreSQL
- Serde serialization for JSON
- Validation rules & constraints

### Key Backend Features

#### **SAGA Pattern (Dual-Write)**
**File**: `src/services/saga_service.rs`

Coordinates writes between PostgreSQL and Neo4j:
1. Write card to PostgreSQL (primary)
2. Create node in Neo4j (secondary)
3. If Neo4j fails, mark for compensation
4. Background worker retries failed Neo4j writes

**Benefits**:
- ✅ PostgreSQL remains consistent even if Neo4j is down
- ✅ Eventually consistent graph model
- ✅ Resilient to Neo4j failures

#### **Caching Strategy**
**Files**:
- `src/services/cache.rs` - Redis client
- `src/services/cached_card_service.rs` - Cached queries

**Cache Keys**:
- `cards:{id}` - Individual card
- `cards:list:{hash}` - Filtered lists (hash of filters)
- `graph:impact:{id}` - Impact analysis results
- `bia:results:{id}` - BIA calculation results

#### **Authentication Flow**
**File**: `src/handlers/auth.rs`, `src/services/auth_service.rs`

```
1. POST /auth/login
   ↓
2. Validate credentials (PostgreSQL)
   ↓
3. Generate JWT (15min expiry)
   ↓
4. Return { access_token, refresh_token }
   ↓
5. Protected routes check Authorization header
   ↓
6. Extract user_id from JWT
   ↓
7. Allow/deny request
```

#### **Rate Limiting**
**File**: `src/middleware/rate_limit.rs`, `src/services/rate_limit.rs`

- Redis-backed sliding window log
- Limits: 100 req/min per user, 1000 req/min per IP
- Headers returned: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Frontend (React)

### Entry Point
**`archzero-ui/src/main.tsx`**
- Mounts React app to `#root`
- Sets up React Query devtools
- Initializes global error handling

### Component Organization

#### **Layout Components** (`src/components/layout/`)
```
layout/
├── AppShell.tsx        # Main app shell (sidebar, header)
├── Sidebar.tsx         # Navigation sidebar
├── Header.tsx          # Top bar (search, user menu)
├── Breadcrumbs.tsx     # Navigation breadcrumbs
└── PageHeader.tsx      # Page titles, actions
```

#### **Card Components** (`src/components/cards/`)
```
cards/
├── CardList.tsx            # Paginated card table
├── CardGrid.tsx            # Card grid view
├── CardDetail.tsx          # Card detail view
├── CardForm.tsx            # Create/edit form
├── CardTypeBadge.tsx       # Card type indicator
├── LifecycleBadge.tsx      # Lifecycle phase badge
└── CardFilters.tsx         # Filter controls
```

#### **Graph Components** (`src/components/graph/`)
```
graph/
├── GraphView.tsx           # ReactFlow graph visualization
├── GraphControls.tsx       # Zoom, fit, layout controls
├── NodeRenderer.tsx        # Custom node component
├── EdgeRenderer.tsx        # Custom edge (with confidence)
└── ImpactPanel.tsx         # Impact analysis panel
```

**Libraries**:
- `reactflow` - Graph visualization
- `@reactflow/background` - Grid background
- `@reactflow/controls` - Zoom controls
- `@reactflow/minimap` - Mini-map

#### **Intelligence Components** (`src/components/intelligence/`)
```
intelligence/
├── BIAAssessmentForm.tsx   # Business Impact Assessment wizard
├── BIAResults.tsx          # BIA score visualization
├── TCOVisualization.tsx    # TCO breakdown chart
├── SixRAdvisor.tsx         # 6R migration recommendations
└── ScenarioComparison.tsx  # Scenario comparison table
```

#### **Governance Components** (`src/components/governance/`)
```
governance/
├── shared/
│   ├── StatusBadge.tsx        # Governance entity status
│   ├── PriorityBadge.tsx      # Priority indicator
│   └── CategoryBadge.tsx      # Category badges
├── principles/
│   ├── PrinciplesList.tsx     # Architecture principles list
│   ├── PrincipleDetail.tsx    # Principle details
│   └── PrincipleForm.tsx      # Create/edit form
├── standards/
│   ├── StandardsList.tsx      # Technology standards list
│   ├── TechnologyRadar.tsx    # Radar visualization
│   └── DebtReport.tsx         # Technical debt table
├── policies/
│   ├── PoliciesList.tsx       # Policies list
│   ├── PolicyEditor.tsx       # Policy rule builder
│   └── ComplianceChecker.tsx  # Policy compliance check
├── exceptions/
│   ├── ExceptionsList.tsx     # Exception requests list
│   ├── ExceptionWorkflow.tsx  # Approval workflow UI
│   └── ExpiringAlerts.tsx     # Expiring exceptions
├── initiatives/
│   ├── InitiativesKanban.tsx  # Kanban board view
│   ├── ImpactMap.tsx          # Impact visualization
│   └── GapAnalysis.tsx        # Gap analysis chart
├── risks/
│   ├── RisksList.tsx          # Risk register table
│   ├── RiskForm.tsx           # Create/edit risk form
│   ├── RiskDetail.tsx         # Risk detail view
│   ├── HeatMap.tsx            # Risk heat map visualization
│   ├── TopRisks.tsx           # Top risks dashboard
│   └── RiskComponents.tsx     # Shared risk components
├── compliance/
│   ├── ComplianceDashboard.tsx # Framework overview
│   ├── RequirementsList.tsx   # Requirements by framework
│   ├── ComplianceForm.tsx     # Create/edit requirement
│   ├── AssessmentResults.tsx  # Assessment status
│   └── ComplianceComponents.tsx # Shared compliance components
└── arb/
    ├── SubmissionQueue.tsx    # Pending submissions
    ├── ARBMeeting.tsx         # Meeting management
    ├── DecisionRecord.tsx     # Decision documentation
    └── ARBComponents.tsx      # Shared ARB components
```

#### **Import/Export** (`src/components/import/`, `src/components/export/`)
```
import/
├── ImportWizard.tsx       # Multi-step import wizard
├── FileUpload.tsx         # Drag-drop file upload
├── MappingEditor.tsx      # Column mapping interface
└── ValidationResults.tsx  # Pre-import validation

export/
├── ExportDialog.tsx       # Export configuration
├── FormatSelector.tsx     # Format selection (Excel, CSV, JSON)
└── ScheduleExport.tsx     # Scheduled exports
```

### State Management

**Zustand Stores** (`src/stores/`)
```typescript
stores/
├── useAuthStore.ts        # Authentication state (user, tokens)
├── useCardStore.ts        # Card filters, selection
├── useGraphStore.ts       # Graph layout, selected nodes
├── useUIStore.ts          # UI state (sidebar, modals)
└── useNotificationStore.ts # Toasts, alerts
```

### Data Fetching

**React Query Hooks** (`src/lib/`)
```typescript
lib/
├── api.ts                 # Axios client configuration
├── card-hooks.ts          # useCards, useCard, createCard
├── relationship-hooks.ts  # useRelationships, createRelationship
├── graph-hooks.ts         # useGraphData, useImpactAnalysis
├── bia-hooks.ts           # useBIA, calculateBIA
├── tco-hooks.ts           # useTCO, calculateTCO
├── import-hooks.ts        # useImportJob, pollImportStatus
└── bulk-hooks.ts          # useBulkExport, useBulkImport
```

**Query Client Configuration**:
- Base URL: `http://localhost:8080/api/v1`
- Interceptors: Auth header injection, error handling
- Retry: 3 attempts with exponential backoff
- Cache: 5min default stale time

### Routing

**React Router** (`src/App.tsx`)
```typescript
/                          → Dashboard
/cards                     → Card catalog
/cards/:id                 → Card detail
/relationships             → Relationship graph
/intelligence/bia          → Business Impact Analysis
/intelligence/tco          → Total Cost of Ownership
/intelligence/sixr         → 6R Migration Advisor
/governance/principles     → Architecture Principles
/governance/standards      → Technology Standards
/governance/policies       → Architecture Policies
/governance/exceptions     → Exception Requests
/governance/initiatives    → Initiatives Portfolio
/governance/risks          → Risk Register
/governance/compliance     → Compliance Dashboard
/governance/arb            → ARB Portal
/import                    → Import Wizard
/export                    → Export Dialog
```

---

## Docker & Deployment

### Docker Infrastructure

**Status**: ✅ **COMPLETE** (January 20, 2026)

Both API and UI container images build successfully with multi-stage optimizations.

#### Backend Dockerfile (`archzero-api/Dockerfile`)

**Multi-Stage Build**:
```dockerfile
# Stage 1: Builder
FROM rust:1.88-slim as builder
- Copy Cargo.toml and lib.rs dummy for dependency caching
- Build dependencies separately
- Copy source code
- Build release binary

# Stage 2: Runtime
FROM debian:bookworm-slim
- Install runtime dependencies (openssl, ca-certificates)
- Create non-root archzero user
- Copy binary from builder
- Copy migrations and run-migrations.sh
- Expose port 8080
- Run migrations then start server
```

**Key Features**:
- Pinned Rust version (1.88-slim) for reproducibility
- Dependency caching layer for faster rebuilds
- Automated migrations via `run-migrations.sh` on startup
- Non-root user for security
- Optimized image size (~500MB compressed)

#### Frontend Dockerfile (`archzero-ui/Dockerfile`)

**Multi-Stage Build**:
```dockerfile
# Stage 1: Builder
FROM node:20-alpine as builder
- Copy package.json and lock file
- Install all dependencies (including devDependencies for TypeScript)
- Copy source and all TypeScript config files
- Build production bundle with Vite

# Stage 2: Runtime
FROM nginx:alpine
- Copy built assets from builder
- Copy nginx configuration
- Expose port 80
- Serve static files with Nginx
```

**Key Features**:
- Alpine Linux for minimal size
- All TypeScript config files copied (tsconfig*.json)
- Nginx for production-grade static file serving
- Optimized image size (~50MB compressed)

### Makefile Commands

**Build Commands**:
```bash
make build                # Build all images (API + UI)
make build-api            # Build backend image only
make build-ui             # Build frontend image only
make build-no-cache       # Build without cache
```

**Deployment Commands**:
```bash
make prod-up              # Start production environment
make prod-down            # Stop production environment
make prod-restart         # Restart services
make prod-logs            # Show all logs
make prod-logs-api        # Show API logs
make prod-logs-ui         # Show UI logs
make ps                   # Show running containers
make stats                # Show resource usage
make health               # Check service health
```

**Database Commands**:
```bash
make db-migrate           # Run database migrations
make db-reset             # Reset database (WARNING: deletes data)
make db-seed              # Seed sample data
```

**Utilities**:
```bash
make clean                # Remove all containers, volumes, images
make help                 # Show all available commands
```

### Production Deployment (`docker-compose.prod.yml`)

**Services**:
```yaml
services:
  postgres:              # PostgreSQL 16
    - Port: 5432
    - Volume: pgdata (persistent)
    - Environment: Admin credentials

  neo4j:                 # Neo4j 5
    - Port: 7474 (HTTP), 7687 (Bolt)
    - Volume: neo4jdata (persistent)
    - Environment: Auth disabled

  redis:                 # Redis 7
    - Port: 6379
    - Volume: redisdata (persistent)

  api:                   # Rust Backend
    - Port: 8080
    - Depends on: postgres, neo4j, redis
    - Environment: Database URLs, JWT secret
    - Health check: /api/v1/health

  ui:                    # React Frontend
    - Port: 80
    - Depends on: api
    - Nginx reverse proxy
```

**Default Credentials**:
- Admin: `admin@archzero.local` / `changeme123`
- PostgreSQL: `archzero` / `prodpassword`
- Neo4j: `neo4j` / `prodpassword`

**Environment Variables Required**:
```env
# Database
DATABASE_URL=postgresql://archzero:prodpassword@postgres:5432/archzero
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=prodpassword
REDIS_URL=redis://redis:6379

# API
API_HOST=0.0.0.0
API_PORT=8080
JWT_SECRET=<generate with openssl rand -hex 32>

# CORS
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Features
ENABLE_GOVERNANCE=true
ENABLE_ARB_WORKFLOW=true
ENABLE_COMPLIANCE_TRACKING=true
```

### Deployment Architecture

```
Internet
    ↓
[Load Balancer / Reverse Proxy]
    ↓
┌─────────────────────────────────────┐
│  UI Container (Nginx) : Port 80     │
│  - Static React bundle              │
│  - API proxy to backend             │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  API Container (Axum) : Port 8080   │
│  - Rust application server          │
│  - Auto-migrations on startup       │
└─────────────────────────────────────┘
    ↓
┌──────────┬──────────┬──────────┐
│PostgreSQL│  Neo4j   │  Redis   │
│  :5432   │  :7687   │  :6379   │
└──────────┴──────────┴──────────┘
```

---

## E2E Testing

### Test Infrastructure

**Framework**: Playwright (Chromium, Firefox, WebKit)
**Location**: `e2e/` directory
**Total Tests**: 466 tests across 20 spec files
**Current Pass Rate**: 67% (310+/466 passing as of Jan 21, 2026)

### Test Organization

**Test Suites**:
| Directory | Tests | Focus |
|-----------|-------|-------|
| `auth/` | Login/logout, session management | Authentication |
| `cards/` | Card CRUD, filtering, search | Core functionality |
| `relationships/` | Graph visualization, dependencies | Relationship management |
| `governance/` | Principles, standards, policies | Governance framework |
| `risk-compliance/` | Risk register, compliance dashboard | Risk & compliance |
| `strategic-planning/` | Initiatives portfolio, roadmap | Strategic planning |
| `arb/` | ARB submissions, decisions, meetings | ARB workflows |
| `visualizations/` | Heatmaps, roadmaps, reports | Data visualization |
| `import-export/` | Excel import, data export | Data migration |
| `search/` | Global search, filters | Search functionality |
| `error-handling/` | Error scenarios, edge cases | Resilience |
| `multi-user/` | Multi-user sessions | Session management |
| `api-mocking/` | API mock handlers | Test infrastructure |
| `pages/` | Page-level tests | UI smoke tests |

### Test Progress (4-Phase Plan)

**Status**: Phase 4 (Test Quality) in progress - 30% complete

```
Phase 1: Foundation        ████████████████████ 100% ✅ COMPLETE
  - Test data seeder implemented
  - Authentication state fixes
  - API health checks
  - 52/52 core tests passing

Phase 2: Backend API      ███████████████████░  95% ✅ BACKEND DONE
  - All governance APIs (200 OK)
  - ARB implementation (44/47 tests = 94%)
  - +100 tests passing

Phase 3: Frontend         ████████████████████ 100% ✅ COMPLETE
  - Strategic Planning UI: 54 tests
  - ARB UI: 27 tests (94% passing)
  - Charts & Visualizations: 22 tests
  - BIA Assessment: 12/12 tests (100%)
  - Migration Advisor: 9/9 tests (100%)
  - Custom Report Builder: 15/15 tests (100%)
  - +120 tests passing

Phase 4: Test Quality     ████████░░░░░░░░░░░░░░  30% 🔄 IN PROGRESS
  - API mocking tests ✅
  - Risk Management selectors 🔄
  - Remaining: 86 tests
```

### Running Tests

**All Tests**:
```bash
cd e2e
npm test                              # Run all tests (Chromium)
npm run test:headed                  # Run with visible browser
npm run test:ui                      # Run with Playwright UI
npm run test:debug                   # Run in debug mode
```

**By Browser**:
```bash
npm run test:chromium                # Chromium only
npm run test:firefox                 # Firefox only
npm run test:webkit                  # WebKit only
```

**By Feature**:
```bash
npm run test:batch:governance        # Governance tests
npm run test:batch:cards             # Card tests
npm run test:batch:arb               # ARB tests
npm run test:batch:risk-compliance   # Risk & compliance tests
npm run test:batch:search            # Search tests
npm run test:batch:visualizations    # Visualization tests
```

**Failed Tests Only**:
```bash
npm run test:failures                # Re-run failed tests
npm run test:report                  # View HTML report
```

### Test Data Infrastructure

**File**: `e2e/helpers/test-data-seeder.ts`

**Automated Seeding**:
- 31 cards across all types (Layer A-D)
- Relationships between cards
- ARB submissions and templates
- Governance entities (principles, standards, policies)
- Risk and compliance data
- Strategic initiatives

**Database State**:
- Tests run against development database
- Each test file can reset state
- No shared state between test files
- Deterministic test data

### Test Selectors

**Standard Pattern**: All interactive elements have `data-testid` attributes
```typescript
// Example from RiskForm.tsx
<div data-testid="risk-form">
  <input data-testid="risk-title-input" />
  <button data-testid="risk-save-button">Save</button>
</div>
```

**Best Practices**:
- Test IDs over CSS selectors (more resilient)
- Semantic naming: `{entity}-{action}-{element}`
- ARIA labels for accessibility + testing
- Role-based selectors when appropriate

### Key Test Files

| File | Purpose |
|------|---------|
| `100-percent-test-success-plan.md` | Comprehensive improvement plan |
| `phase3-report.md` | Phase 3 completion report |
| `helpers/test-data-seeder.ts` | Database seeding utilities |
| `helpers/api-mocking.ts` | API mock handlers |
| `CLAUDE.md` | E2E testing guide for AI agents |

### Recent Test Improvements

**Phase 4.2 Risk Management** (January 19-20, 2026):
- ✅ Regulatory Changes page implemented
- ✅ Risk form selectors added (`data-testid` attributes)
- ✅ React stability fixes (memoization)
- ✅ DOM stability waits (`scrollIntoViewIfNeeded()`)
- ✅ Error handling components
- **Result**: 37/123 tests passing (30% improvement from baseline)

**Ralph Loop Pattern**:
- Iterative test improvement cycles
- Run tests → Identify failures → Fix → Re-run
- Continue until passing rate acceptable
- Document session retrospectives

---

## Data Flow

### Card Creation Flow
```
User → React Form → POST /api/v1/cards
    ↓
Handler (cards.rs) validates request
    ↓
CardService creates card in PostgreSQL
    ↓
SagaService triggers Neo4j node creation
    ↓
Redis cache invalidated
    ↓
Response: { id, name, type, ... }
    ↓
React Query updates cache
    ↓
UI re-renders with new card
```

### Impact Analysis Flow
```
User → Click "Analyze Impact" → GET /api/v1/graph/impact/:id
    ↓
GraphService queries Neo4j
    ↓
Traverse relationships (upstream, downstream)
    ↓
Calculate impact scores
    ↓
Return { impact_summary, affected_cards, paths }
    ↓
ReactFlow visualizes impact graph
    ↓
Highlight critical path in red
```

### BIA Calculation Flow
```
User → Fill BIA Form → POST /api/v1/intelligence/bia
    ↓
BIAService validates responses
    ↓
Calculate scores per dimension (Financial, Operational, etc.)
    ↓
Aggregate to overall impact score
    ↓
Store result in PostgreSQL
    ↓
Cache in Redis
    ↓
Return { overall_score, dimensions, recommendations }
    ↓
Render results with charts
```

---

## Technology Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | Rust 1.88 | Performance, memory safety (pinned for Docker) |
| **Web Framework** | Axum 0.7 | Async HTTP server |
| **Database** | PostgreSQL 16+ | Primary data store |
| **Graph DB** | Neo4j 5+ | Relationship graph |
| **Cache** | Redis 7+ | Caching, sessions |
| **ORM** | SQLx 0.7 | Compile-time checked queries |
| **Serialization** | Serde | JSON (de)serialization |
| **Auth** | JWT | Stateless authentication |
| **Async Runtime** | Tokio | Async operations |
| **Container** | Docker 20+ | Production deployment |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Language** | TypeScript 5+ | Type safety |
| **Framework** | React 18 | UI framework |
| **Build Tool** | Vite 5 | Fast dev server, bundler |
| **State** | Zustand | Lightweight state management |
| **Data Fetching** | React Query (@tanstack/react-query) | Server state |
| **Routing** | React Router v6 | Client-side routing |
| **Graph Vis** | ReactFlow 11 | Graph visualization |
| **Charts** | Recharts | Data visualization |
| **Forms** | React Hook Form | Form validation |
| **Tables** | TanStack Table | Data tables |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Testing** | Vitest, Playwright | Unit & E2E tests |

---

## Development Workflow

### Local Development
```bash
# Start infrastructure (PostgreSQL, Neo4j, Redis)
docker-compose -f docker-compose.dev.yml up -d

# Run database migrations
cargo run --bin migrate

# Start backend server (in archzero-api/)
cd archzero-api
cargo run --bin server   # Starts on http://localhost:8080

# Start frontend dev server (in archzero-ui/)
cd archzero-ui
npm run dev              # Starts on http://localhost:3000
```

### Backend Development
```bash
cd archzero-api
cargo check              # Verify compilation
cargo test               # Run tests
cargo test --lib         # Run library tests only
cargo run --bin server   # Start server
```

### Frontend Development
```bash
cd archzero-ui
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm test                 # Run Vitest tests
npm run lint             # Run ESLint
```

### Docker Development
```bash
# Build container images
make build               # Build all images
make build-api           # Build backend only
make build-ui            # Build frontend only

# Start production environment
make prod-up             # Start all services
make prod-logs           # View logs
make prod-down           # Stop services

# Database operations
make db-migrate          # Run migrations
make db-reset            # Reset database (WARNING: deletes data)
make db-seed             # Seed sample data

# Check health
make health              # Health check all services
make ps                  # Show running containers
```

### Database Migrations
```bash
# Direct execution
cargo run --bin migrate

# With reset
cargo run --bin migrate -- --reset

# Access databases directly
docker exec -it archzero-postgres-dev psql -U archzero -d archzero_dev
docker exec -it archzero-neo4j-dev cypher-shell -u neo4j -p devpassword
docker exec -it archzero-redis-dev redis-cli
```

### Running Tests
```bash
# Backend
cd archzero-api && cargo test

# Frontend unit tests
cd archzero-ui && npm test

# E2E tests
cd e2e && npm test                # All tests
npm run test:headed              # Visible browser
npm run test:ui                  # Playwright UI mode
npm run test:batch:governance    # Feature-specific tests
npm run test:failures            # Re-run failed tests
```

---

## Architecture Principles

1. **Separation of Concerns**: Handlers → Services → Models
2. **Dependency Injection**: Services injected into handlers
3. **Error Handling**: Centralized error types (`src/error.rs`)
4. **Validation**: Request validation at handler layer
5. **Caching**: Cache-aside pattern with Redis
6. **Resilience**: SAGA pattern for distributed transactions
7. **Security**: Defense-in-depth (Auth, CSRF, Rate Limiting)
8. **Testing**: Unit tests for services, integration tests for handlers

---

**End of Codebase Map**

For detailed implementation specs, see:
- [Product Requirements](docs/00-prd.md)
- [Metamodel Specification](docs/01-metamodel-spec.md)
- [API Design](docs/02-api-design.md)
- [Governance Design](docs/03-governance-design.md)
