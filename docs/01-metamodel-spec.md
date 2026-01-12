---

# Appendix A: Arc Zero Metamodel Specification

**Version:** 2.0
**Compliance:** LeanIX v4 Compatible + Extended EA Governance
**Last Updated:** January 13, 2026

---

## 1. Global Definitions

### 1.1 The "Card" Entity

In Arc Zero, every architectural object is referred to as a **Card**.

- **Database Table:** `cards`
- **Identification:** Every Card has a globally unique `UUID` and a `name` that must be unique *within its Type*.
- **Soft Delete:** Cards are never physically deleted. The `deleted_at` timestamp marks soft deletion.

### 1.2 Global Attributes (Tier 1 - SQL)

These attributes exist on **every single Card** in the system. They are stored as dedicated SQL columns in PostgreSQL for maximum indexing performance and are used in all global filters (e.g., "Show me all Active cards").

| Attribute Key | SQL Data Type | Validation Rule | Description | Index Type |
|--------------|---------------|-----------------|-------------|------------|
| `id` | `UUID` | Primary Key | System generated unique identifier. | B-tree (PK) |
| `name` | `VARCHAR(255)` | Unique per `type` | The display name (e.g., "Salesforce CRM"). | B-tree |
| `type` | `VARCHAR(50)` | Enum (See Sec 2) | The Metamodel Class (e.g., "Application"). | B-tree |
| `description` | `TEXT` | Max 2000 chars | Rich text summary of the card. | - |
| `tags` | `VARCHAR[]` | Array | Folksonomy labels (e.g., "Cloud-First", "2026-Strategy"). | GIN |
| `quality_score` | `INT` | 0 - 100 | Auto-calculated metric based on field completeness. | B-tree |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Audit timestamp (creation). | - |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Audit timestamp (last modification). | - |
| `deleted_at` | `TIMESTAMPTZ` | NULL | Soft delete marker. | B-tree |

**Quality Score Calculation:**
```rust
// Pseudocode
quality_score = (
  (filled_sql_fields / total_sql_fields) * 0.5 +
  (filled_jsonb_required_fields / total_jsonb_required_fields) * 0.5
) * 100
```

---

### 1.3 Lifecycle Dimensions (Tier 1 - SQL)

Every Card supports a standard lifecycle timeline. This is critical for the **Roadmap (Time Machine)** visualization.

| Attribute Key | SQL Data Type | Logic / Constraint | Description |
|--------------|---------------|-------------------|-------------|
| `lifecycle_plan` | `DATE` | - | Start of planning/ideation phase. |
| `lifecycle_phase_in` | `DATE` | >= `plan` | Start of implementation/deployment. |
| `lifecycle_active` | `DATE` | >= `phase_in` | Go-live date (Production). |
| `lifecycle_phase_out` | `DATE` | >= `active` | Start of decommissioning phase. |
| `lifecycle_eol` | `DATE` | >= `phase_out` | End of life (Archived/Deleted). |

**Database Constraint:**
```sql
ALTER TABLE cards ADD CONSTRAINT check_lifecycle_sequence CHECK (
  lifecycle_plan IS NULL OR
  lifecycle_phase_in IS NULL OR
  lifecycle_phase_in >= lifecycle_plan
) AND (
  lifecycle_active IS NULL OR
  lifecycle_active >= lifecycle_phase_in
) AND (
  lifecycle_phase_out IS NULL OR
  lifecycle_phase_out >= lifecycle_active
) AND (
  lifecycle_eol IS NULL OR
  lifecycle_eol >= lifecycle_phase_out
);
```

---

### 1.4 Field Placement Decision Criteria

**When to Use SQL Column:**
- Field is queried frequently (used in >50% of reports or filters)
- Field requires database-level constraints (NOT NULL, CHECK, UNIQUE)
- Field is part of the standard LeanIX v4 metamodel specification
- Field needs to be indexed for performance (e.g., `name`, `type`)

**When to Use JSONB Attribute:**
- Field is domain-specific or industry-specific (e.g., `regulatory_classification` for healthcare)
- Field might not exist for all instances (e.g., `cloud_provider` only for cloud-hosted apps)
- Field structure might evolve rapidly (e.g., experimental custom fields during pilot)
- Field is user-defined via the Metamodel Editor

