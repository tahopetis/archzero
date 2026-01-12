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
-- 4. Performance Indexes
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
// 1. Ensure Card IDs are Unique across the entire graph
CREATE CONSTRAINT card_id_unique IF NOT EXISTS
FOR (n:Card) REQUIRE n.id IS UNIQUE;

// 2. Performance Index on Card UUID (For Postgres <-> Neo4j Sync)
CREATE INDEX card_id_index IF NOT EXISTS
FOR (n:Card) ON (n.id);

// 3. Performance Index on Edge Valid Dates (For Time Machine Queries)
CREATE INDEX rel_valid_from_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_from);

CREATE INDEX rel_valid_to_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_to);

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
