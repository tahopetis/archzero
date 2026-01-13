-- Query Performance Analysis Script
-- Phase 5: Database Query Optimization
-- Run this periodically to identify slow queries

-- Enable query logging (temporary, for analysis)
ALTER SYSTEM SET log_min_duration_statement = 100; -- Log queries taking >100ms
ALTER SYSTEM SET log_statement = 'mod'; -- Log modifying queries

-- Find slow queries in pg_stat_statements (requires pg_stat_statements extension)
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY schemaname, tablename, attname;

-- Analyze table statistics
SELECT
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch,
    n_tup_ins,
    n_tup_upd,
    n_tup_del,
    n_tup_hot_updt
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Find indexes with low usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Check for missing indexes on foreign keys
SELECT
    con.relname AS table_name,
    con2.relname AS referenced_table,
    con.nlive_tup AS estimated_rows,
    con.idx_scan AS index_scans
FROM pg_stat_user_tables con
JOIN pg_constraint c ON c.conrelid = con.relid
JOIN pg_stat_user_tables con2 ON c.confrelid = con2.relid
WHERE c.contype = 'f'
  AND con.idx_scan IS NULL
ORDER BY con.nlive_tup DESC;

-- Suggest indexes based on query patterns
-- This helps identify columns that appear in WHERE clauses but lack indexes

-- Vacuum analyze for updated statistics
VACUUM ANALYZE cards;
VACUUM ANALYZE relationships;
VACUUM ANALYZE bia_profiles;
VACUUM ANALYZE initiatives;
VACUUM ANALYZE risks;
VACUUM ANALYZE compliance_requirements;

-- Note: To disable query logging after analysis
-- ALTER SYSTEM RESET log_min_duration_statement;
-- ALTER SYSTEM RESET log_statement;
-- SELECT pg_reload_conf();
