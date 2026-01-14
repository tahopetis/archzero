# Arc Zero

**Modern Enterprise Architecture Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)](https://github.com/tahopetis/archzero)
[![Rust Version](https://img.shields.io/badge/rust-1.75+-orange.svg)](https://www.rust-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://www.postgresql.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5+-green.svg)](https://neo4j.com/)

> **The structure you need for reporting, with the flexibility you need for reality.**

Arc Zero bridges the gap between rigid legacy EA tools and flexible custom solutions. Built on an "Opinionated Core, Flexible Periphery" philosophy, it enforces industry-standard metamodels while allowing infinite schema-less customization.

---

## 🆕 What's New in v2.0

**Governance & Compliance features have arrived!**

- **7 New Card Types**: Architecture Principles, Technology Standards, Architecture Policies, Exceptions, Initiatives, Risks, and Compliance Requirements
- **Technology Radar**: Interactive visualization for tracking technology lifecycle
- **ARB Workflows**: Structured Architecture Review Board process for technology decisions
- **Compliance Dashboard**: Framework-centric compliance tracking (GDPR, SOX, HIPAA, ISO 27001)
- **Risk Register**: Comprehensive risk management with heat map visualization
- **Initiatives Portfolio**: Strategic transformation program management with Kanban board
- **35+ New API Endpoints**: Full CRUD for all governance entities
- **14 New Relationship Types**: Governance layer ontology for principles, standards, policies, risks, and compliance

---

## ✨ What is Arc Zero?

Arc Zero is an Enterprise Architecture platform designed for:
- **Enterprise Architects** managing application portfolios
- **CTOs** making strategic technology decisions
- **IT Strategy Teams** planning migrations and modernizations

**Key Features:**
- 🎯 **Day 1 Value**: Pre-built reports and visualizations (Landscape Heatmaps, Roadmaps, Matrices)
- 🔄 **Hybrid Data Model**: Strict SQL columns for speed + JSONB for flexibility
- 📊 **Graph-Powered**: Deep impact analysis and dependency tracking via Neo4j
- 🤖 **Intelligent Engines**: Business Impact Analysis (BIA), 6R Migration Advisor, TCO Calculator
- 🛡️ **Governance Framework**: Architecture principles, technology standards, policies, exceptions, and compliance tracking
- 🎯 **Strategic Planning**: Initiative portfolio, transformation roadmaps, and gap analysis
- ⚠️ **Risk Management**: Risk register, heat maps, and mitigation tracking
- ✅ **ARB Workflows**: Architecture Review Board for technology decisions
- 🔌 **Integration-Ready**: Excel import, REST API, Pustaka ITAM connector

---

## 🚀 Quick Start

### Prerequisites

- **Docker** & **Docker Compose** (v2.0+)
- **Rust** (1.75+) - *Only needed for local development*
- **Node.js** (18+) - *For frontend development*

### 5-Minute Setup

```bash
# 1. Clone the repository
git clone https://github.com/tahopetis/archzero.git
cd archzero

# 2. Start infrastructure (PostgreSQL, Neo4j, Redis)
docker-compose up -d

# 3. Run database migrations
cargo run --bin migrate

# 4. Seed sample data (optional - recommended for first-time users)
cargo run --bin seed

# 5. Start the backend server
cargo run --bin server

# 6. Start the frontend (in a new terminal)
cd archzero-ui
npm install
npm run dev

# 7. Open your browser
# Backend API: http://localhost:8080
# Frontend UI:  http://localhost:3000
```

**Default Credentials:**
- Email: `admin@archzero.local`
- Password: `changeme123`

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Codebase Map](docs/CODEBASE_MAP.md) | Comprehensive codebase structure and navigation guide |
| [Product Requirements](docs/00-prd.md) | Product vision, architecture, and roadmap |
| [Metamodel Specification](docs/01-metamodel-spec.md) | Card types (Layers A-D), attributes, and validation rules |
| [Relationship Specification](docs/02-relationship-spec.md) | Graph ontology and connection rules (including governance layer) |
| [Logic & Scoring](docs/03-logic-scoring-profile.md) | BIA, 6R, and TCO calculation engines |
| [Database Schema](docs/04-sql-ddl.md) | PostgreSQL + Neo4j DDL scripts (with governance tables) |
| [API Reference](docs/05-api-spec.md) | REST API endpoints and payloads (35+ governance endpoints) |
| [UI/UX Sitemap](docs/06-uiux-sitemap.md) | Screen flows and component specs (with governance screens) |
| [Architecture Decision Records](docs/07-architecture-decision-records.md) | Key architectural decisions and trade-offs |
| [Deployment Guide](docs/08-deployment.md) | Production deployment, scaling, and monitoring |

**Additional Guides:**
- [Contributing Guide](CONTRIBUTING.md) *(Coming Soon)*

---

## 🏗️ Architecture

Arc Zero uses **Polyglot Persistence** to optimize for different data access patterns:

```mermaid
graph TB
    UI[React + Shadcn UI<br/>TanStack Query + D3.js]
    API[Rust Backend<br/>Axum Framework]
    
    PG[(PostgreSQL 16<br/>Source of Truth<br/>Cards + Audit)]
    NEO[(Neo4j 5<br/>Topology Engine<br/>Relationships)]
    REDIS[(Redis<br/>Caching Layer<br/>Aggregations)]
    PUSTAKA[Pustaka ITAM<br/>Asset Data]
    
    UI -->|HTTP/JSON| API
    API -->|CRUD| PG
    API -->|Cypher Queries| NEO
    API -->|Cache| REDIS
    API -->|Sync| PUSTAKA
    
    style UI fill:#e1f5ff
    style API fill:#ffe1f5
    style PG fill:#d4edda
    style NEO fill:#fff3cd
    style REDIS fill:#f8d7da
```

### The "Card" Concept

Everything in Arc Zero is a **Card** - the atomic unit of enterprise architecture.

**Card Types (4 Layers):**
- **Layer A (Strategic):** Objective, Organization, Project (Initiative)
- **Layer B (Application):** Application, Interface
- **Layer C (Technology):** IT Component, Platform, Provider, Data Object, Tech Category
- **Layer D (Governance):** Architecture Principle, Technology Standard, Architecture Policy, Exception, Risk, Compliance Requirement

**Hybrid Data Structure:**
- **Tier 1 (SQL Columns)**: Indexed fields for fast queries (Name, Type, Lifecycle, Quality Score)
- **Tier 2 (JSONB)**: Flexible schema-less attributes (Cost Center, Hosting Type, Custom Fields)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Salesforce CRM",
  "type": "Application",
  "lifecycle_active": "2020-03-15",
  "quality_score": 85,

  "attributes": {
    "hosting_type": "SaaS",
    "pace_layer": "System of Differentiation",
    "rationalization_action": "Invest",
    "cloud_readiness_score": 92,
    "cost_center": "CC-SALES-01",
    "financials": {
      "estimated_annual_cost": 120000,
      "currency": "USD"
    }
  }
}
```

**Example Governance Card (Architecture Principle):**
```json
{
  "id": "princ-001",
  "name": "Cloud-First Strategy",
  "type": "ArchitecturePrinciple",
  "attributes": {
    "statement": "Prefer cloud-native SaaS solutions over on-premise deployments",
    "category": "Strategic",
    "rationale": "Reduces maintenance overhead and improves scalability",
    "implications": [
      "All new apps must be cloud-native",
      "Exceptions require ARB approval"
    ],
    "owner": "Chief Technology Officer",
    "adherence_rate": 78
  }
}
```

---

## 🎯 Core Features

### 1. Landscape Heatmap
Recursive treemap showing nested hierarchies (Business Capability → Sub-Capability → Application).

**Use Cases:**
- Visualize portfolio health at a glance
- Color by Technical Fit, Lifecycle Phase, or Cost
- Identify gaps in capability coverage

### 2. Time Machine Roadmap
Gantt chart with a time slider to view architecture state at any date.

**Use Cases:**
- Plan migrations ("Show me Jan 2027 architecture")
- Track historical decisions
- Communicate future state to stakeholders

### 3. Business Impact Analysis (BIA)
Configurable scoring engine to calculate application criticality.

**Features:**
- Multiple aggregation strategies (MAX, Weighted Average)
- Topology-aware (High interdependency → Higher criticality)
- Custom scoring profiles (Safety First vs. Financial Weighted)

### 4. 6R Migration Advisor
Automated recommendation engine for cloud/modernization strategies.

**Strategies:**
- **Retire**: End-of-life low-value applications
- **Rehost**: Lift-and-shift to cloud
- **Replatform**: Move to managed services
- **Refactor**: Re-architect for cloud-native
- **Repurchase**: Replace with SaaS
- **Retain**: Keep as-is

### 5. TCO Calculator
Recursive cost roll-up from infrastructure → applications → business capabilities.

**Features:**
- Integration with Pustaka ITAM for base costs
- Multiple allocation strategies (Even Split, Manual Percentage)
- Currency normalization

---

## 🛡️ Governance & Strategy Features

### 6. Architecture Principles Management
Define and track architecture principles (e.g., "Cloud-First", "API-First Design") with adherence monitoring.

**Features:**
- Create and manage principles by category (Strategic, Business, Technical, Data)
- Track adherence rates across applications and capabilities
- View violations and exemptions
- Automated compliance reporting

### 7. Technology Standards (Technology Radar)
Manage technology lifecycle with interactive radar visualization.

**Features:**
- Track technology status: Adopt, Trial, Assess, Hold, Sunset, Banned
- Technology debt report with EOL monitoring
- Replacement tracking for sunset technologies
- Quadrant-based visualization (Languages, Frameworks, Databases, Infrastructure)

### 8. Architecture Policies & Exceptions
Enforceable rules with automated violation detection and exception management.

**Features:**
- JSON-based policy rules with blocking/warning enforcement
- Automated compliance checking against all cards
- Exception request workflow with approval/rejection
- Expiring exceptions tracking with notifications

### 9. Initiatives Portfolio
Strategic transformation program management with impact tracking.

**Features:**
- Kanban board by status (Planning, In Progress, On Hold, Completed)
- Budget tracking with spend visualization
- Impact map showing affected cards
- Initiative dependency management
- Health indicators (On Track, At Risk, Behind Schedule)

### 10. Risk Register
Comprehensive risk management with heat map visualization.

**Features:**
- Risk scoring matrix (Likelihood × Impact = Risk Score)
- Risk type categorization (Security, Compliance, Operational, Financial, Strategic)
- Top 10 risks view
- Risk-to-initiative linkage for mitigation tracking
- 5×5 heat map visualization

### 11. Compliance Dashboard
Framework-centric compliance tracking for GDPR, SOX, HIPAA, PCI-DSS, ISO 27001.

**Features:**
- Per-framework compliance rate monitoring
- Required controls checklist
- Non-compliant card identification
- Audit timeline with countdown
- Control-by-control assessment

### 12. ARB (Architecture Review Board)
Structured workflow for technology decision governance.

**Features:**
- Review queue with prioritization
- Technology selection requests
- Exception request reviews
- Decision tracking (Approve/Reject with conditions)
- Meeting management and decision history

---

## 🔧 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 18 + TypeScript | Type-safe, component-driven UI |
| | Shadcn UI + Tailwind | Accessible, customizable design system |
| | TanStack Query | Robust data fetching & caching |
| | D3.js + ReactFlow | Advanced visualizations |
| **Backend** | Rust + Axum | Memory-safe, high-performance API |
| | Tokio | Async runtime for concurrent operations |
| **Database** | PostgreSQL 16 | ACID compliance, JSONB flexibility |
| | Neo4j 5 | Graph queries 100x faster than SQL |
| | Redis 7 | Sub-millisecond caching |
| **Integration** | REST API | Industry-standard integration |
| | Excel/CSV Import | User-friendly bulk upload |

---

## 📊 Sample Data

Arc Zero ships with sample data demonstrating a fictional enterprise:

**Included:**
- 50 Applications (Mix of SaaS, On-Premise, Legacy)
- 20 Business Capabilities (Sales, HR, Finance, Operations)
- 100+ IT Components (Databases, Servers, Services)
- 15 Architecture Principles (Cloud-First, API-First, etc.)
- 25 Technology Standards (PostgreSQL, React, Oracle, etc.)
- 10 Architecture Policies with 20+ policy violations
- 5 Initiatives (Cloud Migration 2027, ERP Consolidation, etc.)
- 30 Risks (Operational, Security, Compliance)
- 3 Compliance Frameworks (GDPR, SOX, HIPAA)
- 200+ Relationships (Dependencies, Hosting, Support, Governance)

**Load Sample Data:**
```bash
cargo run --bin seed --sample enterprise-demo
```

**View Sample Reports:**
1. Navigate to `Reports > Landscape Heatmap`
2. Select "Color By: Technical Fit"
3. Drill down into "Sales Capability"

**View Governance Features:**
1. Navigate to `Governance > Architecture Principles` to see principle adherence
2. Navigate to `Governance > Technology Standards` to view the Technology Radar
3. Navigate to `Risk > Risk Register` to see the Top 10 risks
4. Navigate to `ARB > Pending Reviews` to see exception requests

---

## 🔌 API Example

### Create a Card

```bash
curl -X PATCH http://localhost:8080/api/v1/cards/new \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "type": "Application",
    "name": "Customer Portal",
    "description": "Self-service portal for customer accounts",
    "lifecycle": {
      "plan": "2026-03-01",
      "active": "2026-06-01"
    },
    "attributes": {
      "hosting_type": "Cloud Native",
      "cost_center": "CC-DIGITAL-01",
      "technical_fit": 4
    }
  }'
