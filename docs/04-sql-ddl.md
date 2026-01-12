---

# Appendix D: Database Schema & DDL

**Target Database:** PostgreSQL 16+ & Neo4j 5+

## 1. PostgreSQL Schema (The Source of Truth)

This script sets up the strict tables and the flexible JSONB structures.

### `schema.sql`

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. The Core Table: CARDS
-- Stores the Entity with strict audit columns + flexible payload
-- ==========================================
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., 'Application', 'BusinessCapability'
    
    -- Strict Lifecycle Dimensions (Indexed for Roadmap Reporting)
    lifecycle_plan DATE,
    lifecycle_phase_in DATE,
    lifecycle_active DATE,
    lifecycle_phase_out DATE,
    lifecycle_eol DATE,
    
    -- Quality & Tags
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}', -- Postgres Array for fast filtering
    description TEXT,
    
    -- The "Flexible Periphery" (Tier 2 Data)
    -- Stores: cost_center, hosting_type, financials, custom fields
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1,
    
    -- Constraints
    CONSTRAINT unique_name_per_type UNIQUE (name, type)
);

-- ==========================================
-- 2. Configuration Table: SCORING PROFILES
-- Stores the logic for BIA, 6R, and Criticality
-- ==========================================
CREATE TABLE scoring_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- e.g., "Default Cloud First"
    is_active BOOLEAN DEFAULT false,
    
    -- Logic Configuration (Stored as JSON for the Rust engine to parse)
    -- Contains: Weights, Thresholds, Aggregation Strategy (MAX vs AVG)
    config_payload JSONB NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Metamodel Validation Rules
-- Defines constraints for the JSONB 'attributes' column
-- ==========================================
CREATE TABLE metamodel_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_type VARCHAR(50) NOT NULL, -- Applies to 'Application', etc.
    attribute_key VARCHAR(100) NOT NULL, -- e.g., 'hosting_type'

    -- Validation Logic
    is_required BOOLEAN DEFAULT false,
    regex_pattern VARCHAR(255), -- e.g., '^[A-Z]{2}-\d{4}$'
    allowed_values TEXT[], -- Enum options: ['SaaS', 'On-Prem']

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. GOVERNANCE & COMPLIANCE TABLES
-- New tables for EA governance features
-- ==========================================

-- 4.1 Architecture Principles
CREATE TABLE architecture_principles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT 'ArchitecturePrinciple',
    statement TEXT NOT NULL,
    rationale TEXT,
    implications TEXT,
    owner VARCHAR(255),
    category VARCHAR(50) CHECK (category IN ('Strategic', 'Business', 'Technical', 'Data')),
    adherence_rate INT DEFAULT 0 CHECK (adherence_rate BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.2 Technology Standards
CREATE TABLE technology_standards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'TechnologyStandard',
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Adopt', 'Trial', 'Assess', 'Hold', 'Sunset', 'Banned')),
    sunset_date DATE,
    replacement_id UUID REFERENCES technology_standards(id),
    rationale TEXT,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Architecture Policies
CREATE TABLE architecture_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL DEFAULT 'ArchitecturePolicy',
    rule_json JSONB NOT NULL, -- The actual rule logic
    severity VARCHAR(20) CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    enforcement VARCHAR(20) CHECK (enforcement IN ('Blocking', 'Warning')),
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 Exceptions
CREATE TABLE exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Exception',
    policy_id UUID REFERENCES architecture_policies(id),
    card_id UUID REFERENCES cards(id),
    justification TEXT NOT NULL,
    duration VARCHAR(20) CHECK (duration IN ('30_days', '60_days', '90_days', 'Permanent')),
    compensating_controls TEXT,
    status VARCHAR(20) CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Expired')),
    requested_by UUID, -- User ID
    approved_by UUID, -- User ID
    expires_at TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.5 Initiatives
CREATE TABLE initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Initiative',
    initiative_type VARCHAR(50) CHECK (initiative_type IN ('Modernization', 'Migration', 'Consolidation', 'New Build', 'Decommission', 'Integration')),
    strategic_theme VARCHAR(100),
    budget_total NUMERIC(15, 2) CHECK (budget_total >= 0),
    budget_spent NUMERIC(15, 2) DEFAULT 0 CHECK (budget_spent >= 0),
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    owner VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
    health VARCHAR(20) CHECK (health IN ('On Track', 'At Risk', 'Behind Schedule')),
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.6 Risks
CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Risk',
    description TEXT,
    risk_type VARCHAR(50) CHECK (risk_type IN ('Security', 'Compliance', 'Operational', 'Financial', 'Strategic', 'Reputational')),
    likelihood INT CHECK (likelihood BETWEEN 1 AND 5),
    impact INT CHECK (impact BETWEEN 1 AND 5),
    risk_score INT GENERATED ALWAYS AS (likelihood * impact) STORED,
    mitigation_plan TEXT,
    owner VARCHAR(255),
    status VARCHAR(20) CHECK (status IN ('Open', 'Mitigated', 'Accepted', 'Transferred', 'Closed')),
    target_closure_date DATE,
    tags TEXT[] DEFAULT '{}',
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4.7 Compliance Requirements
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- GDPR, SOX, HIPAA, etc.
    type VARCHAR(50) NOT NULL DEFAULT 'ComplianceRequirement',
    description TEXT,
    framework VARCHAR(50),
    applicable_card_types VARCHAR(50)[],
    required_controls TEXT[],
    audit_frequency VARCHAR(20) CHECK (audit_frequency IN ('Annual', 'Semi-Annual', 'Quarterly', 'Monthly')),
    tags TEXT[] DEFAULT '{}',
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. JUNCTION TABLES (M:N Relationships)
-- For many-to-many relationships involving governance entities
-- ==========================================

-- 5.1 Initiative -> Card (IMPACTS relationship)
CREATE TABLE initiative_card_impacts (
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    impact_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (initiative_id, card_id)
);

-- 5.2 Initiative -> Objective (ACHIEVES relationship)
CREATE TABLE initiative_objective_achievements (
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    objective_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (initiative_id, objective_id)
);

-- 5.3 Initiative -> Initiative (DEPENDS_ON relationship)
CREATE TABLE initiative_dependencies (
    predecessor_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    successor_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (predecessor_id, successor_id)
);

-- 5.4 Risk -> Card (THREATENS relationship)
CREATE TABLE risk_card_threats (
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (risk_id, card_id)
);

-- 5.5 Risk -> Initiative (MITIGATED_BY relationship)
CREATE TABLE risk_initiative_mitigations (
    risk_id UUID REFERENCES risks(id) ON DELETE CASCADE,
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (risk_id, initiative_id)
);

-- 5.6 Compliance Requirement -> Application (REQUIRES_COMPLIANCE_FROM relationship)
CREATE TABLE compliance_applications (
    compliance_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('Compliant', 'NonCompliant', 'Pending', 'Exempt')),
    last_assessed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (compliance_id, card_id)
);

