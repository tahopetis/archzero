// Arc Zero v2.0 Neo4j Indexes
// This script creates performance indexes
// Run with: cypher-shell -u neo4j -p devpassword < neo4j/02-indexes.cypher

// ==========================================
// 1. CARD INDEXES
// ==========================================

// Performance Index on Card UUID
CREATE INDEX card_id_index IF NOT EXISTS
FOR (n:Card) ON (n.id);

// Performance Index on Card Type
CREATE INDEX card_type_index IF NOT EXISTS
FOR (n:Card) ON (n.type);

// Performance Index on Edge Valid Dates
CREATE INDEX rel_valid_from_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_from);

CREATE INDEX rel_valid_to_index IF NOT EXISTS
FOR ()-[r:RELIES_ON]-() ON (r.valid_to);

// ==========================================
// 2. GOVERNANCE INDEXES
// ==========================================

// Initiative Status
CREATE INDEX initiative_status_index IF NOT EXISTS
FOR (n:Initiative) ON (n.status);

// Risk Score
CREATE INDEX risk_score_index IF NOT EXISTS
FOR (n:Risk) ON (n.risk_score);

// Technology Standard Status
CREATE INDEX standard_status_index IF NOT EXISTS
FOR (n:TechnologyStandard) ON (n.status);

// Exception Expiration
CREATE INDEX exceptions_expires_index IF NOT EXISTS
FOR ()-[r:EXEMPTS_FROM]-() ON (r.expires_at);
