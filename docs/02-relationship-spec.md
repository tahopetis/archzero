---

# Appendix B: Relationship Specification

**Version:** 2.0
**Compliance:** LeanIX v4 Compatible + Extended EA Governance
**Last Updated:** January 13, 2026

---

## 1. Edge Schema (The "Smart Edge")

Every relationship in Arc Zero is a directed edge in Neo4j. It must possess the following properties to support historical analysis and future state planning.

| Property Key | Data Type | Mandatory | Description | Default |
|--------------|-----------|-----------|-------------|---------|
| `id` | `UUID` | **Yes** | Unique identifier for the relationship. | Auto-generated |
| `valid_from` | `DATE` | No | The date this connection becomes active. (Used for Future State) | NULL (active immediately) |
| `valid_to` | `DATE` | No | The date this connection ends. (Used for Historical/Archive) | NULL (active indefinitely) |
| `status` | `STRING` | **Yes** | `active` (Default) or `archived` (Soft delete) | `active` |
| `description` | `STRING` | No | Context (e.g., "API v2 integration", "Temporary workaround") | Empty string |
| `allocation_pct` | `FLOAT` | No | Manual cost allocation override for TCO calculation (0.0 - 1.0) | NULL (use even split) |

**Constraints:**
- `valid_from` MUST be <= `valid_to` (if both are set)
- `allocation_pct` MUST be between 0.0 and 1.0
- `status` MUST be one of: `active`, `archived`

**Example Edge:**
```cypher
CREATE (app:Application {id: "app-001"})-[r:RELIES_ON {
  id: "rel-12345",
  valid_from: date("2026-01-01"),
  valid_to: date("2026-12-31"),
  status: "active",
  description: "Temporary AWS migration",
  allocation_pct: 0.75
}]->(server:ITComponent {id: "srv-aws-01"})
```

---

## 2. Relationship Matrix (Allowed Connections)

This matrix defines the **Ontology** of the system. The API MUST reject any relationship creation attempt that does not fit these source/target pairs.

### 2.1 Strategic Layer

*Defining hierarchy and ownership.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
|-------------|-------------------|-------------|-------------|-------------------|------------|
| **Business Capability** | `PARENT_OF` | **Business Capability** | **1:N** | `IS_CHILD_OF` | **Acyclic** (No loops) |
| **Organization** | `RESPONSIBLE_FOR` | **Business Capability** | **M:N** | `OWNED_BY` | - |
| **Objective** | `ACHIEVED_BY` | **Initiative** | **M:N** | `CONTRIBUTES_TO` | - |
| **Initiative** | `AFFECTS` | **Business Capability** | **M:N** | `AFFECTED_BY` | Used for Project Impact Heatmaps |

**Example Query (Get Capability Hierarchy):**
```cypher
MATCH path = (root:BusinessCapability {name: "Sales"})-[:PARENT_OF*]->(child:BusinessCapability)
RETURN path
```

---

### 2.2 Application Layer

*Defining dependencies and data flow.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
|-------------|-------------------|-------------|-------------|-------------------|------------|
| **Application** | `SUPPORTS` | **Business Capability** | **M:N** | `SUPPORTED_BY` | **Critical:** Powers the Landscape Report |
| **Application** | `OWNED_BY` | **Organization** | **M:N** | `OWNS_APP` | Business Owner / Contact Person |
| **Application** | `RELIES_ON` | **IT Component** | **M:N** | `SUPPORTS_APP` | **Critical:** Powers Risk & TCO Rollups |
| **Application** | `PROVIDES` | **Interface** | **1:N** | `PROVIDED_BY` | Strict 1:N. An Interface belongs to exactly 1 App |
| **Application** | `CONSUMES` | **Interface** | **M:N** | `CONSUMED_BY` | Data flow tracking |
| **Application** | `SUCCESSOR_OF` | **Application** | **1:1** | `PREDECESSOR_OF` | Used for Roadmap Succession Planning |