-- 5.7 Architecture Principle -> Application (GUIDES relationship)
CREATE TABLE principle_applications (
    principle_id UUID REFERENCES architecture_principles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    adherence_score INT CHECK (adherence_score BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (principle_id, card_id)
);

-- 5.8 Architecture Principle -> Business Capability (APPLIES_TO relationship)
CREATE TABLE principle_capabilities (
    principle_id UUID REFERENCES architecture_principles(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (principle_id, card_id)
);

-- 5.9 Technology Standard -> IT Component (STANDARDIZES relationship)
CREATE TABLE standard_components (
    standard_id UUID REFERENCES technology_standards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (standard_id, card_id)
);

-- 5.10 Policy -> Card (APPLIES_TO relationship)
CREATE TABLE policy_cards (
    policy_id UUID REFERENCES architecture_policies(id) ON DELETE CASCADE,
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    violation_status VARCHAR(20) CHECK (violation_status IN ('Compliant', 'Violation', 'Exempt')),
    last_checked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (policy_id, card_id)
);

-- 5.11 Policy -> Architecture Principle (ENFORCES relationship)
CREATE TABLE policy_principles (
    policy_id UUID REFERENCES architecture_policies(id) ON DELETE CASCADE,
    principle_id UUID REFERENCES architecture_principles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (policy_id, principle_id)
);

-- ==========================================
-- 6. AUDIT TRAIL TABLE
-- Track all changes across all tables
-- ==========================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_value JSONB,
    new_value JSONB,
    changed_by UUID NOT NULL, -- User ID
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. PERFORMANCE INDEXES FOR NEW TABLES
-- ==========================================

-- Architecture Principles
CREATE INDEX idx_principles_category ON architecture_principles(category);
CREATE INDEX idx_principles_owner ON architecture_principles(owner);

-- Technology Standards
CREATE INDEX idx_standards_status ON technology_standards(status);
CREATE INDEX idx_standards_category ON technology_standards(category);
CREATE INDEX idx_standards_replacement ON technology_standards(replacement_id);

-- Policies
CREATE INDEX idx_policies_severity ON architecture_policies(severity);
CREATE INDEX idx_policies_enforcement ON architecture_policies(enforcement);

-- Exceptions
CREATE INDEX idx_exceptions_policy ON exceptions(policy_id);
CREATE INDEX idx_exceptions_card ON exceptions(card_id);
CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_expires ON exceptions(expires_at);

-- Initiatives
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_health ON initiatives(health);
CREATE INDEX idx_initiatives_type ON initiatives(initiative_type);
CREATE INDEX idx_initiatives_dates ON initiatives(start_date, target_end_date);

-- Risks
CREATE INDEX idx_risks_score ON risks(risk_score DESC);
CREATE INDEX idx_risks_type ON risks(risk_type);
CREATE INDEX idx_risks_status ON risks(status);

-- Compliance
CREATE INDEX idx_compliance_framework ON compliance_requirements(framework);

-- Junction tables (foreign key indexes)
CREATE INDEX idx_junction_initiatives_cards ON initiative_card_impacts(card_id);
CREATE INDEX idx_junction_risks_cards ON risk_card_threats(card_id);
CREATE INDEX idx_junction_compliance_apps ON compliance_applications(card_id);
CREATE INDEX idx_junction_principle_apps ON principle_applications(card_id);
CREATE INDEX idx_junction_policy_cards ON policy_cards(card_id);

-- Audit Log
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_by ON audit_log(changed_by);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);

-- ==========================================
-- 8. MIGRATIONS TABLE
-- Track schema version
-- ==========================================

CREATE TABLE schema_migrations (
    version VARCHAR(14) PRIMARY KEY, -- YYYYMMDDHHMMSS format
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial migration
INSERT INTO schema_migrations (version) VALUES ('20260113000000');

-- ==========================================
-- 9. PERFORMANCE INDEXES (FOR CARDS TABLE)
-- Critical for the "Flexible Search" to be fast
-- ==========================================

-- Standard Indexes
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_lifecycle_active ON cards(lifecycle_active);

-- GIN Index for JSONB (The "Magic" Index)
-- Allows queries like: SELECT * FROM cards WHERE attributes->>'hosting_type' = 'SaaS'
CREATE INDEX idx_cards_attributes ON cards USING GIN (attributes);

-- Tags Array Index
CREATE INDEX idx_cards_tags ON cards USING GIN (tags);

```

---

## 2. Neo4j Constraints (The Topology Engine)

This script ensures data integrity in the Graph Database. Note that we do **not** define a strict schema for nodes here (Neo4j is schemaless), but we strictly enforce Identity.

### `graph_init.cypher`

```cypher
// ==========================================
// 1. CORE CARD CONSTRAINTS
// ==========================================

// 1.1 Ensure Card IDs are Unique across the entire graph
CREATE CONSTRAINT card_id_unique IF NOT EXISTS
FOR (n:Card) REQUIRE n.id IS UNIQUE;

// 1.2 Performance Index on Card UUID (For Postgres <-> Neo4j Sync)
CREATE INDEX card_id_index IF NOT EXISTS
FOR (n:Card) ON (n.id);

// ==========================================
// 2. PERFORMANCE INDEXES FOR EDGES
// ==========================================

// 2.1 Performance Index on Edge Valid Dates (For Time Machine Queries)
CREATE INDEX rel_valid_from_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_from);

CREATE INDEX rel_valid_to_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_to);

