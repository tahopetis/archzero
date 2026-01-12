// Arc Zero v2.0 Neo4j Constraints
// This script creates uniqueness constraints for data integrity
// Run with: cypher-shell -u neo4j -p devpassword < neo4j/01-constraints.cypher

// ==========================================
// 1. CORE CARD CONSTRAINTS
// ==========================================

// Ensure Card IDs are unique
CREATE CONSTRAINT card_id_unique IF NOT EXISTS
FOR (n:Card) REQUIRE n.id IS UNIQUE;

// ==========================================
// 2. GOVERNANCE ENTITY CONSTRAINTS
// ==========================================

// Architecture Principles
CREATE CONSTRAINT principle_id_unique IF NOT EXISTS
FOR (n:ArchitecturePrinciple) REQUIRE n.id IS UNIQUE;

// Technology Standards
CREATE CONSTRAINT standard_id_unique IF NOT EXISTS
FOR (n:TechnologyStandard) REQUIRE n.id IS UNIQUE;

// Architecture Policies
CREATE CONSTRAINT policy_id_unique IF NOT EXISTS
FOR (n:ArchitecturePolicy) REQUIRE n.id IS UNIQUE;

// Initiatives
CREATE CONSTRAINT initiative_id_unique IF NOT EXISTS
FOR (n:Initiative) REQUIRE n.id IS UNIQUE;

// Risks
CREATE CONSTRAINT risk_id_unique IF NOT EXISTS
FOR (n:Risk) REQUIRE n.id IS UNIQUE;

// Compliance Requirements
CREATE CONSTRAINT compliance_id_unique IF NOT EXISTS
FOR (n:ComplianceRequirement) REQUIRE n.id IS UNIQUE;