```

### Query the Graph

```bash
curl -X POST http://localhost:8080/api/v1/graph/traverse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "root_type": "BusinessCapability",
    "depth": 3,
    "relations": ["SUPPORTS", "PARENT_OF"],
    "target_date": "2027-01-01"
  }'
```

**Full API Documentation:** [docs/05-api-spec.md](docs/05-api-spec.md)

---

## ⌨️ Keyboard Shortcuts

Arc Zero includes powerful keyboard navigation for power users:

| Shortcut | Action |
|----------|--------|
| `Cmd+K` / `Ctrl+K` | Open global search |
| `G` then `D` | Go to Dashboard |
| `G` then `I` | Go to Inventory |
| `G` then `R` | Go to Reports |
| `G` then `G` | Go to Governance |
| `G` then `S` | Go to Strategic Planning |
| `G` then `K` | Go to Risk |
| `G` then `A` | Go to ARB (Architect/Admin only) |
| `N` | New Card (opens modal) |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close modal/drawer |

---

## 🧪 Running Tests

```bash
# Run all tests
cargo test

# Run backend tests only
cargo test --lib

# Run integration tests
cargo test --test integration_tests

# Run frontend tests
cd archzero-ui
npm test

# Run with coverage
cargo tarpaulin --out Html
```

---

## 🚢 Deployment

### Docker Production Setup

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://archzero:password@localhost:5432/archzero
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
REDIS_URL=redis://localhost:6379

# API
API_HOST=0.0.0.0
API_PORT=8080
JWT_SECRET=your-secret-key-change-this-in-production

# Integration
PUSTAKA_API_URL=https://pustaka.example.com/api
PUSTAKA_API_KEY=your-api-key

# Features
ENABLE_EXCEL_IMPORT=true
ENABLE_6R_ENGINE=true
ENABLE_GOVERNANCE=true
ENABLE_ARB_WORKFLOW=true
ENABLE_COMPLIANCE_TRACKING=true
DEFAULT_CURRENCY=USD
```