**Example Decision:**
```
Question: Should "hosting_type" be SQL or JSONB?
- Used in filters? YES (Cloud vs On-Prem is common filter)
- LeanIX standard? NO
- Domain-specific? YES (IT architecture)
- Decision: JSONB (flexibility > performance for non-standard field)
```

---

### 1.5 Validation Examples

#### Example 1: Required Field Violation

**User Input:**
```json
{
  "type": "Application",
  "name": "MyApp"
  // Missing required JSONB field: hosting_type
}
```

**System Response (HTTP 400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required attribute",
    "field": "attributes.hosting_type",
    "details": {
      "required_by_rule": "metamodel_rule_uuid_123",
      "allowed_values": ["SaaS", "PaaS", "IaaS", "On-Premise"]
    }
  }
}
```

---

#### Example 2: Regex Pattern Mismatch

**User Input:**
```json
{
  "type": "Application",
  "name": "Finance App",
  "attributes": {
    "cost_center": "SALES-001"  // Invalid format
  }
}
```

**Metamodel Rule:**
```json
{
  "card_type": "Application",
  "attribute_key": "cost_center",
  "regex_pattern": "^CC-[A-Z]{2,4}-\\d{2}$"
}
```

**System Response (HTTP 400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Attribute value does not match required pattern",
    "field": "attributes.cost_center",
    "details": {
      "provided_value": "SALES-001",
      "required_pattern": "^CC-[A-Z]{2,4}-\\d{2}$",
      "example_valid_value": "CC-SALES-01"
    }
  }
}
```

---

#### Example 3: Enum Value Violation

**User Input:**
```json
{
  "type": "Application",
  "attributes": {
    "hosting_type": "Hybrid Cloud"  // Not in allowed list
  }
}
```

