---

# Appendix B: Relationship Specification

**Version:** 1.0
**Compliance:** LeanIX v4 Compatible

## 1. Edge Schema (The "Smart Edge")

Every relationship in Arc Zero is a directed edge in Neo4j. It must possess the following properties to support historical analysis and future state planning.

| Property Key | Data Type | Mandatory | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | **Yes** | Unique identifier for the relationship. |
| `valid_from` | `DATE` | No | The date this connection becomes active. (Used for Future State). |
| `valid_to` | `DATE` | No | The date this connection ends. (Used for Historical/Archive). |
| `status` | `STRING` | **Yes** | `active` (Default) or `archived` (Soft delete). |
| `description` | `STRING` | No | Context (e.g., "API v2 integration"). |
| `allocation_pct` | `FLOAT` | No | Manual cost allocation override (0.0 - 1.0). See TCO Logic. |

> **Constraint:** `valid_from` must be  `valid_to`.

---

## 2. Relationship Matrix (Allowed Connections)

This matrix defines the **Ontology** of the system. The API must reject any relationship creation attempt that does not fit these source/target pairs.

### 2.1 Strategic Layer

*Defining hierarchy and ownership.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
| --- | --- | --- | --- | --- | --- |
| **Business Capability** | `PARENT_OF` | **Business Capability** | **1:N** | `IS_CHILD_OF` | **Acyclic** (No loops). |
| **Organization** | `RESPONSIBLE_FOR` | **Business Capability** | **M:N** | `OWNED_BY` | - |
| **Objective** | `ACHIEVED_BY` | **Initiative** | **M:N** | `CONTRIBUTES_TO` | - |
| **Initiative** | `AFFECTS` | **Business Capability** | **M:N** | `AFFECTED_BY` | Used for Project Heatmaps. |

### 2.2 Application Layer

*Defining dependencies and data flow.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
| --- | --- | --- | --- | --- | --- |
| **Application** | `SUPPORTS` | **Business Capability** | **M:N** | `SUPPORTED_BY` | **Critical:** Powers the Landscape Report. |
| **Application** | `OWNED_BY` | **Organization** | **M:N** | `OWNS_APP` | Contact Person / Business Owner. |
| **Application** | `RELIES_ON` | **IT Component** | **M:N** | `SUPPORTS_APP` | **Critical:** Powers Risk & TCO Rollups. |
| **Application** | `PROVIDES` | **Interface** | **1:N** | `PROVIDED_BY` | Strict 1:N. An Interface belongs to 1 App. |
| **Application** | `CONSUMES` | **Interface** | **M:N** | `CONSUMED_BY` | - |
| **Application** | `SUCCESSOR_OF` | **Application** | **1:1** | `PREDECESSOR_OF` | Used for Roadmap Succession. |

### 2.3 Technology Layer

*Defining the physical stack.*

| Source Node | Relationship Type | Target Node | Cardinality | Inverse Label (UI) | Constraint |
| --- | --- | --- | --- | --- | --- |
| **Interface** | `TRANSFERS` | **Data Object** | **M:N** | `TRANSFERRED_VIA` | Data Lineage. |
| **IT Component** | `PART_OF` | **Platform** | **M:1** | `CONSISTS_OF` | Grouping (e.g., EC2 inside AWS). |
| **IT Component** | `PROVIDED_BY` | **Provider** | **M:1** | `PROVIDES_TECH` | Vendor Management. |
| **IT Component** | `CATEGORIZED_BY` | **Tech Category** | **M:1** | `CLASSIFIES` | Tech Radar Grouping. |

---

## 3. Graph Constraints & logic

### 3.1 The Acyclic Hierarchy Check

**Scenario:** A user tries to make "Level 3 Cap" the parent of "Level 1 Cap."
**Risk:** This creates an infinite loop in the Landscape Report (Treemap), causing the browser/server to crash.
**Implementation (Rust):**
Before creating any `PARENT_OF` edge:

1. Run a Cypher query: `MATCH path = (Target)-[:PARENT_OF*]->(Source) RETURN path`
2. If a path exists, **Reject** the request with error: *"Circular Dependency Detected."*

### 3.2 Orphan Management (Cascading Logic)

**Scenario:** An Application is deleted.
**Rule:**

1. **Interfaces:** Must be deleted (Cascade Delete). An API endpoint cannot exist without the App that provides it.
2. **IT Components:** Do **NOT** delete. The Server might be supporting other Apps.
3. **Business Capabilities:** Do **NOT** delete. The Capability still exists, it is just unsupported now.

### 3.3 The "Time Machine" Query Logic

When a user views the "Landscape as of Jan 1, 2026," the backend must filter relationships.

**Standard Query Pattern:**

```cypher
MATCH (app:Application)-[r:SUPPORTS]->(cap:BusinessCapability)
WHERE
  (r.valid_from IS NULL OR r.valid_from <= date($target_date))
  AND
  (r.valid_to IS NULL OR r.valid_to >= date($target_date))
RETURN app, cap

```

### 3.4 Interdependency Calculation (Degree Centrality)

This logic feeds the **BIA Engine**.

**Metric:** `Fan-In Degree`
**Definition:** Count of incoming `RELIES_ON` + `CONSUMES` edges.
**Usage:**

* High Fan-In (> 50)  **Tier 1 Criticality Bonus**.
* Low Fan-In (< 5)  **Candidate for Decommissioning** (No one uses it).

---