**Example Query (Find All Dependencies):**
```cypher
MATCH (app:Application {name: "Salesforce CRM"})-[:RELIES_ON]->(comp:ITComponent)
RETURN app, comp
```

---

### 2.3 Technology Layer

*Defining the physical stack.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
|-------------|-------------------|-------------|-------------|-------------------|------------|
| **Interface** | `TRANSFERS` | **Data Object** | **M:N** | `TRANSFERRED_VIA` | Data Lineage tracking |
| **IT Component** | `PART_OF` | **Platform** | **M:1** | `CONSISTS_OF` | Grouping (e.g., EC2 instance inside AWS VPC) |
| **IT Component** | `PROVIDED_BY` | **Provider** | **M:1** | `PROVIDES_TECH` | Vendor Management |
| **IT Component** | `CATEGORIZED_BY` | **Tech Category** | **M:1** | `CLASSIFIES` | Tech Radar Grouping |

---

### 2.4 Governance Layer

*Defining governance relationships for architecture principles, standards, policies, and compliance.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
|-------------|-------------------|-------------|-------------|-------------------|------------|
| **Architecture Principle** | `GUIDES` | **Application** | **M:N** | `GUIDED_BY` | Principle influences application decisions |
| **Architecture Principle** | `APPLIES_TO` | **Business Capability** | **M:N** | `GOVERNED_BY` | Principle applies to capability scope |
| **Technology Standard** | `STANDARDIZES` | **IT Component** | **M:1** | `FOLLOWS_STANDARD` | Component conforms to technology standard |
| **Technology Standard** | `SUPERSEDES` | **Technology Standard** | **1:1** | `SUPERSEDED_BY` | Standard replacement relationship |
| **Architecture Policy** | `ENFORCES` | **Architecture Principle** | **M:N** | `ENFORCED_BY` | Policy operationalizes principle |
| **Architecture Policy** | `APPLIES_TO` | **Card (Any)** | **M:N** | `SUBJECT_TO_POLICY` | Policy governs card |
| **Exception** | `EXEMPTS_FROM` | **Architecture Policy** | **M:1** | `HAS_EXCEPTION` | Approved deviation from policy |
| **Exception** | `APPLIES_TO` | **Card (Any)** | **M:1** | `HAS_EXCEPTION` | Exception for specific card |
| **Initiative** | `IMPACTS` | **Card (Any)** | **M:N** | `IMPACTED_BY` | Initiative affects card state |
| **Initiative** | `ACHIEVES` | **Objective** | **M:N** | `ACHIEVED_BY` | Initiative contributes to objective |
| **Initiative** | `DEPENDS_ON` | **Initiative** | **M:N** | `PREREQUISITE_FOR` | Initiative dependency (must complete before) |
| **Risk** | `THREATENS` | **Card (Any)** | **M:N** | `HAS_RISK` | Risk threatens card |
| **Risk** | `MITIGATED_BY` | **Initiative** | **M:N** | `MITIGATES` | Initiative mitigates risk |
| **Compliance Requirement** | `REQUIRES` | **Application** | **M:N** | `MUST_COMPLY_WITH` | Application must comply with requirement |

**Example Queries (Governance):**

