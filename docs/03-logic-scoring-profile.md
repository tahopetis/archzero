---

# Appendix C: Logic & Scoring Profiles

**Version:** 1.0

## 1. Business Impact Analysis (BIA) Engine

**Purpose:** To automatically calculate the `Business Criticality` Tier and `Target RTO/RPO` for an Application based on user assessment.

### 1.1 Profile Configuration

Admins can define a **Scoring Profile** (stored in `scoring_profiles` table).

| Setting Key | Options | Description |
| --- | --- | --- |
| `aggregation_strategy` | `MAX` (High Water Mark)<br>

<br>`WEIGHTED_AVG`<br>

<br>`SUM` | How to combine scores from different dimensions (Financial, Legal, Safety). |
| `topology_mode` | `IGNORE`<br>

<br>`BOOST`<br>

<br>`WEIGHTED` | How the Graph Interdependency score affects the final result. |
| `topology_threshold_high` | Integer (Default: 50) | The number of incoming connections required to trigger "High Dependency" status. |

### 1.2 The Algorithm (Pseudocode)

```rust
// Step 1: Calculate Base Impact Score
let base_score = match profile.aggregation_strategy {
    "MAX" => inputs.max(), // Safety-First Logic
    "WEIGHTED_AVG" => (inputs * weights).sum() / weights.sum(), // Balanced Logic
    "SUM" => inputs.sum()  // Risk Accumulation Logic
};

// Step 2: Calculate Topology Score (From Neo4j)
let fan_in = graph.count_incoming_edges(card_id);
let topology_score = if fan_in > profile.topology_threshold_high { 4.0 } else { 1.0 };

// Step 3: Final Criticality Calculation
let final_score = match profile.topology_mode {
    "IGNORE" => base_score,
    "BOOST" => if topology_score == 4.0 { base_score + 1.0 } else { base_score },
    "WEIGHTED" => (base_score * 0.8) + (topology_score * 0.2) // Example weight
};

// Step 4: Map to Tier
return match final_score {
    s if s >= 4.0 => "Tier 1: Mission Critical",
    s if s >= 3.0 => "Tier 2: Business Critical",
    s if s >= 2.0 => "Tier 3: Operational",
    _ => "Tier 4: Administrative"
};

```

---

## 2. 6R Migration Decision Engine

**Purpose:** To suggest a modernization strategy (`Retire`, `Rehost`, `Refactor`, etc.) based on the Card's attributes.

### 2.1 Rule Structure

Migration logic is stored as a **Decision Tree** in JSONB. The engine evaluates rules in order of `priority`. The first match wins.

**Rule Schema:**

```json
{
  "profile_name": "Cloud First Strategy",
  "rules": [
    {
      "priority": 10,
      "strategy": "RETIRE",
      "conditions": [
        { "field": "technical_fit", "op": "<", "val": 2 },
        { "field": "business_criticality", "op": "<", "val": 2 }
      ]
    },
    {
      "priority": 20,
      "strategy": "REPURCHASE",
      "conditions": [
        { "field": "attributes.is_commodity", "op": "==", "val": true },
        { "field": "technical_fit", "op": "<", "val": 3 }
      ]
    }
    // ... more rules
  ]
}

```

### 2.2 Default Profiles

Arc Zero ships with two default profiles to support different market segments.

#### Profile A: Cloud First (Standard)

* **Goal:** Move everything to Public Cloud (AWS/Azure).
* **Logic:**
* If `Cloud_Ready` & `High Value`  **Refactor** (Cloud Native).
* If `Cloud_Ready` & `Standard App`  **Replatform** (Managed Services).
* Else  **Rehost** (Lift & Shift).



#### Profile B: On-Premise Modernization

* **Goal:** Optimize the Private Data Center.
* **Logic:**
* If `Legacy Hardware`  **Virtualize** (Rehost to HCI).
* If `Monolith` & `High Value`  **Containerize** (Refactor to OpenShift).
* If `Old Database`  **Standardize** (Replatform to Corporate Standard DB).



---

## 3. TCO Allocation Engine (Estimated Cost)

**Purpose:** To provide a "Rough Order of Magnitude" budget roll-up by attributing infrastructure costs to applications and capabilities.

### 3.1 The "Reverse Waterfall" Logic

Costs flow **UP** the graph.
`Provider`  `IT Component`  `Application`  `Business Capability`.

### 3.2 Allocation Strategies

#### Strategy A: Even Split (Default)

* **Logic:** Divide the Parent Cost by the number of Children.
* **Formula:** 
* **Use Case:** Shared infrastructure (e.g., a Network Switch used by 50 apps).

#### Strategy B: Manual Percentage (Precision)

* **Logic:** Use the `allocation_pct` property on the `RELIES_ON` edge.
* **Formula:** 
* **Use Case:** A Database Cluster where App A uses 90% of resources and App B uses 10%.

### 3.3 Integration with Pustaka

The **Base Costs** (at the bottom of the waterfall) are not entered manually. They are synced from **Pustaka**.

* **Sync Logic:**
* `Pustaka.Asset.monthly_cost`  `Nexus.Card.attributes.financials.estimated_annual_cost` ().


* **Currency:** All costs are normalized to a Base Currency (e.g., USD) during the Pustaka sync to simplify aggregation math.

