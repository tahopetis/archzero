-- Change confidence column from NUMERIC to FLOAT8 for easier Rust conversion
ALTER TABLE relationships ALTER COLUMN confidence TYPE FLOAT8 USING confidence::FLOAT8;
