-- Revert confidence column back to NUMERIC
ALTER TABLE relationships ALTER COLUMN confidence TYPE NUMERIC(3,2) USING confidence::NUMERIC(3,2);