```cypher
// 1. Find all Applications violating a Principle
MATCH (princ:ArchitecturePrinciple {name: "Cloud-First"})-[:GUIDES]->(app:Application)
WHERE NOT app.hosting_type IN ["SaaS", "PaaS", "IaaS"]
RETURN princ, app

// 2. Get all Components using a Sunset Standard
MATCH (std:TechnologyStandard {status: "Sunset"})-[:STANDARDIZES]->(comp:ITComponent)
RETURN std.name AS standard, comp.name AS component, std.sunset_date
ORDER BY std.sunset_date

// 3. Find all Policies applying to Tier 1 Apps
MATCH (policy:ArchitecturePolicy)-[:APPLIES_TO]->(app:Application {business_criticality: "Tier 1"})
RETURN policy.name, app.name

// 4. Get Initiative Impact Map
MATCH (init:Initiative {name: "Cloud Migration 2027"})-[:IMPACTS]->(card:Card)
RETURN init.name AS initiative, card.name, card.type

// 5. Find Risks without Mitigation
MATCH (risk:Risk {status: "Open"})-[:THREATENS]->(card:Card)
WHERE NOT (risk)-[:MITIGATED_BY]->(:Initiative)
RETURN risk.name, card.name
ORDER BY risk.risk_score DESC

// 6. Get Compliance Violations
MATCH (comp:ComplianceRequirement {framework: "GDPR"})-[:REQUIRES]->(app:Application)
WHERE app.compliance_status = "NonCompliant"
RETURN comp.name, app.name, app.data_classification
```

---

**Governance Relationship Constraints:**

| Relationship | Constraint | Description |
|--------------|------------|-------------|
| `PARENT_OF` (Capability) | Acyclic | Cannot create circular hierarchy |
| `DEPENDS_ON` (Initiative) | Acyclic | Initiative B cannot depend on A if A depends on B |
| `SUPERSEDES` (Standard) | One-way | Standard A supersedes B, B cannot supersede A |
| `EXEMPTS_FROM` (Exception) | Valid Policy | Exception must reference existing policy |
| `APPLIES_TO` (Policy) | Type-based | Policy only applies to allowed card types |
| `REQUIRES` (Compliance) | Application only | Compliance requirements only apply to Applications |

---

**Cascade Rules for Governance Entities:**

| Deleted Node | Related Node | Relationship Type | Action |
|--------------|--------------|-------------------|--------|
| Architecture Principle | Application | GUIDES | DETACH (principle archived, apps remain) |
| Technology Standard | IT Component | STANDARDIZES | DETACH (warning issued to admins) |
| Architecture Policy | Card | APPLIES_TO | DETACH (policy archived, cards remain) |
| Architecture Policy | Exception | EXEMPTS_FROM | CASCADE (exceptions closed when policy deleted) |
| Initiative | Card | IMPACTS | DETACH (initiative cancelled, cards remain) |
| Initiative | Initiative | DEPENDS_ON | ERROR (must reassign dependencies first) |
| Risk | Initiative | MITIGATED_BY | DETACH (risk status reviewed) |
| Compliance Requirement | Application | REQUIRES | DETACH (requirement archived) |

---

## 3. Graph Constraints & Logic

### 3.1 The Acyclic Hierarchy Check

**Scenario:** A user tries to make "Level 3 Capability" the parent of "Level 1 Capability."

**Risk:** This creates an infinite loop in the Landscape Report (Treemap), causing the browser/server to crash.

**Implementation (Rust Backend):**
Before creating any `PARENT_OF` edge:

1. Run a Cypher query to detect cycles:
   ```cypher
   MATCH path = (target:BusinessCapability {id: $target_id})-[:PARENT_OF*]->(source:BusinessCapability {id: $source_id})
   RETURN path
   LIMIT 1
   ```

2. If a path exists, **REJECT** the request:
   ```json
   {
     "error": {
       "code": "CYCLE_DETECTED",
       "message": "Cannot create relationship: This would create a circular dependency.",
       "details": {
         "source": "Level 3 Capability",
         "target": "Level 1 Capability",
         "existing_path": ["Level 1 -> Level 2 -> Level 3"]
       }
     }
   }
   ```

**Performance Note:** This query is O(n) where n = depth of hierarchy. Typical EA hierarchies are 3-5 levels deep, so performance impact is negligible.

---

### 3.2 Orphan Management (Cascading Logic)

**Scenario:** An Application is deleted (soft delete: `deleted_at` timestamp set).

**Cascading Rules:**