**Production Deployment Guide:** See [docs/08-deployment.md](docs/08-deployment.md)

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run tests:** `cargo test && npm test`
5. **Commit:** `git commit -m 'Add amazing feature'`
6. **Push:** `git push origin feature/amazing-feature`
7. **Open a Pull Request**

**Development Guidelines:**
- Follow Rust style guide (`cargo fmt`)
- Add tests for new features
- Update documentation
- Use conventional commits

**See:** [CONTRIBUTING.md](CONTRIBUTING.md) *(Coming Soon)*

---

## 📝 Roadmap

### ✅ Phase 1: Foundation (Completed - v1.0)
- [x] Core database (PostgreSQL + Neo4j)
- [x] Card CRUD operations
- [x] Metamodel validation
- [x] List view with filtering
- [x] Basic authentication (JWT)

### ✅ Phase 2: Relationships (Completed - v1.1)
- [x] Graph visualization (Force-directed)
- [x] Matrix report
- [x] BIA Engine (Basic)
- [x] Relationship validation

### ✅ Phase 3: Visualizations (Completed - v1.2)
- [x] Landscape Heatmap
- [x] Time Machine Roadmap
- [x] TCO Engine
- [x] Export to PDF/PowerPoint

### ✅ Phase 4: Intelligence (Completed - v1.3)
- [x] 6R Decision Engine
- [x] Advanced Excel Import
- [x] Pustaka Integration
- [x] AI-powered recommendations

