-- Rollback Arc Zero v2.0 Initial Schema
-- This file drops all tables created in the initial migration

-- Drop in reverse order of creation
DROP TABLE IF EXISTS schema_migrations;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_relationships_type;
DROP INDEX IF EXISTS idx_relationships_to;
DROP INDEX IF EXISTS idx_relationships_from;
DROP INDEX IF EXISTS idx_cards_tags;
DROP INDEX IF EXISTS idx_cards_attributes;
DROP INDEX IF EXISTS idx_cards_lifecycle_active;
DROP INDEX IF EXISTS idx_cards_type;
DROP TABLE IF EXISTS relationships;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS cards;
DROP EXTENSION IF EXISTS "uuid-ossp";