| Related Entity | Action | Rationale |
|----------------|--------|-----------|
| **Interfaces** (`PROVIDES`) | **CASCADE SOFT DELETE** | An API endpoint cannot exist without the App that provides it |
| **Relationships** (All types) | **ARCHIVE** (Set `status='archived'`) | Preserve for historical queries |
| **IT Components** (`RELIES_ON`) | **DO NOT DELETE** | The Server might be supporting other Apps |
| **Business Capabilities** (`SUPPORTS`) | **DO NOT DELETE** | The Capability still exists, it is just unsupported now |

**Implementation (Rust):**
```rust
// Pseudocode
fn soft_delete_application(app_id: UUID) {
    // 1. Soft delete the Application
    db.execute("UPDATE cards SET deleted_at = NOW() WHERE id = $1", app_id);
    
    // 2. CASCADE: Soft delete owned Interfaces
    db.execute("UPDATE cards SET deleted_at = NOW() 
                WHERE type = 'Interface' 
                AND id IN (
                    SELECT target_id FROM relationships 
                    WHERE source_id = $1 AND type = 'PROVIDES'
                )", app_id);
    
    // 3. ARCHIVE: Mark all relationships as archived
    neo4j.execute("MATCH (app:Application {id: $app_id})-[r]-() 
                   SET r.status = 'archived'", app_id);
}
```

**Complete Cascade Table:**

| Deleted Node | Related Node | Relationship Type | Action |
|--------------|--------------|-------------------|--------|
| Application | Interface | PROVIDES | CASCADE DELETE |
| Application | IT Component | RELIES_ON | DETACH (orphan allowed) |
| Application | Business Capability | SUPPORTS | DETACH |
| Application | Organization | OWNED_BY | DETACH |
| Business Capability | Child Capability | PARENT_OF | **ERROR** (must reassign or delete children first) |
| IT Component | Application | SUPPORTS_APP | DETACH |
| Organization | Application | OWNS_APP | DETACH |
| Platform | IT Component | CONSISTS_OF | DETACH (orphan allowed) |

---

### 3.3 The "Time Machine" Query Logic

When a user views the "Landscape as of Jan 1, 2027," the backend MUST filter relationships based on `valid_from` and `valid_to` dates.

**Standard Query Pattern:**

```cypher
// Get all Applications supporting a Capability on a specific date
MATCH (app:Application)-[r:SUPPORTS]->(cap:BusinessCapability {name: "Sales"})
WHERE
  (r.valid_from IS NULL OR r.valid_from <= date($target_date))
  AND
  (r.valid_to IS NULL OR r.valid_to >= date($target_date))
  AND
  r.status = 'active'
RETURN app, r, cap
```

**Query Parameters:**
```json
{
  "target_date": "2027-01-01"
}
```

**Use Cases:**
- **Historical Analysis:** "Show me the architecture on Dec 31, 2024" (Before migration)
- **Future Planning:** "Show me the target state on Jun 30, 2027" (Post-migration)
- **Roadmap Visualization:** Time slider animates through dates, re-running this query

**Performance Optimization:**
- Index on `r.valid_from` and `r.valid_to` (see 04-sql-ddl.md)
- Cache results for common dates (Today, End of Year) in Redis

---

### 3.4 Interdependency Calculation (Degree Centrality)

This logic feeds the **BIA Engine** to calculate application criticality.

**Metric:** `Fan-In Degree`  
**Definition:** Count of incoming `RELIES_ON` + `CONSUMES` edges.

**Query:**
```cypher
MATCH (app:Application {id: $app_id})<-[r:RELIES_ON|CONSUMES]-()
WHERE r.status = 'active'
RETURN count(r) AS fan_in_degree
```

**Interpretation:**

| Fan-In Degree | Meaning | BIA Impact |
|---------------|---------|------------|
| **0-5** | Low interdependency | Candidate for Decommissioning (no one uses it) |
| **6-20** | Moderate interdependency | Standard application |
| **21-50** | High interdependency | Important application |
| **50+** | **Critical Dependency** | **Tier 1 Criticality Bonus** (Auto-escalate) |

