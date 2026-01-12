-- Arc Zero v2.0 Initial Schema Migration
-- This file creates the base database schema for Arc Zero
-- Based on docs/04-sql-ddl.md

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CARDS TABLE
-- Stores all entity types with strict audit + flexible JSONB
-- ==========================================
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,

    -- Lifecycle Dimensions
    lifecycle_plan DATE,
    lifecycle_phase_in DATE,
    lifecycle_active DATE,
    lifecycle_phase_out DATE,
    lifecycle_eol DATE,

    -- Quality & Tags
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}',
    description TEXT,

    -- Flexible Attributes (Tier 2 Data)
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    version INT DEFAULT 1,

    CONSTRAINT unique_name_per_type UNIQUE (name, type)
);

-- ==========================================
-- 2. USERS TABLE
-- Authentication and authorization
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'architect', 'editor', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- ==========================================
-- 3. RELATIONSHIPS TABLE
-- Stores connections between cards
-- ==========================================
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    to_card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    attributes JSONB DEFAULT '{}'::jsonb,
    confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_card_id, to_card_id, relationship_type, valid_from)
);

-- ==========================================
-- 4. PERFORMANCE INDEXES
-- ==========================================

-- Cards indexes
CREATE INDEX idx_cards_type ON cards(type);
CREATE INDEX idx_cards_lifecycle_active ON cards(lifecycle_active);
CREATE INDEX idx_cards_attributes ON cards USING GIN (attributes);
CREATE INDEX idx_cards_tags ON cards USING GIN (tags);

-- Relationships indexes
CREATE INDEX idx_relationships_from ON relationships(from_card_id);
CREATE INDEX idx_relationships_to ON relationships(to_card_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);

-- Users index
CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- 5. SCHEMA MIGRATIONS TRACKING
-- ==========================================
CREATE TABLE schema_migrations (
    version VARCHAR(14) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version) VALUES ('20260112000000');
