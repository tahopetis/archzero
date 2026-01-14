# Arc Zero Codebase Map

**Version**: 2.0.0
**Last Updated**: 2026-01-14
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Backend (Rust)](#backend-rust)
5. [Frontend (React)](#frontend-react)
6. [Data Flow](#data-flow)
7. [Technology Stack](#technology-stack)
8. [Key Files Reference](#key-files-reference)

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
│   │   ├── handlers/          # HTTP request handlers (19 modules)
│   │   ├── services/          # Business logic layer (12 modules)
│   │   ├── models/            # Data models & schemas
│   │   ├── middleware/        # Auth, CSRF, rate limiting
│   │   ├── config/            # Configuration management
│   │   ├── error.rs           # Error types
│   │   ├── lib.rs             # Library exports
│   │   └── main.rs            # Application entry point
│   ├── migrations/            # PostgreSQL schema migrations
│   ├── tests/                 # Integration & unit tests
│   ├── config/                # Configuration files
│   ├── docs/                  # API documentation
│   ├── Cargo.toml             # Rust dependencies
│   └── .env.example           # Environment variables template
│
├── archzero-ui/               # Frontend React application
│   ├── src/
│   │   ├── components/        # React components (organized by feature)
│   │   │   ├── cards/          # Card list, detail, forms
│   │   │   ├── graph/          # Relationship visualization
│   │   │   ├── intelligence/   # BIA, TCO, 6R advisor
│   │   │   ├── governance/     # Principles, policies, ARB, etc.
│   │   │   ├── bulk/           # Bulk operations
│   │   │   ├── import/         # Excel import wizard
│   │   │   ├── export/         # Data export
│   │   │   ├── search/         # Global search
│   │   │   ├── relationships/  # Relationship management
│   │   │   ├── shortcuts/      # Quick actions
│   │   │   ├── layout/         # App shell, navigation
│   │   │   └── ui/             # Base UI components
│   │   ├── pages/              # Route pages
│   │   │   ├── governance/     # Governance pages (8 modules)
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
│   └── tsconfig.json           # TypeScript config
│
├── migrations/                 # Legacy migrations (root level)
├── neo4j/                      # Neo4j Cypher scripts
├── e2e/                        # End-to-end tests (Playwright)
├── docs/                       # Documentation
│   ├── 00-prd.md               # Product Requirements Document
│   ├── 01-metamodel-spec.md    # Metamodel specification
│   ├── 02-api-design.md        # API design documentation
│   ├── 03-governance-design.md # Governance feature specs
│   ├── CODEBASE_MAP.md         # This file
│   └── ...
├── .github/                    # GitHub workflows, templates
├── docker-compose.dev.yml      # Development infrastructure
├── .gitignore                  # Git ignore rules
├── README.md                   # Project documentation
└── AGENTS.md                   # AI agent instructions
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
│   ├── RiskRegister.tsx       # Risk table
│   ├── HeatMap.tsx            # Risk heat map visualization
│   └── TopRisks.tsx           # Top risks list
├── compliance/
│   ├── ComplianceDashboard.tsx # Framework overview
│   ├── RequirementsList.tsx   # Requirements by framework
│   └── AssessmentResults.tsx  # Assessment status
└── arb/
    ├── SubmissionQueue.tsx    # Pending submissions
    ├── ARBMeeting.tsx         # Meeting management
    └── DecisionRecord.tsx     # Decision documentation
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
| **Language** | Rust 1.75+ | Performance, memory safety |
| **Web Framework** | Axum 0.7 | Async HTTP server |
| **Database** | PostgreSQL 16+ | Primary data store |
| **Graph DB** | Neo4j 5+ | Relationship graph |
| **Cache** | Redis 7+ | Caching, sessions |
| **ORM** | SQLx 0.7 | Compile-time checked queries |
| **Serialization** | Serde | JSON (de)serialization |
| **Auth** | JWT | Stateless authentication |
| **Async Runtime** | Tokio | Async operations |

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

## Key Files Reference

### Configuration Files
| File | Purpose |
|------|---------|
| `.env.example` | Environment variables template |
| `docker-compose.dev.yml` | Development infrastructure |
| `archzero-api/Cargo.toml` | Rust dependencies |
| `archzero-ui/package.json` | NPM dependencies |
| `archzero-ui/vite.config.ts` | Vite bundler config |
| `archzero-ui/tsconfig.json` | TypeScript config |

### Entry Points
| File | Purpose |
|------|---------|
| `archzero-api/src/main.rs` | Backend server entry |
| `archzero-ui/src/main.tsx` | Frontend app entry |
| `archzero-ui/src/App.tsx` | React Router setup |

### Critical Services
| File | Purpose |
|------|---------|
| `archzero-api/src/services/saga_service.rs` | Dual-write orchestration |
| `archzero-api/src/services/card_service.rs` | Card CRUD |
| `archzero-api/src/services/neo4j_service.rs` | Graph DB client |
| `archzero-ui/src/lib/api.ts` | API client configuration |

### Key Documentation
| File | Purpose |
|------|---------|
| `README.md` | Project overview, quick start |
| `docs/00-prd.md` | Product Requirements Document |
| `docs/01-metamodel-spec.md` | Card types, attributes |
| `docs/02-api-design.md` | API specification |
| `docs/03-governance-design.md` | Governance feature specs |
| `AGENTS.md` | AI agent instructions |

---

## Development Workflow

### Backend Development
```bash
cd archzero-api
cargo check              # Verify compilation
cargo test               # Run tests
cargo run --bin server   # Start server
```

### Frontend Development
```bash
cd archzero-ui
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Build for production
npm test                 # Run Vitest tests
```

### Database Migrations
```bash
cd archzero-api
cargo run --bin migrate  # Run migrations
```

### Running Tests
```bash
# Backend
cd archzero-api && cargo test

# Frontend unit tests
cd archzero-ui && npm test

# E2E tests
cd e2e && npx playwright test
```

---

## Quick Navigation

### Find Card Implementation
- **Backend**: `archzero-api/src/handlers/cards.rs`, `archzero-api/src/services/card_service.rs`
- **Frontend**: `archzero-ui/src/components/cards/`, `archzero-ui/src/lib/card-hooks.ts`

### Find Graph Implementation
- **Backend**: `archzero-api/src/handlers/graph.rs`, `archzero-api/src/services/neo4j_service.rs`
- **Frontend**: `archzero-ui/src/components/graph/`, `archzero-ui/src/lib/graph-hooks.ts`

### Find Auth Implementation
- **Backend**: `archzero-api/src/handlers/auth.rs`, `archzero-api/src/middleware/auth.rs`
- **Frontend**: `archzero-ui/src/stores/useAuthStore.ts`

### Find Governance Features
- **Backend**: `archzero-api/src/handlers/{principles,standards,policies,risks,compliance,arb}.rs`
- **Frontend**: `archzero-ui/src/components/governance/`, `archzero-ui/src/pages/governance/`

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