**Usage in BIA Engine:**
```rust
// Pseudocode
let fan_in = graph.count_incoming_edges(app_id);
let topology_score = if fan_in > 50 { 4.0 } else if fan_in > 20 { 3.0 } else { 1.0 };

// Apply Topology Boost
if topology_score == 4.0 {
    final_criticality = max(base_criticality, "Tier 1");
}
```

**Performance Considerations:**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Query Time** | < 100ms for single app | Neo4j query profiler |
| **Batch Calculation** | < 30 seconds for 1,000 apps | Nightly batch job |
| **Cache TTL** | 15 minutes | Redis cache |
| **Trigger** | On any `RELIES_ON` edge creation/deletion | Event-driven recalculation |

---

## 4. Relationship Lifecycle Patterns

Common patterns for managing relationships over time.

### 4.1 Pattern A: Application Succession (Migration)

**Scenario:** Migrating from "Salesforce Classic" to "Salesforce Lightning"

**Timeline:**
- **2025-01-01:** Planning starts, both apps exist
- **2025-06-01:** Lightning goes live (parallel run)
- **2025-12-31:** Classic is decommissioned

**Relationship Structure:**
```cypher
// Succession relationship (permanent)
(classic:Application {name: "Salesforce Classic"})-[:SUCCESSOR_OF]->(lightning:Application {name: "Salesforce Lightning"})

// Business Capability support (time-bounded)
// Classic supports Sales until Dec 31, 2025
(classic)-[:SUPPORTS {
  valid_from: date("2018-01-01"),
  valid_to: date("2025-12-31")
}]->(sales:BusinessCapability {name: "Sales"})

// Lightning supports Sales from Jun 1, 2025 onwards
(lightning)-[:SUPPORTS {
  valid_from: date("2025-06-01"),
  valid_to: null
}]->(sales)
```

**Time Machine Behavior:**
- **Query date: 2025-03-01** → Shows Classic (only Classic is valid)
- **Query date: 2025-08-01** → Shows BOTH (parallel run period)
- **Query date: 2026-01-01** → Shows Lightning only (Classic is retired)

---

### 4.2 Pattern B: Temporary Vendor Migration (Trial Period)

**Scenario:** Move from AWS to Azure for 6 months (pilot)

```cypher
// Original AWS hosting (ongoing)
(app:Application {name: "Data Analytics Platform"})-[:HOSTED_ON {
  valid_from: date("2020-01-01"),
  valid_to: date("2026-06-30")  // Ends when Azure trial starts
}]->(aws:Platform {name: "AWS Production"})

// Azure pilot (time-limited)
(app)-[:HOSTED_ON {
  valid_from: date("2026-07-01"),
  valid_to: date("2026-12-31"),  // 6-month trial
  description: "Azure migration pilot - evaluate cost savings"
}]->(azure:Platform {name: "Azure Prod"})

// Future state (if pilot succeeds, extend this relationship)
```

**Decision Point (Dec 2026):**
- **If pilot succeeds:** Set `valid_to = null` on Azure relationship (make permanent)
- **If pilot fails:** Create new relationship back to AWS starting 2027-01-01

---

### 4.3 Pattern C: Planned Decommissioning (Known End Date)

**Scenario:** Legacy system scheduled for retirement

```cypher
(legacy:Application {name: "AS/400 Order System"})-[:SUPPORTS {
  valid_from: date("1995-01-01"),
  valid_to: date("2026-06-30"),
  description: "Scheduled for replacement by SAP S/4HANA"
}]->(cap:BusinessCapability {name: "Order Management"})

(sap:Application {name: "SAP S/4HANA"})-[:SUPPORTS {
  valid_from: date("2026-07-01"),
  valid_to: null
}]->(cap)
```

**Roadmap Visualization:**
- Gantt chart shows handoff on 2026-06-30
- Time slider at 2026-05-01 shows "Transition in 2 months" warning

---

### 4.4 Pattern D: Multi-Regional Rollout

