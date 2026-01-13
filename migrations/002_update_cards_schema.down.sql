-- Rollback card schema updates
DROP INDEX IF EXISTS idx_cards_lifecycle_phase;
DROP INDEX IF EXISTS idx_cards_status;

-- Remove added columns (not reversible in PostgreSQL without adding them back with defaults)
ALTER TABLE cards DROP COLUMN IF EXISTS status;
ALTER TABLE cards DROP COLUMN IF EXISTS owner_id;
ALTER TABLE cards DROP COLUMN IF EXISTS lifecycle_phase;
