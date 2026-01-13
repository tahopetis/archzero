-- Drop indexes
DROP INDEX IF EXISTS idx_cards_tags_gin;
DROP INDEX IF EXISTS idx_cards_description_trgm;
DROP INDEX IF EXISTS idx_cards_name_trgm;

-- Remove pg_trgm extension
DROP EXTENSION IF EXISTS pg_trgm;