### 🎉 Phase 5: Governance & Compliance (Completed - v2.0)
- [x] Layer D: Governance metamodel (7 new card types)
- [x] Architecture Principles management
- [x] Technology Standards (Technology Radar)
- [x] Architecture Policies & Exceptions
- [x] Initiatives Portfolio & Transformation Roadmap
- [x] Risk Register & Heat Map
- [x] Compliance Dashboard (GDPR, SOX, HIPAA)
- [x] ARB (Architecture Review Board) workflows
- [x] 35+ new API endpoints for governance
- [x] 14 new governance relationship types

### 🔮 Phase 6: Advanced Features (Planning - v2.1)
- [ ] Advanced analytics and dashboards
- [ ] Custom report builder
- [ ] Webhook notifications
- [ ] Mobile app (React Native)

**Full Roadmap:** See [docs/00-prd.md#7-roadmap--phases](docs/00-prd.md)

---

## 🐛 Troubleshooting

### Common Issues

**Problem: Neo4j connection fails**
```bash
# Check Neo4j is running
docker ps | grep neo4j

# Reset Neo4j password
docker exec -it archzero-neo4j cypher-shell -u neo4j -p password
CALL dbms.security.changePassword('newpassword');
```

**Problem: Migration fails**
```bash
# Reset database (WARNING: Deletes all data)
cargo run --bin migrate -- --reset

# Run migrations step-by-step
cargo run --bin migrate -- --verbose
```

**Problem: Frontend can't connect to API**
```bash
# Check CORS settings in backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Restart backend
cargo run --bin server
```

**More Help:** [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) *(Coming Soon)*

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **LeanIX** - Metamodel inspiration (v4 compatibility)
- **Axum** - Excellent Rust web framework
- **Shadcn UI** - Beautiful, accessible components
- **Neo4j** - Graph database expertise

---

## 📧 Contact & Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/tahopetis/archzero/issues)
- **Discussions:** [GitHub Discussions](https://github.com/tahopetis/archzero/discussions)
- **Email:** support@archzero.local

---

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tahopetis/archzero&type=Date)](https://star-history.com/#tahopetis/archzero&Date)

---

**Built with ❤️ for Enterprise Architects**

*Arc Zero - Because your enterprise architecture deserves better than spreadsheets.*