// ==========================================
// 3. GOVERNANCE ENTITY CONSTRAINTS
// ==========================================

// 3.1 Architecture Principles
CREATE CONSTRAINT principle_id_unique IF NOT EXISTS
FOR (n:ArchitecturePrinciple) REQUIRE n.id IS UNIQUE;

// 3.2 Technology Standards
CREATE CONSTRAINT standard_id_unique IF NOT EXISTS
FOR (n:TechnologyStandard) REQUIRE n.id IS UNIQUE;

// 3.3 Architecture Policies
CREATE CONSTRAINT policy_id_unique IF NOT EXISTS
FOR (n:ArchitecturePolicy) REQUIRE n.id IS UNIQUE;

// 3.4 Initiatives
CREATE CONSTRAINT initiative_id_unique IF NOT EXISTS
FOR (n:Initiative) REQUIRE n.id IS UNIQUE;

// 3.5 Risks
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS
FOR (n:Risk) REQUIRE n.id IS UNIQUE;

// 3.6 Compliance Requirements
CREATE CONSTRAINT compliance_id_unique IF NOT EXISTS
FOR (n:ComplianceRequirement) REQUIRE n.id IS UNIQUE;

// ==========================================
// 4. PERFORMANCE INDEXES FOR GOVERNANCE NODES
// ==========================================

CREATE INDEX initiative_status_index IF NOT EXISTS
FOR (n:Initiative) ON (n.status);

CREATE INDEX risk_score_index IF NOT EXISTS
FOR (n:Risk) ON (n.risk_score);

CREATE INDEX standard_status_index IF NOT EXISTS
FOR (n:TechnologyStandard) ON (n.status);