**Scenario:** Application deployed in phases across regions

```cypher
// US rollout
(app:Application {name: "Global CRM"})-[:USED_BY {
  valid_from: date("2026-01-01"),
  description: "US launch"
}]->(us:Organization {name: "US Division"})

// Europe rollout (later)
(app)-[:USED_BY {
  valid_from: date("2026-06-01"),
  description: "Europe launch"
}]->(eu:Organization {name: "Europe Division"})

// APAC rollout (future)
(app)-[:USED_BY {
  valid_from: date("2027-01-01"),
  description: "APAC launch (planned)"
}]->(apac:Organization {name: "APAC Division"})
```

---

## 5. Performance Guidance

### 5.1 Query Complexity

| Query Type | Complexity | Max Execution Time | Optimization |
|------------|------------|-------------------|--------------|
| **Direct Relationship** (1 hop) | O(1) | < 10ms | B-tree index on node IDs |
| **Hierarchy Traversal** (3 levels) | O(n) where n = children | < 100ms | Limit depth to 5 levels |
| **Fan-In/Fan-Out** (degree centrality) | O(e) where e = edges | < 100ms | Cache in Redis |
| **Shortest Path** (2 nodes) | O(n*e) | < 500ms | Limit to 10 hops max |
| **Impact Analysis** (3-level cascade) | O(n^3) worst case | < 3 seconds | Incremental traversal with limits |

**Caching Strategy:**

| Data | Cache Location | TTL | Invalidation Trigger |
|------|---------------|-----|---------------------|
| Fan-In Degree | Redis | 15 minutes | Any `RELIES_ON` edge change |
| Capability Hierarchy | Redis | 1 hour | Any `PARENT_OF` edge change |
| Landscape Heatmap Data | Redis | 30 minutes | Any `SUPPORTS` edge change |

---

### 5.2 Graph Size Scalability

**Tested Limits:**

| Metric | Tested Scale | Performance |
|--------|--------------|-------------|
| **Nodes** | 100,000 Cards | Traversal: < 1 sec for 3 levels |
| **Edges** | 500,000 Relationships | Fan-In query: < 200ms |
| **Hierarchy Depth** | 10 levels (Business Capability) | Recursive query: < 500ms |
| **Concurrent Queries** | 50 simultaneous users | No degradation |

**Scaling Recommendations:**
- **1,000 - 10,000 nodes:** Single Neo4j instance (4 CPU, 16GB RAM)
- **10,000 - 100,000 nodes:** Neo4j with read replicas (1 writer, 2 readers)
- **100,000+ nodes:** Neo4j Cluster (3 cores, causal consistency)

---

## 6. API Examples

### 6.1 Create a Relationship

**`POST /api/v1/relationships`**

```json
{
  "source_id": "app-001",
  "target_id": "cap-sales",
  "type": "SUPPORTS",
  "valid_from": "2026-01-01",
  "description": "New CRM supports Sales capability"
}
```

**Response (201 Created):**
```json
{
  "id": "rel-12345",
  "source_id": "app-001",
  "target_id": "cap-sales",
  "type": "SUPPORTS",
  "valid_from": "2026-01-01",
  "valid_to": null,
  "status": "active",
  "created_at": "2026-01-12T10:30:00Z"
}
```

---

### 6.2 Query Time Machine

**`POST /api/v1/graph/traverse`**

```json
{
  "root_type": "BusinessCapability",
  "root_id": "cap-sales",
  "depth": 2,
  "relations": ["SUPPORTS", "PARENT_OF"],
  "target_date": "2027-06-01",
  "filter": {
    "attributes.hosting_type": "Cloud"
  }
}
```

**Response (200 OK):**
```json
{
  "nodes": [
    {
      "id": "cap-sales",
      "name": "Sales",
      "type": "BusinessCapability"
    },
    {
      "id": "app-sf",
      "name": "Salesforce CRM",
      "type": "Application",
      "hosting_type": "SaaS"
    }
  ],
  "links": [
    {
      "source": "app-sf",
      "target": "cap-sales",
      "type": "SUPPORTS",
      "valid_from": "2020-01-01",
      "valid_to": null
    }
  ]
}
```

