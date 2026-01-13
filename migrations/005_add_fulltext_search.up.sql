-- Enable pg_trgm extension for trigram-based full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create a GIN index on the name column for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cards_name_trgm ON cards USING gin (name gin_trgm_ops);

-- Create a GIN index on the description column for fast full-text search
CREATE INDEX IF NOT EXISTS idx_cards_description_trgm ON cards USING gin (description gin_trgm_ops);

-- Create an index on tags for faster filtering (already JSONB, but ensure GIN index exists)
CREATE INDEX IF NOT EXISTS idx_cards_tags_gin ON cards USING gin (tags);