CREATE INDEX exceptions_expires_index IF NOT EXISTS
FOR ()-[r:EXEMPTS_FROM]-() ON (r.expires_at);

// ==========================================
// 5. RELATIONSHIP INDEXES FOR NEW GOVERNANCE EDGES
// ==========================================

// GUIDES (Principle -> Card)
CREATE INDEX rel_guides_index IF NOT EXISTS
FOR ()-[r:GUIDES]-() ON (r.valid_from);

// IMPACTS (Initiative -> Card)
CREATE INDEX rel_impacts_index IF NOT EXISTS
FOR ()-[r:IMPACTS]-() ON (r.valid_from);

// THREATENS (Risk -> Card)
CREATE INDEX rel_threatens_index IF NOT EXISTS
FOR ()-[r:THREATENS]-() ON (r.created_at);

// STANDARDIZES (Standard -> Component)
CREATE INDEX rel_standardizes_index IF NOT EXISTS
FOR ()-[r:STANDARDIZES]-() ON (r.valid_from);

// APPLIES_TO (Policy -> Card)
CREATE INDEX rel_applies_to_index IF NOT EXISTS
FOR ()-[r:APPLIES_TO]-() ON (r.last_checked_at);

// ENFORCES (Policy -> Principle)
CREATE INDEX rel_enforces_index IF NOT EXISTS
FOR ()-[r:ENFORCES]-() ON (r.created_at);

// DEPENDS_ON (Initiative -> Initiative)
CREATE INDEX rel_depends_init_index IF NOT EXISTS
FOR ()-[r:DEPENDS_ON]-() ON (r.created_at);

// MITIGATED_BY (Risk -> Initiative)
CREATE INDEX rel_mitigated_by_index IF NOT EXISTS
FOR ()-[r:MITIGATED_BY]-() ON (r.created_at);

// REQUIRES_COMPLIANCE_FROM (Compliance -> Application)
CREATE INDEX rel_compliance_index IF NOT EXISTS
FOR ()-[r:REQUIRES_COMPLIANCE_FROM]-() ON (r.last_assessed_at);

```

---

## 3. Developer Notes

### Why `JSONB` and not EAV?

We chose `JSONB` for the `attributes` column instead of an Entity-Attribute-Value (EAV) table structure.

* **Performance:** The GIN index allows us to query custom fields almost as fast as native SQL columns.
* **Simplicity:** Fetching a Card requires `SELECT * FROM cards` (1 Row), whereas EAV requires complex Joins.

### The Sync Strategy

The application layer (Rust) is responsible for the **Dual-Write**:

1. **Transaction Start**
2. `INSERT INTO cards ...` (Postgres)
3. `CREATE (n:Card {id: $id, name: $name})` (Neo4j)
4. **Transaction Commit**
If step 3 fails, the Postgres transaction must rollback to keep IDs consistent.

---

## 4. Migration Notes

### New Tables in v2.0

The following tables were added for Governance & Compliance features:

**Core Tables (7):**
- `architecture_principles` - Stores architecture guidelines
- `technology_standards` - Technology radar and lifecycle tracking
- `architecture_policies` - Enforceable rules with JSONB rule logic
- `exceptions` - Policy deviation tracking
- `initiatives` - Strategic transformation programs
- `risks` - Risk register with scoring
- `compliance_requirements` - Regulatory compliance tracking

**Junction Tables (11):**
- `initiative_card_impacts` - Initiative to Card M:N
- `initiative_objective_achievements` - Initiative to Objective M:N
- `initiative_dependencies` - Initiative to Initiative dependencies
- `risk_card_threats` - Risk to Card M:N
- `risk_initiative_mitigations` - Risk to Initiative M:N
- `compliance_applications` - Compliance to Application M:N
- `principle_applications` - Principle to Application M:N
- `principle_capabilities` - Principle to Business Capability M:N
- `standard_components` - Standard to IT Component M:N
- `policy_cards` - Policy to Card M:N
- `policy_principles` - Policy to Principle M:N

**Support Tables (1):**
- `audit_log` - Universal audit trail for all tables

### Migration Strategy

**For New Deployments:**
```bash
psql -U archzero -d archzero -f schema.sql
```

**For Existing Deployments (Upgrade):**
```bash
# Apply migration script
psql -U archzero -d archzero -f migrations/20260113_add_governance_tables.sql
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release with core cards table | Database Team |
| 2.0 | 2026-01-13 | **MAJOR UPDATE**: Added 7 governance tables (architecture_principles, technology_standards, architecture_policies, exceptions, initiatives, risks, compliance_requirements). Added 11 junction tables for M:N relationships. Added audit_log table. Added comprehensive indexes for all new tables. Updated Neo4j constraints and indexes for governance entities. | Database Team |

---