---

## 7. Testing & Validation

### 7.1 Relationship Integrity Tests

**Test Case 1: Prevent Cycles**
```cypher
// Attempt to create a cycle
CREATE (a:BusinessCapability {name: "A"})-[:PARENT_OF]->(b:BusinessCapability {name: "B"})
CREATE (b)-[:PARENT_OF]->(c:BusinessCapability {name: "C"})
CREATE (c)-[:PARENT_OF]->(a)  // ❌ Should FAIL
```

**Expected:** HTTP 400 error with `CYCLE_DETECTED`

---

**Test Case 2: Time Machine Edge Cases**
```cypher
// Relationship valid only in 2026
CREATE (app)-[r:SUPPORTS {
  valid_from: date("2026-01-01"),
  valid_to: date("2026-12-31")
}]->(cap)

// Query before valid period
target_date = "2025-12-31"  // ❌ Should return NO relationship

// Query during valid period
target_date = "2026-06-01"  // ✅ Should return the relationship

// Query after valid period
target_date = "2027-01-01"  // ❌ Should return NO relationship
```

---

**Test Case 3: Cascade Delete**
```sql
-- Create Application with Interface
INSERT INTO cards (id, name, type) VALUES ('app-001', 'MyApp', 'Application');
INSERT INTO cards (id, name, type) VALUES ('int-001', 'MyAPI', 'Interface');
CREATE (app:Application {id: 'app-001'})-[:PROVIDES]->(int:Interface {id: 'int-001'})

-- Soft delete Application
UPDATE cards SET deleted_at = NOW() WHERE id = 'app-001';

-- Verify Interface is also deleted
SELECT deleted_at FROM cards WHERE id = 'int-001';
-- Expected: deleted_at IS NOT NULL ✅
```

---

## Appendix: Cypher Query Reference

**Common Patterns:**

```cypher
// 1. Get all children of a Capability (1 level)
MATCH (parent:BusinessCapability {name: "Sales"})-[:PARENT_OF]->(child)
RETURN child.name

// 2. Get full hierarchy tree (all levels)
MATCH path = (root:BusinessCapability {name: "Enterprise"})-[:PARENT_OF*]->(leaf)
RETURN path

// 3. Find orphaned Applications (no Capability support)
MATCH (app:Application)
WHERE NOT (app)-[:SUPPORTS]->(:BusinessCapability)
RETURN app.name

// 4. Calculate total cost for a Capability (TCO rollup)
MATCH (cap:BusinessCapability)<-[:SUPPORTS]-(app:Application)<-[:RELIES_ON]-(comp:ITComponent)
RETURN cap.name, sum(comp.cost) AS total_cost

// 5. Impact analysis (what breaks if this app fails?)
MATCH (app:Application {name: "Oracle DB"})<-[:RELIES_ON]-(dependent:Application)
RETURN dependent.name, dependent.business_criticality
ORDER BY dependent.business_criticality
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.0.1 | 2026-01-12 | Added lifecycle patterns, performance guidance, cascade rules table, testing section | Documentation Team |
| 2.0 | 2026-01-13 | **MAJOR UPDATE**: Added Section 2.4 - Governance Layer with 14 new relationship types. Added relationships for Architecture Principles (GUIDES, APPLIES_TO), Technology Standards (STANDARDIZES, SUPERSEDES), Architecture Policies (ENFORCES, APPLIES_TO), Exceptions (EXEMPTS_FROM, APPLIES_TO), Initiatives (IMPACTS, ACHIEVES, DEPENDS_ON), Risks (THREATENS, MITIGATED_BY), and Compliance Requirements (REQUIRES). Added governance-specific example Cypher queries, relationship constraints, and cascade rules. | Documentation Team |
