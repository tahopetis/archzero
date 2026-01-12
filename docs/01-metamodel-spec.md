---

# Appendix A: Arc Zero Metamodel Specification

**Version:** 1.0
**Compliance:** LeanIX v4 Compatible

## 1. Global Definitions

### 1.1 The "Card" Entity

In Arc Zero, every architectural object is referred to as a **Card**.

* **Database Table:** `cards`
* **Identification:** Every Card has a globally unique `UUID` and a `name` that must be unique *within its Type*.

### 1.2 Global Attributes (Tier 1 - SQL)

These attributes exist on **every single Card** in the system. They are stored as dedicated SQL columns in PostgreSQL for maximum indexing performance and are used in all global filters (e.g., "Show me all Active cards").

| Attribute Key | SQL Data Type | Validation Rule | Description |
| --- | --- | --- | --- |
| `id` | `UUID` | Primary Key | System generated unique identifier. |
| `name` | `VARCHAR(255)` | Unique per `type` | The display name (e.g., "Salesforce CRM"). |
| `type` | `VARCHAR(50)` | Enum (See Sec 2) | The Metamodel Class (e.g., "Application"). |
| `description` | `TEXT` | Max 2000 chars | Rich text summary of the card. |
| `tags` | `VARCHAR[]` | Array | Folksonomy labels (e.g., "Cloud-First", "2026-Strategy"). |
| `quality_score` | `INT` | 0 - 100 | Auto-calculated metric based on field completeness. |
| `created_at` | `TIMESTAMPTZ` | - | Audit timestamp. |
| `updated_at` | `TIMESTAMPTZ` | - | Audit timestamp. |

### 1.3 Lifecycle Dimensions (Tier 1 - SQL)

Every Card supports a standard lifecycle timeline. This is critical for the **Roadmap (Time Machine)** visualization.

| Attribute Key | SQL Data Type | Logic / Constraint | Description |
| --- | --- | --- | --- |
| `lifecycle_plan` | `DATE` | - | Start of planning/ideation phase. |
| `lifecycle_phase_in` | `DATE` |  Plan | Start of implementation/deployment. |
| `lifecycle_active` | `DATE` |  Phase In | Go-live date (Production). |
| `lifecycle_phase_out` | `DATE` |  Active | Start of decommissioning phase. |
| `lifecycle_eol` | `DATE` |  Phase Out | End of life (Archived/Deleted). |

---

## 2. Card Definitions (By Layer)

This section defines the specific Card Types.

* **Strict Attributes** are stored in SQL.
* **Flexible Attributes** are stored in the `attributes` JSONB column.

### Layer A: Strategy & Business

*Defines "What" the business does and "Why".*

#### A.1 Business Capability

* **Definition:** A functional building block of the business (e.g., "Recruitment", "Logistics", "Payment Processing").
* **Purpose:** The anchor for the **Landscape Heatmap**.
* **Attributes:**
* **JSONB:** `maturity_level` (1-5), `strategic_importance` (High/Med/Low).
* **JSONB:** `differentiation` (Commodity vs. Innovation).



#### A.2 Objective

* **Definition:** A strategic goal or target (e.g., "Reduce IT Costs by 10%").
* **Attributes:**
* **JSONB:** `status` (On Track, At Risk, Delayed), `progress_pct` (0-100).
* **JSONB:** `target_date`, `owner` (Reference to User).



#### A.3 Organization

* **Definition:** A team, department, legal entity, or 3rd party vendor.
* **Attributes:**
* **JSONB:** `org_type` (Department, Subsidiary, Vendor).
* **JSONB:** `cost_center_code` (e.g., "CC-901"), `location` (Country/City).



---

### Layer B: Application

*Defines the "Logical" software systems. This is the core of the metamodel.*

#### B.1 Application

* **Definition:** A deployable software solution (e.g., "SAP S/4HANA", "Jira", "Custom Portal").
* **Purpose:** The primary object for **Portfolio Analysis (TIME)** and **6R Modernization**.
* **Strict Attributes (SQL):**
* `functional_fit` (Enum: 1-4) - See Section 3.
* `technical_fit` (Enum: 1-4) - See Section 3.
* `business_criticality` (Enum: Tier 1-4) - See Section 3.


* **Flexible Attributes (JSONB):**
* `hosting_type` (SaaS, PaaS, IaaS, On-Premise).
* `data_classification` (Public, Internal, Confidential, Restricted).
* `authentication_method` (SSO, LDAP, Local).
* `financials` (Object containing estimated costs).



#### B.2 Interface

* **Definition:** A connection point or data flow between applications.
* **Purpose:** Visualizing data lineage and integration complexity.
* **Attributes:**
* **JSONB:** `interface_type` (REST API, SOAP, GraphQL, Batch File).
* **JSONB:** `frequency` (Real-time, Hourly, Daily).
* **JSONB:** `data_format` (JSON, XML, CSV).



#### B.3 Data Object

* **Definition:** A business concept representing data (e.g., "Customer Record", "Invoice", "Employee ID").
* **Attributes:**
* **JSONB:** `sensitivity` (GDPR, PII, PCI-DSS).
* **JSONB:** `data_steward` (Person responsible).



---

### Layer C: Technology

*Defines the "Physical" implementation.*

#### C.1 IT Component

* **Definition:** A specific technology asset (Software, Hardware, Service).
* **Purpose:** Tracking Obsolescence Risk and TCO.
* **Attributes:**
* **JSONB:** `category` (Software, Hardware, Service).
* **JSONB:** `vendor` (String or Link to Provider).
* **JSONB:** `version` (e.g., "v14.2").
* **JSONB:** `license_model` (Open Source, Per Core, Per User).
* **JSONB:** `vendor_support_eol` (Date) - *Critical for Risk Reports*.



#### C.2 Tech Category

* **Definition:** A classification taxonomy (e.g., "Database > Relational", "Compute > Container").
* **Purpose:** Grouping components in the **Tech Radar**.
* **Attributes:**
* **JSONB:** `color_code` (Hex string for radar visualization).



#### C.3 Platform

* **Definition:** A logical grouping of IT Components (e.g., "AWS Landing Zone", "Kubernetes Cluster prod-01").
* **Attributes:**
* **JSONB:** `owner_team`, `region`.



---

## 3. Standard Enums (Reference Data)

These enums are enforced by the application logic to ensuring consistent scoring across the enterprise.

### 3.1 Application Scoring (The 1-4 Scale)

*Used for `functional_fit` and `technical_fit`.*

1. **Unreasonable (1):** Needs immediate replacement. Creates massive risk or friction.
2. **Insufficient (2):** Lacking key features or stability. Painful to manage.
3. **Appropriate (3):** Meets business requirements. Standard operation.
4. **Perfect (4):** Best in class. Strategic differentiator.

### 3.2 Business Criticality (The Tiers)

*Derived from the BIA Engine.*

1. **Tier 1: Mission Critical:**
* **Impact:** Catastrophic (Legal/Safety/Major Financial).
* **Target:** 99.99% Uptime, RTO < 1 Hour.


2. **Tier 2: Business Critical:**
* **Impact:** Major (Significant Financial/Reputation).
* **Target:** 99.9% Uptime, RTO < 4 Hours.


3. **Tier 3: Operational:**
* **Impact:** Moderate (Efficiency loss).
* **Target:** 99.5% Uptime, RTO < 24 Hours.


4. **Tier 4: Administrative:**
* **Impact:** Minor (Internal inconvenience).
* **Target:** Best Effort.



---
