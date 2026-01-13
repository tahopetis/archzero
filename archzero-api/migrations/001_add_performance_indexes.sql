-- Performance Optimization Indexes for Arc Zero API
-- Phase 5: Database Query Optimization

-- Indexes for cards table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_cards_name_trgm ON cards USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cards_description_trgm ON cards USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
CREATE INDEX IF NOT EXISTS idx_cards_lifecycle_phase ON cards(lifecycle_phase);
CREATE INDEX IF NOT EXISTS idx_cards_owner_id ON cards(owner_id);
CREATE INDEX IF NOT EXISTS idx_cards_quality_score ON cards(quality_score);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_updated_at ON cards(updated_at DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cards_type_phase ON cards(type, lifecycle_phase);
CREATE INDEX IF NOT EXISTS idx_cards_type_status ON cards(type, status);
CREATE INDEX IF NOT EXISTS idx_cards_owner_status ON cards(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_cards_phase_quality ON cards(lifecycle_phase, quality_score);

-- Indexes for relationships table
CREATE INDEX IF NOT EXISTS idx_relationships_source_id ON relationships(source_card_id);
CREATE INDEX IF NOT EXISTS idx_relationships_target_id ON relationships(target_card_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_source_type ON relationships(source_card_id, relationship_type);
CREATE INDEX IF NOT EXISTS idx_relationships_target_type ON relationships(target_card_id, relationship_type);

-- Indexes for BIA profiles
CREATE INDEX IF NOT EXISTS idx_bia_profiles_name ON bia_profiles(name);
CREATE INDEX IF NOT EXISTS idx_bia_profiles_criticality ON bia_profiles(criticality_level);

-- Partial indexes for better performance on active records
CREATE INDEX IF NOT EXISTS idx_cards_active_quality ON cards(quality_score) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cards_active_created ON cards(created_at DESC) WHERE status = 'active';

-- Covering indexes for frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_cards_covering ON cards(status, type, lifecycle_phase, quality_score) WHERE status = 'active';

-- Enable pg_trgm extension for text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for tags (JSONB array operations)
CREATE INDEX IF NOT EXISTS idx_cards_tags ON cards USING gin (tags);

-- Create GIN index for attributes (JSONB operations)
CREATE INDEX IF NOT EXISTS idx_cards_attributes ON cards USING gin (attributes);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_cards_name_trgm IS 'Full-text search index on card names';
COMMENT ON INDEX idx_cards_description_trgm IS 'Full-text search index on card descriptions';
COMMENT ON INDEX idx_cards_type_phase IS 'Composite index for type + phase filtering';
COMMENT ON INDEX idx_cards_active_quality IS 'Partial index for active cards quality sorting';

-- Analyze tables after index creation for better query planning
ANALYZE cards;
ANALYZE relationships;
ANALYZE bia_profiles;