**System Response (HTTP 400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid enum value",
    "field": "attributes.hosting_type",
    "details": {
      "provided_value": "Hybrid Cloud",
      "allowed_values": ["SaaS", "PaaS", "IaaS", "On-Premise"]
    }
  }
}
```

---

### 1.6 Metamodel Versioning & Migration

**Version Control:**
- Metamodel changes are versioned (e.g., v1.0, v1.1, v2.0)
- Major version (2.0): Breaking changes (removing required fields, changing SQL schema)
- Minor version (1.1): Additive changes (new optional JSONB fields, new Card types)

**Migration Strategy for JSONB Schema Changes:**

#### Scenario A: Adding a New Required JSONB Field

**Example:** Add `data_classification` as required for all Applications.

**Migration Process:**
1. **Add Field as Optional (v1.1):**
   ```sql
   -- No SQL migration needed (JSONB is schemaless)
   INSERT INTO metamodel_rules (card_type, attribute_key, is_required)
   VALUES ('Application', 'data_classification', false);
   ```

2. **Backfill Existing Cards:**
   ```sql
   UPDATE cards
   SET attributes = jsonb_set(
     attributes,
     '{data_classification}',
     '"Internal"'::jsonb,
     true
   )
   WHERE type = 'Application'
   AND attributes->>'data_classification' IS NULL;
   ```

3. **Mark Field as Required (v1.2):**
   ```sql
   UPDATE metamodel_rules
   SET is_required = true
   WHERE card_type = 'Application'
   AND attribute_key = 'data_classification';
   ```

---

#### Scenario B: Renaming a JSONB Field

**Example:** Rename `hosting_type` to `deployment_model`.

**Migration Process:**
1. **Dual-Write Period (v1.1):** Accept both old and new field names.
   ```rust
   // Backend logic
   let deployment_model = card.attributes
       .get("deployment_model")
       .or_else(|| card.attributes.get("hosting_type"));  // Fallback
   ```

2. **Migrate Data:**
   ```sql
   UPDATE cards
   SET attributes = attributes - 'hosting_type' || 
                    jsonb_build_object('deployment_model', attributes->'hosting_type')
   WHERE type = 'Application'
   AND attributes ? 'hosting_type';
   ```

3. **Deprecate Old Field (v2.0):**
   ```sql
   DELETE FROM metamodel_rules
   WHERE attribute_key = 'hosting_type';
   ```

---

#### Scenario C: Removing a Card Type

**Example:** Deprecate the `Initiative` card type.

**Migration Process:**
1. **Mark as Deprecated (v1.1):**
   ```sql
   UPDATE cards
   SET tags = array_append(tags, 'DEPRECATED')
   WHERE type = 'Initiative';
   ```

2. **Prevent New Creations:**
   ```rust
   // Backend validation
   if card_type == "Initiative" {
       return Err("Card type 'Initiative' is deprecated. Use 'Project' instead.");
   }
   ```

3. **Force Migration or Archive (v2.0):**
   ```sql
   -- Option A: Convert to new type
   UPDATE cards
   SET type = 'Project'
   WHERE type = 'Initiative';

   -- Option B: Soft delete
   UPDATE cards
   SET deleted_at = NOW()
   WHERE type = 'Initiative';
   ```

---

## 2. Card Definitions (By Layer)

This section defines the specific Card Types organized by the Enterprise Architecture layer they represent.

**Legend:**
- **SQL Column:** Strict attribute stored in PostgreSQL column (indexed, constrained)
- **JSONB Attribute:** Flexible attribute stored in `attributes` JSONB column

---

### Layer A: Strategy & Business

*Defines "What" the business does and "Why".*

---

#### A.1 Business Capability

**Definition:** A functional building block of the business (e.g., "Recruitment", "Logistics", "Payment Processing").

**Purpose:** The anchor for the **Landscape Heatmap** visualization.

**Cardinality:** Typically 20-100 top-level capabilities per enterprise.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `maturity_level` | JSONB | Integer | Range: 1-5 | `3` (Defined) |
| `target_maturity_level` | JSONB | Integer | Range: 1-5 | `5` (Optimized) |
| `strategic_importance` | JSONB | Enum | High, Medium, Low | `"High"` |
| `differentiation` | JSONB | Enum | Commodity, Parity, Innovation | `"Innovation"` |
| `investment_category` | JSONB | Enum | Invest More, Maintain, Optimize, Divest | `"Invest More"` |
| `redundancy_score` | JSONB | Integer | >= 0 (auto-calc) | `2` (overlapping apps) |
| `business_owner` | JSONB | String | Max 100 chars | `"VP of Sales"` |

**Example Card:**
```json
{
  "id": "cap-001",
  "name": "Customer Relationship Management",
  "type": "BusinessCapability",
  "description": "Manage customer interactions and data throughout lifecycle",
  "attributes": {
    "maturity_level": 3,
    "strategic_importance": "High",
    "differentiation": "Innovation",
    "business_owner": "Chief Commercial Officer"
  }
}
```

---

#### A.2 Objective

**Definition:** A strategic goal or target (e.g., "Reduce IT Costs by 10%", "Achieve SOC 2 Compliance").

**Purpose:** Link initiatives and projects to business outcomes.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `status` | JSONB | Enum | On Track, At Risk, Delayed, Completed | `"On Track"` |
| `progress_pct` | JSONB | Integer | Range: 0-100 | `65` |
| `target_date` | JSONB | Date | ISO 8601 format | `"2026-12-31"` |
| `owner` | JSONB | String | Max 100 chars | `"CTO"` |
| `kpi_metric` | JSONB | String | - | `"IT spend as % of revenue"` |
| `baseline_value` | JSONB | Number | - | `12.5` |
| `target_value` | JSONB | Number | - | `10.0` |

---

#### A.3 Organization

**Definition:** A team, department, legal entity, or 3rd party vendor.

**Purpose:** Track ownership and responsibility for Cards.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `org_type` | JSONB | Enum | Department, Subsidiary, Vendor, Partner | `"Department"` |
| `cost_center_code` | JSONB | String | Regex: `^CC-[A-Z]{2,4}-\d{2}$` | `"CC-SALES-01"` |
| `location` | JSONB | String | Country/City | `"New York, USA"` |
| `headcount` | JSONB | Integer | >= 0 | `45` |
| `budget_annual` | JSONB | Object | `{amount: Number, currency: String}` | `{"amount": 500000, "currency": "USD"}` |

---

### Layer B: Application

*Defines the "Logical" software systems. This is the core of the metamodel.*

---

#### B.1 Application

**Definition:** A deployable software solution (e.g., "SAP S/4HANA", "Jira", "Custom Portal").

**Purpose:** The primary object for **Portfolio Analysis (TIME)** and **6R Modernization**.

**Cardinality:** Typical enterprise has 200-2,000 applications.

**Strict Attributes (SQL):**

| Attribute | SQL Data Type | Validation | Description |
|-----------|---------------|------------|-------------|
| `functional_fit` | `INT` | 1-4 (Enum) | How well app meets business needs (See Section 3.1) |
| `technical_fit` | `INT` | 1-4 (Enum) | Technical quality and maintainability (See Section 3.1) |
| `business_criticality` | `VARCHAR(20)` | Tier 1-4 (Enum) | Derived from BIA Engine (See Section 3.2) |

**Flexible Attributes (JSONB):**

| Attribute | Data Type | Validation | Example |
|-----------|-----------|------------|---------|
| `hosting_type` | Enum | SaaS, PaaS, IaaS, On-Premise | `"SaaS"` |
| `data_classification` | Enum | Public, Internal, Confidential, Restricted | `"Confidential"` |
| `authentication_method` | Enum | SSO, LDAP, Local, API Key | `"SSO"` |
| `pace_layer` | Enum | System of Record, System of Differentiation, System of Innovation | `"System of Differentiation"` |
| `rationalization_score` | Integer | Range: 0-100 (auto-calc) | `72` |
| `rationalization_action` | Enum | Invest, Maintain, Tolerate, Eliminate | `"Invest"` |
| `cloud_readiness_score` | Integer | Range: 0-100 (auto-calc) | `85` |
| `financials` | Object | `{estimated_annual_cost: Number, currency: String}` | `{"estimated_annual_cost": 120000, "currency": "USD"}` |
| `vendor` | String | Max 100 chars | `"Salesforce, Inc."` |
| `version` | String | Semver or freeform | `"v2.3.1"` |
| `users_total` | Integer | >= 0 | `1500` |
| `users_active` | Integer | >= 0, <= users_total | `850` |

**Example Card:**
```json
{
  "id": "app-sf-001",
  "name": "Salesforce CRM",
  "type": "Application",
  "lifecycle_active": "2018-06-15",
  "functional_fit": 4,
  "technical_fit": 3,
  "business_criticality": "Tier 1",
  "quality_score": 92,
  "attributes": {
    "hosting_type": "SaaS",
    "data_classification": "Confidential",
    "authentication_method": "SSO",
    "financials": {
      "estimated_annual_cost": 180000,
      "currency": "USD"
    },
    "vendor": "Salesforce, Inc.",
    "users_total": 1200,
    "users_active": 980
  }
}
```

---

#### B.2 Interface

**Definition:** A connection point or data flow between applications (API, File Transfer, Event Stream).

**Purpose:** Visualizing data lineage and integration complexity.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `interface_type` | JSONB | Enum | REST API, SOAP, GraphQL, Batch File, Event Stream | `"REST API"` |
| `frequency` | JSONB | Enum | Real-time, Hourly, Daily, Weekly, On-Demand | `"Real-time"` |
| `data_format` | JSONB | Enum | JSON, XML, CSV, Parquet, Avro | `"JSON"` |
| `protocol` | JSONB | Enum | HTTPS, SFTP, Kafka, RabbitMQ | `"HTTPS"` |
| `data_volume_daily` | JSONB | String | Freeform (e.g., "10GB", "1M records") | `"500K records"` |

---

#### B.3 Data Object

**Definition:** A business concept representing data (e.g., "Customer Record", "Invoice", "Employee ID").

**Purpose:** Data lineage tracking and GDPR compliance.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `sensitivity` | JSONB | Enum (Multi-select) | GDPR, PII, PCI-DSS, PHI, Public | `["GDPR", "PII"]` |
| `data_steward` | JSONB | String | Max 100 chars | `"Chief Data Officer"` |
| `retention_period` | JSONB | String | Freeform | `"7 years"` |
| `encryption_required` | JSONB | Boolean | - | `true` |

---

### Layer C: Technology

*Defines the "Physical" implementation.*

---

#### C.1 IT Component

**Definition:** A specific technology asset (Software, Hardware, Service).

**Purpose:** Tracking Obsolescence Risk and TCO.

**Cardinality:** 500-10,000 components in large enterprises.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `category` | JSONB | Enum | Software, Hardware, Service, Network | `"Software"` |
| `sub_category` | JSONB | String | Freeform | `"Database"` |
| `vendor` | JSONB | String | Max 100 chars | `"Oracle Corporation"` |
| `version` | JSONB | String | Freeform | `"19c Enterprise"` |
| `license_model` | JSONB | Enum | Open Source, Per Core, Per User, Subscription | `"Per Core"` |
| `technology_lifecycle_phase` | JSONB | Enum | Emerging, Growth, Mature, Sustain, Sunset, Retired | `"Mature"` |
| `radar_position` | JSONB | Object | `{quadrant: String, ring: String}` | `{"quadrant": "Languages", "ring": "Adopt"}` |
| `vendor_support_eol` | JSONB | Date | ISO 8601 | `"2028-12-31"` |
| `eol_risk_level` | JSONB | Enum (Auto-calc) | Low, Medium, High, Critical | `"High"` (if EOL < 1 year) |

**Example:**
```json
{
  "id": "comp-db-001",
  "name": "Production Oracle Database Cluster",
  "type": "ITComponent",
  "attributes": {
    "category": "Software",
    "sub_category": "Database",
    "vendor": "Oracle Corporation",
    "version": "19c Enterprise",
    "license_model": "Per Core",
    "vendor_support_eol": "2028-12-31",
    "eol_risk_level": "Low"
  }
}
```

---

#### C.2 Tech Category

**Definition:** A classification taxonomy (e.g., "Database > Relational", "Compute > Container").

**Purpose:** Grouping components in the **Tech Radar** visualization.

**Attributes:**

| Attribute | Type | Data Type | Example |
|-----------|------|-----------|---------|
| `color_code` | JSONB | Hex String | `"#3498db"` |
| `icon` | JSONB | String (URL or icon name) | `"database"` |

---

#### C.3 Platform

**Definition:** A logical grouping of IT Components (e.g., "AWS Production Landing Zone", "Kubernetes Cluster prod-01").

**Attributes:**

| Attribute | Type | Data Type | Example |
|-----------|------|-----------|---------|
| `owner_team` | JSONB | String | `"Cloud Platform Team"` |
| `region` | JSONB | String | `"us-east-1"` |
| `environment` | JSONB | Enum | Production, Staging, Development, DR | `"Production"` |

---

### Layer D: Governance & Compliance

*Defines architecture governance framework, standards, and compliance tracking.*

---

#### D.1 Architecture Principle

**Definition:** A guideline that constrains IT decision-making (e.g., "Cloud-First", "API-First Design").

**Purpose:** Guides technology choices and architecture decisions across the enterprise.

**Cardinality:** 10-30 principles per enterprise.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `statement` | JSONB | Text | Max 500 chars | `"Prefer cloud-native SaaS solutions over on-premise deployments"` |
| `rationale` | JSONB | Text | Max 2000 chars | `"Reduces maintenance overhead and improves scalability"` |
| `implications` | JSONB | Text Array | List of implications | `["All new apps must be cloud-native", "Exceptions require ARB approval"]` |
| `owner` | JSONB | String | Max 100 chars | `"Chief Technology Officer"` |
| `category` | JSONB | Enum | Strategic, Business, Technical, Data | `"Technical"` |
| `adherence_rate` | JSONB | Integer | 0-100 (auto-calc) | `78` |

**Example Card:**
```json
{
  "id": "princ-001",
  "name": "Cloud-First Strategy",
  "type": "ArchitecturePrinciple",
  "description": "Prefer cloud solutions for all new IT investments",
  "attributes": {
    "statement": "Prefer cloud-native SaaS solutions over on-premise deployments",
    "rationale": "Reduces maintenance overhead and improves scalability",
    "implications": [
      "All new apps must be cloud-native",
      "Exceptions require ARB approval",
      "Migration plan for legacy on-premise systems"
    ],
    "owner": "Chief Technology Officer",
    "category": "Strategic",
    "adherence_rate": 78
  }
}
```

---

#### D.2 Technology Standard

**Definition:** Approved technology with lifecycle status (e.g., "PostgreSQL for databases", "React for frontends").

**Purpose:** Technology Radar and technology debt tracking.

**Cardinality:** 50-200 standards per enterprise.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `category` | JSONB | String | - | `"Relational Databases"` |
| `status` | JSONB | Enum | Adopt, Trial, Assess, Hold, Sunset, Banned | `"Adopt"` |
| `sunset_date` | JSONB | Date | ISO 8601 | `"2028-12-31"` |
| `replacement_id` | JSONB | UUID | References another standard | `"std-postgres-uuid"` |
| `rationale` | JSONB | Text | Max 2000 chars | `"Industry-standard with excellent ecosystem"` |

**Example Card:**
```json
{
  "id": "std-001",
  "name": "PostgreSQL",
  "type": "TechnologyStandard",
  "description": "Standard relational database for all new applications",
  "attributes": {
    "category": "Relational Databases",
    "status": "Adopt",
    "sunset_date": null,
    "rationale": "Industry-standard with excellent ecosystem, ACID compliance, and extensions"
  }
}
```

---

#### D.3 Architecture Policy

**Definition:** Enforceable rule with automated checking (e.g., "All Tier 1 apps must be multi-region").

**Purpose:** Automated governance and compliance checking.

**Cardinality:** 20-50 policies per enterprise.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `rule_json` | JSONB | Object | JSON schema for rule | `{"field": "business_criticality", "operator": "eq", "value": "Tier 1", "requires": ["multi_region", "disaster_recovery_plan"]}` |
| `severity` | JSONB | Enum | Critical, High, Medium, Low | `"Critical"` |
| `enforcement_mode` | JSONB | Enum | Blocking, Warning | `"Blocking"` |

**Example Card:**
```json
{
  "id": "policy-001",
  "name": "Tier 1 High Availability Policy",
  "type": "ArchitecturePolicy",
  "description": "All Tier 1 applications must have multi-region deployment",
  "attributes": {
    "rule_json": {
      "if": {"business_criticality": "Tier 1"},
      "then": {"requires": ["multi_region", "disaster_recovery_plan"]}
    },
    "severity": "Critical",
    "enforcement_mode": "Blocking"
  }
}
```

---

#### D.4 Exception

**Definition:** Approved deviation from standard/policy (e.g., "Legacy app exempt from cloud-first").

**Purpose:** Track policy violations with explicit approval.

**Cardinality:** 10-100 active exceptions.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `policy_id` | JSONB | UUID | References Policy | `"policy-001"` |
| `card_id` | JSONB | UUID | References affected Card | `"app-legacy-001"` |
| `justification` | JSONB | Text | Max 2000 chars | `"Vendor does not offer cloud version, migration cost > $500K"` |
| `duration` | JSONB | Enum | 30_days, 60_days, 90_days, Permanent | `"Permanent"` |
| `compensating_controls` | JSONB | Text Array | - | `["Enhanced monitoring", "Quarterly review"]` |
| `status` | JSONB | Enum | Pending, Approved, Rejected, Expired | `"Approved"` |
| `expires_at` | JSONB | Timestamptz | ISO 8601 | `"2027-12-31T23:59:59Z"` |

---

#### D.5 Initiative

**Definition:** Strategic transformation program (e.g., "Cloud Migration 2027", "ERP Consolidation").

**Purpose:** Transformation planning and impact tracking.

**Cardinality:** 10-50 active initiatives.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `type` | JSONB | Enum | Modernization, Migration, Consolidation, New Build, Decommission, Integration | `"Migration"` |
| `strategic_theme` | JSONB | String | Max 100 chars | `"Cloud Transformation"` |
| `budget_total` | JSONB | Number | >= 0 | `5000000` |
| `budget_spent` | JSONB | Number | >= 0, <= budget_total | `1250000` |
| `start_date` | JSONB | Date | ISO 8601 | `"2026-01-01"` |
| `target_end_date` | JSONB | Date | ISO 8601 | `"2027-12-31"` |
| `actual_end_date` | JSONB | Date | ISO 8601, nullable | `null` |
| `owner` | JSONB | String | Max 100 chars | `"VP of Infrastructure"` |
| `status` | JSONB | Enum | Planning, In Progress, On Hold, Completed, Cancelled | `"In Progress"` |
| `health` | JSONB | Enum | On Track, At Risk, Behind Schedule | `"On Track"` |

**Example Card:**
```json
{
  "id": "init-001",
  "name": "Cloud Migration 2027",
  "type": "Initiative",
  "description": "Migrate all Tier 2 applications to AWS cloud infrastructure",
  "attributes": {
    "type": "Migration",
    "strategic_theme": "Cloud Transformation",
    "budget_total": 5000000,
    "budget_spent": 1250000,
    "start_date": "2026-01-01",
    "target_end_date": "2027-12-31",
    "actual_end_date": null,
    "owner": "VP of Infrastructure",
    "status": "In Progress",
    "health": "On Track"
  }
}
```

---

#### D.6 Risk

**Definition:** Architectural risk requiring mitigation (e.g., "Oracle EOL 2028", "Single point of failure").

**Purpose:** Risk register and mitigation tracking.

**Cardinality:** 50-200 open risks.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `description` | JSONB | Text | Max 2000 chars | `"Oracle Database 19c reaches EOL in 2028, no migration plan"` |
| `type` | JSONB | Enum | Security, Compliance, Operational, Financial, Strategic, Reputational | `"Operational"` |
| `likelihood` | JSONB | Integer | Range: 1-5 | `4` |
| `impact` | JSONB | Integer | Range: 1-5 | `5` |
| `risk_score` | JSONB | Integer | 1-25 (auto-calc: likelihood × impact) | `20` |
| `mitigation_plan` | JSONB | Text | Max 5000 chars | `"Migrate to PostgreSQL by 2027-Q4"` |
| `owner` | JSONB | String | Max 100 chars | `"Database Team Lead"` |
| `status` | JSONB | Enum | Open, Mitigated, Accepted, Transferred, Closed | `"Open"` |
| `target_closure_date` | JSONB | Date | ISO 8601 | `"2027-12-31"` |

**Example Card:**
```json
{
  "id": "risk-001",
  "name": "Oracle Database EOL Risk",
  "type": "Risk",
  "description": "Oracle Database 19c reaches EOL in 2028",
  "attributes": {
    "type": "Operational",
    "likelihood": 4,
    "impact": 5,
    "risk_score": 20,
    "mitigation_plan": "Migrate to PostgreSQL by 2027-Q4, budget approved",
    "owner": "Database Team Lead",
    "status": "Open",
    "target_closure_date": "2027-12-31"
  }
}
```

---

#### D.7 Compliance Requirement

**Definition:** Regulatory requirement to track (e.g., GDPR, SOX, HIPAA).

**Purpose:** Compliance tracking and audit preparation.

**Cardinality:** 5-15 requirements per enterprise.

**Attributes:**

| Attribute | Type | Data Type | Validation | Example |
|-----------|------|-----------|------------|---------|
| `framework` | JSONB | String | - | `"GDPR"` |
| `description` | JSONB | Text | Max 2000 chars | `"General Data Protection Regulation compliance for EU citizen data"` |
| `applicable_card_types` | JSONB | String Array | - | `["Application", "DataObject"]` |
| `required_controls` | JSONB | Text Array | - | `["Data encryption at rest", "Data encryption in transit", "Right to erasure"]` |
| `audit_frequency` | JSONB | Enum | Annual, Semi-Annual, Quarterly, Monthly | `"Annual"` |

**Example Card:**
```json
{
  "id": "comp-001",
  "name": "GDPR Compliance",
  "type": "ComplianceRequirement",
  "description": "General Data Protection Regulation compliance",
  "attributes": {
    "framework": "GDPR",
    "description": "General Data Protection Regulation compliance for EU citizen data",
    "applicable_card_types": ["Application", "DataObject"],
    "required_controls": [
      "Data encryption at rest",
      "Data encryption in transit",
      "Right to erasure",
      "Data protection impact assessment"
    ],
    "audit_frequency": "Annual"
  }
}
```

---

## 3. Standard Enums (Reference Data)

These enums are enforced by the application logic to ensure consistent scoring across the enterprise.

### 3.1 Application Scoring (The 1-4 Scale)

*Used for `functional_fit` and `technical_fit` SQL columns.*

| Score | Label | Functional Fit Criteria | Technical Fit Criteria |
|-------|-------|------------------------|----------------------|
| **1** | **Unreasonable** | Lacks critical features; creates business risk | Legacy tech; high technical debt; frequent outages |
| **2** | **Insufficient** | Missing key features; workarounds required | Aging tech; difficult to maintain; moderate stability issues |
| **3** | **Appropriate** | Meets requirements; standard operation | Modern tech; well-maintained; stable |
| **4** | **Perfect** | Exceeds requirements; strategic differentiator | Best-in-class tech; highly maintainable; exceptional reliability |

**Usage in Reports:**
- TIME Matrix: X-axis = Technical Fit, Y-axis = Functional Fit
- Color coding: 1 = Red (🔴), 2 = Orange (🟠), 3 = Yellow (🟡), 4 = Green (🟢)

---

### 3.2 Business Criticality (The Tiers)

*Derived from the BIA Engine. Stored in `business_criticality` SQL column.*

| Tier | Label | Impact Description | SLA Targets | Example Applications |
|------|-------|-------------------|-------------|---------------------|
| **Tier 1** | **Mission Critical** | Catastrophic (Legal/Safety/Major Financial) | 99.99% Uptime, RTO < 1 Hour, RPO < 15 min | Trading systems, Patient records, 911 dispatch |
| **Tier 2** | **Business Critical** | Major (Significant Financial/Reputation) | 99.9% Uptime, RTO < 4 Hours, RPO < 1 hour | ERP, CRM, E-commerce platform |
| **Tier 3** | **Operational** | Moderate (Efficiency loss) | 99.5% Uptime, RTO < 24 Hours, RPO < 4 hours | HR portal, Document management |
| **Tier 4** | **Administrative** | Minor (Internal inconvenience) | Best Effort, RTO < 1 Week | Meeting room booking, Employee directory |

**Automatic Re-calculation:**
- Triggered when: BIA input values change, Graph topology changes (Fan-In degree)
- Frequency: Real-time on update, Nightly batch for all cards

---

## 4. Metamodel Extension Guide

**Adding a New Card Type (Admin Guide):**

1. **Define the Card Type:**
   ```sql
   -- Add to allowed types enum (migration)
   ALTER TYPE card_type_enum ADD VALUE 'DataCenter';
   ```

2. **Add Metamodel Rules:**
   ```sql
   INSERT INTO metamodel_rules (card_type, attribute_key, is_required, allowed_values)
   VALUES
     ('DataCenter', 'location', true, ARRAY['US', 'EU', 'APAC']),
     ('DataCenter', 'tier_level', true, ARRAY['Tier 1', 'Tier 2', 'Tier 3']),
     ('DataCenter', 'power_capacity_kw', false, NULL);
   ```

3. **Update Frontend Form Generator:**
   - UI will auto-generate form fields based on metamodel rules
   - No code changes required if using dynamic forms

4. **Document the New Type:**
   - Add to this specification document
   - Update user guide with examples

---

## Appendix: SQL Schema Reference

**Core Table:**
```sql
CREATE TABLE cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    
    -- Lifecycle (SQL)
    lifecycle_plan DATE,
    lifecycle_phase_in DATE,
    lifecycle_active DATE,
    lifecycle_phase_out DATE,
    lifecycle_eol DATE,
    
    -- Quality & Metadata
    quality_score INT DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
    tags TEXT[] DEFAULT '{}',
    description TEXT CHECK (char_length(description) <= 2000),
    
    -- Application-specific SQL columns
    functional_fit INT CHECK (functional_fit BETWEEN 1 AND 4),
    technical_fit INT CHECK (technical_fit BETWEEN 1 AND 4),
    business_criticality VARCHAR(20),
    
    -- Flexible Attributes
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_name_per_type UNIQUE (name, type)
);
```

**See:** [04-sql-ddl.md](docs/04-sql-ddl.md) for complete DDL.

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.0.1 | 2026-01-12 | Added validation examples, versioning strategy, field placement criteria | Documentation Team |
| 2.0 | 2026-01-13 | **MAJOR UPDATE**: Added Layer D (Governance & Compliance) with 7 new Card types (Architecture Principle, Technology Standard, Architecture Policy, Exception, Initiative, Risk, Compliance Requirement). Added missing attributes to Business Capability (target_maturity_level, investment_category, redundancy_score), Application (pace_layer, rationalization_score, rationalization_action, cloud_readiness_score), and IT Component (technology_lifecycle_phase, radar_position). | Documentation Team |
