---

# Appendix C: Logic & Scoring Profiles

**Version:** 1.0  
**Last Updated:** January 12, 2026

---

## 1. Business Impact Analysis (BIA) Engine

**Purpose:** To automatically calculate the `Business Criticality` Tier (1-4) and `Target RTO/RPO` for an Application based on multi-dimensional impact assessment.

---

### 1.1 Profile Configuration

Admins can define a **Scoring Profile** (stored in `scoring_profiles` table).

| Setting Key | Options | Description | Default |
|-------------|---------|-------------|---------|
| `aggregation_strategy` | `MAX` (High Water Mark)<br>`WEIGHTED_AVG`<br>`SUM` | How to combine scores from different dimensions (Financial, Legal, Safety). | `MAX` |
| `topology_mode` | `IGNORE`<br>`BOOST`<br>`WEIGHTED` | How the Graph Interdependency score affects the final result. | `BOOST` |
| `topology_threshold_high` | Integer | The number of incoming connections required to trigger "High Dependency" status. | `50` |
| `topology_threshold_medium` | Integer | Threshold for "Medium Dependency" classification. | `20` |
| `dimension_weights` | Object | Custom weights for WEIGHTED_AVG mode (e.g., `{safety: 1.0, financial: 0.5}`). | Equal weights |

**Example Profile (Healthcare Regulatory):**
```json
{
  "id": "profile-healthcare-001",
  "name": "Healthcare - Patient Safety First",
  "is_active": true,
  "config_payload": {
    "aggregation_strategy": "MAX",
    "topology_mode": "BOOST",
    "topology_threshold_high": 30,
    "topology_threshold_medium": 15,
    "dimension_weights": {
      "patient_safety": 1.0,
      "regulatory_impact": 1.0,
      "financial_impact": 0.5,
      "operational_impact": 0.7
    }
  }
}
```

---

### 1.2 The Algorithm (Detailed Pseudocode)

```rust
// Input: Impact scores from 1-4 for each dimension
struct BIAInput {
    financial_impact: Option<f32>,      // 1-4 scale
    legal_impact: Option<f32>,          // 1-4 scale
    safety_impact: Option<f32>,         // 1-4 scale
    operational_impact: Option<f32>,    // 1-4 scale
    reputational_impact: Option<f32>,   // 1-4 scale
}

fn calculate_criticality(
    inputs: BIAInput,
    profile: ScoringProfile,
    fan_in: u32  // From Neo4j graph query
) -> String {
    // Step 1: Calculate Base Impact Score
    let base_score = match profile.aggregation_strategy {
        AggregationStrategy::Max => {
            // Safety-First Logic (Healthcare, Aviation, etc.)
            // The HIGHEST impact in ANY dimension determines criticality
            vec![
                inputs.financial_impact,
                inputs.legal_impact,
                inputs.safety_impact,
                inputs.operational_impact,
                inputs.reputational_impact
            ]
            .into_iter()
            .filter_map(|x| x)  // Remove None values
            .max_by(|a, b| a.partial_cmp(b).unwrap())
            .unwrap_or(1.0)
        },
        
        AggregationStrategy::WeightedAvg => {
            // Balanced Logic (Financial Services, Retail)
            // Weighted average of all dimensions
            let weights = &profile.dimension_weights;
            let mut total_weighted = 0.0;
            let mut total_weight = 0.0;
            
            if let Some(val) = inputs.financial_impact {
                total_weighted += val * weights.get("financial_impact").unwrap_or(&1.0);
                total_weight += weights.get("financial_impact").unwrap_or(&1.0);
            }
            if let Some(val) = inputs.safety_impact {
                total_weighted += val * weights.get("safety_impact").unwrap_or(&1.0);
                total_weight += weights.get("safety_impact").unwrap_or(&1.0);
            }
            // ... repeat for other dimensions
            
            if total_weight > 0.0 {
                total_weighted / total_weight
            } else {
                1.0  // Default to lowest tier if no data
            }
        },
        
        AggregationStrategy::Sum => {
            // Risk Accumulation Logic (Rare)
            // Sum all impacts (cap at 4.0)
            vec![
                inputs.financial_impact,
                inputs.legal_impact,
                inputs.safety_impact,
                inputs.operational_impact,
                inputs.reputational_impact
            ]
            .into_iter()
            .filter_map(|x| x)
            .sum::<f32>()
            .min(4.0)
        }
    };

    // Step 2: Calculate Topology Score (From Neo4j)
    let topology_score = if fan_in >= profile.topology_threshold_high {
        4.0  // Critical dependency
    } else if fan_in >= profile.topology_threshold_medium {
        3.0  // High dependency
    } else if fan_in > 5 {
        2.0  // Moderate dependency
    } else {
        1.0  // Low dependency
    };

    // Step 3: Final Criticality Calculation
    let final_score = match profile.topology_mode {
        TopologyMode::Ignore => {
            // Topology doesn't affect score
            base_score
        },
        
        TopologyMode::Boost => {
            // If topology is high, escalate tier (but don't downgrade)
            if topology_score >= 4.0 && base_score < 4.0 {
                4.0  // Force to Tier 1
            } else if topology_score >= 3.0 && base_score < 3.0 {
                3.0  // Force to Tier 2
            } else {
                base_score
            }
        },
        
        TopologyMode::Weighted => {
            // Blend base score with topology score
            (base_score * 0.7) + (topology_score * 0.3)
        }
    };

    // Step 4: Map to Criticality Tier
    match final_score {
        s if s >= 4.0 => "Tier 1: Mission Critical",
        s if s >= 3.0 => "Tier 2: Business Critical",
        s if s >= 2.0 => "Tier 3: Operational",
        _ => "Tier 4: Administrative"
    }.to_string()
}
```

---

### 1.3 Edge Case Handling

#### Case 1: No Dimensions Provided

**Input:**
```json
{
  "financial_impact": null,
  "legal_impact": null,
  "safety_impact": null
}
```

**Behavior:**
- **Action:** Return `Tier 4: Administrative` (lowest tier)
- **Reason:** Insufficient data to assess criticality
- **UI Message:** "Complete BIA assessment to calculate accurate criticality"

**Response:**
```json
{
  "criticality_tier": "Tier 4",
  "confidence": "Low",
  "message": "No impact dimensions provided. Default tier assigned.",
  "recommendation": "Complete BIA questionnaire to improve accuracy"
}
```

---

#### Case 2: Partial Dimension Data

**Input:**
```json
{
  "financial_impact": 3.0,
  "legal_impact": null,  // Missing
  "safety_impact": 4.0
}
```

**Behavior:**
- **Aggregation Strategy = MAX:** Use highest provided value (4.0)
- **Aggregation Strategy = WEIGHTED_AVG:** Calculate average using only provided dimensions
- **Confidence Score:** Reduced based on percentage of missing data

**Response:**
```json
{
  "criticality_tier": "Tier 1",
  "confidence": "Medium",
  "base_score": 4.0,
  "dimensions_used": ["financial_impact", "safety_impact"],
  "dimensions_missing": ["legal_impact", "operational_impact"],
  "recommendation": "Provide legal impact assessment for full accuracy"
}
```

---

#### Case 3: Conflicting Signals

**Input:**
```json
{
  "financial_impact": 1.0,  // Very low
  "safety_impact": 4.0      // Very high
}
```

**Aggregation = MAX:**
- **Result:** Tier 1 (Safety dominates)
- **Explanation:** "Even low financial impact, critical safety impact requires Tier 1"

**Aggregation = WEIGHTED_AVG (Financial: 0.8, Safety: 0.2):**
- **Result:** (1.0 * 0.8 + 4.0 * 0.2) / 1.0 = 1.6 → Tier 3
- **Explanation:** "Financial focus reduces overall criticality despite safety concerns"

**UI Display:**
```json
{
  "criticality_tier": "Tier 1",
  "profile_used": "Healthcare - Patient Safety First (MAX mode)",
  "explanation": "Safety impact (4.0) overrides low financial impact (1.0) per MAX aggregation rule",
  "alternative_profiles": [
    {
      "profile": "Financial Services Standard",
      "would_result_in": "Tier 3",
      "note": "Uses weighted average favoring financial impact"
    }
  ]
}
```

---

#### Case 4: Topology Override (High Interdependency)

**Input:**
```json
{
  "base_score": 2.5,   // Would be Tier 3
  "fan_in": 75         // Very high interdependency
}
```

**Topology Mode = BOOST:**
- **Result:** Tier 1 (Forced escalation due to topology)
- **Explanation:** "75 dependent applications create cascading failure risk"

**Response:**
```json
{
  "criticality_tier": "Tier 1",
  "base_tier": "Tier 3",
  "topology_escalation": true,
  "topology_score": 4.0,
  "explanation": "Escalated from Tier 3 to Tier 1 due to high interdependency (75 dependents > threshold 50)",
  "dependent_apps_sample": [
    "Salesforce CRM",
    "HR Portal",
    "Finance Dashboard"
    // ... (show first 10)
  ]
}
```

---

### 1.4 Testing & Validation

**Test Matrix:**

| Scenario | Financial | Legal | Safety | Fan-In | Profile | Expected Tier | Pass/Fail |
|----------|-----------|-------|--------|--------|---------|---------------|-----------|
| **All Critical** | 4 | 4 | 4 | 10 | MAX | Tier 1 | ✅ |
| **Safety Dominates** | 1 | 1 | 4 | 10 | MAX | Tier 1 | ✅ |
| **Balanced Average** | 2 | 3 | 2 | 10 | WEIGHTED_AVG | Tier 2 | ✅ |
| **Topology Boost** | 2 | 2 | 2 | 60 | BOOST | Tier 1 | ✅ |
| **No Data** | null | null | null | 5 | MAX | Tier 4 | ✅ |
| **Partial Data** | 3 | null | null | 10 | WEIGHTED_AVG | Tier 3 | ✅ |

**Automated Test Suite:**
```rust
#[cfg(test)]
mod bia_tests {
    use super::*;

    #[test]
    fn test_max_aggregation_safety_dominates() {
        let input = BIAInput {
            financial_impact: Some(1.0),
            legal_impact: Some(1.0),
            safety_impact: Some(4.0),
            operational_impact: None,
            reputational_impact: None,
        };
        let profile = ScoringProfile {
            aggregation_strategy: AggregationStrategy::Max,
            topology_mode: TopologyMode::Ignore,
            ..Default::default()
        };
        let result = calculate_criticality(input, profile, 10);
        assert_eq!(result, "Tier 1: Mission Critical");
    }

    #[test]
    fn test_topology_boost() {
        let input = BIAInput {
            financial_impact: Some(2.0),
            ..Default::default()
        };
        let profile = ScoringProfile {
            aggregation_strategy: AggregationStrategy::Max,
            topology_mode: TopologyMode::Boost,
            topology_threshold_high: 50,
            ..Default::default()
        };
        let result = calculate_criticality(input, profile, 60);
        assert_eq!(result, "Tier 1: Mission Critical");
    }
}
```

---

## 2. 6R Migration Decision Engine

**Purpose:** To suggest a modernization strategy (`Retire`, `Rehost`, `Refactor`, `Replatform`, `Repurchase`, `Retain`) based on the Card's attributes.

---

### 2.1 Rule Structure

Migration logic is stored as a **Decision Tree** in JSONB. The engine evaluates rules in order of `priority`. **The first match wins.**

**Rule Schema:**

```json
{
  "profile_name": "Cloud First Strategy",
  "description": "Recommends AWS/Azure migration for all workloads",
  "rules": [
    {
      "priority": 10,
      "strategy": "RETIRE",
      "reasoning": "Low value, high cost - better to eliminate",
      "conditions": [
        { "field": "technical_fit", "op": "<", "value": 2 },
        { "field": "functional_fit", "op": "<", "value": 2 },
        { "field": "business_criticality", "op": "!=", "value": "Tier 1" }
      ],
      "estimated_effort": "1-3 months",
      "estimated_cost_reduction": 0.95  // 95% cost savings
    },
    {
      "priority": 20,
      "strategy": "REPURCHASE",
      "reasoning": "Commodity software - SaaS alternative exists",
      "conditions": [
        { "field": "attributes.is_commodity", "op": "==", "value": true },
        { "field": "technical_fit", "op": "<", "value": 3 }
      ],
      "estimated_effort": "3-6 months",
      "estimated_cost_reduction": 0.40
    },
    {
      "priority": 30,
      "strategy": "REFACTOR",
      "reasoning": "High value justifies cloud-native rebuild",
      "conditions": [
        { "field": "functional_fit", "op": ">=", "value": 3 },
        { "field": "technical_fit", "op": "<", "value": 3 },
        { "field": "attributes.cloud_ready", "op": "==", "value": true }
      ],
      "estimated_effort": "12-24 months",
      "estimated_cost_reduction": -0.20  // 20% cost increase (investment)
    },
    {
      "priority": 40,
      "strategy": "REHOST",
      "reasoning": "Lift-and-shift to cloud infrastructure",
      "conditions": [
        { "field": "technical_fit", "op": ">=", "value": 2 },
        { "field": "attributes.hosting_type", "op": "==", "value": "On-Premise" }
      ],
      "estimated_effort": "3-6 months",
      "estimated_cost_reduction": 0.15
    }
  ]
}
```

---

### 2.2 Default Profiles

Arc Zero ships with two default profiles to support different market segments.

#### Profile A: Cloud First (Standard)

**Goal:** Move everything to Public Cloud (AWS/Azure).

**Priority Rules:**
1. **Retire:** Technical Fit < 2 AND Functional Fit < 2 AND Not Tier 1
2. **Repurchase:** Commodity software exists as SaaS
3. **Refactor:** High business value + Cloud-ready architecture
4. **Replatform:** Move to Managed Services (RDS, Azure SQL)
5. **Rehost:** Lift-and-shift to EC2/VMs
6. **Retain:** Default for edge cases

**Example Output:**
```json
{
  "recommended_strategy": "REFACTOR",
  "confidence": 0.85,
  "reasoning": "High Functional Fit (4/4) but Low Technical Fit (2/4) + Cloud-ready flag triggers cloud-native refactor rule.",
  "estimated_effort": "12-24 months",
  "estimated_cost_impact": {
    "short_term": "+20% (refactor investment)",
    "long_term": "-40% (reduced maintenance, auto-scaling)"
  },
  "risks": [
    "Requires team upskilling in Kubernetes/Microservices",
    "Database migration complexity (legacy Oracle to PostgreSQL)"
  ],
  "prerequisites": [
    "Complete cloud architecture design",
    "Train team on DevOps practices"
  ],
  "alternative_strategies": [
    {
      "strategy": "REHOST",
      "confidence": 0.60,
      "reasoning": "Faster time-to-cloud (3-6 months) but misses modernization benefits"
    }
  ]
}
```

---

#### Profile B: On-Premise Modernization

**Goal:** Optimize the Private Data Center (No public cloud).

**Priority Rules:**
1. **Retire:** Same as Cloud First (eliminate waste)
2. **Virtualize:** Legacy hardware → HCI (Hyper-Converged Infrastructure)
3. **Containerize:** Monolith → Docker/OpenShift
4. **Standardize:** Old database → Corporate Standard DB (e.g., PostgreSQL)
5. **Retain:** Keep stable, low-value apps as-is

**Example Output:**
```json
{
  "recommended_strategy": "CONTAINERIZE",
  "confidence": 0.70,
  "reasoning": "Monolithic Java app with high business value. Containerization enables better resource utilization without cloud migration.",
  "estimated_effort": "6-12 months",
  "technologies": [
    "Docker",
    "Red Hat OpenShift",
    "Helm Charts"
  ],
  "risks": [
    "Learning curve for container orchestration",
    "Persistent storage strategy required"
  ]
}
```

---

### 2.3 Edge Case Behavior

#### Case 1: No Rules Match

**Scenario:** Application attributes don't satisfy any rule conditions.

**Behavior:**
- **Action:** Return `ASSESS_MANUALLY`
- **Reason:** Unique situation requires human judgment

**Response:**
```json
{
  "recommended_strategy": "ASSESS_MANUALLY",
  "confidence": 0.0,
  "reasoning": "No automated rule matched this application's profile. Manual assessment recommended.",
  "next_steps": [
    "Schedule architecture review meeting",
    "Engage vendor for modernization roadmap",
    "Compare with similar applications in portfolio"
  ],
  "similar_apps": [
    {
      "name": "Legacy Billing System",
      "strategy_used": "REFACTOR",
      "success_notes": "6-month effort, migrated to microservices"
    }
  ]
}
```

---

#### Case 2: Multiple Rules Match at Same Priority

**Scenario:** Two rules have `priority: 50` and both match.

**Behavior:**
- **Action:** Return **ALL** matching strategies
- **UI Display:** "Multiple options available - review trade-offs"

**Response:**
```json
{
  "recommended_strategies": [
    {
      "strategy": "REPLATFORM",
      "confidence": 0.75,
      "reasoning": "Move to managed cloud database service",
      "effort": "3-6 months",
      "cost_impact": "-25%"
    },
    {
      "strategy": "REHOST",
      "confidence": 0.75,
      "reasoning": "Lift-and-shift to cloud VMs",
      "effort": "1-3 months",
      "cost_impact": "-10%"
    }
  ],
  "decision_factors": {
    "choose_replatform_if": "Long-term cost optimization is priority",
    "choose_rehost_if": "Speed to cloud is critical"
  }
}
```

---

#### Case 3: Missing Required Input Data

**Scenario:** Rule requires `attributes.is_commodity` but field is NULL.

**Behavior:**
- **Action:** Skip rule silently (do not throw error)
- **Reason:** Allow graceful degradation when data is incomplete

**Example:**
```json
{
  "rules": [
    {
      "priority": 10,
      "conditions": [
        { "field": "attributes.is_commodity", "op": "==", "value": true }  // NULL check fails
      ]
    }
  ]
}
```

**Engine Logic:**
```rust
fn evaluate_condition(card: &Card, condition: &Condition) -> bool {
    let field_value = card.get_field(&condition.field);
    
    // If field is missing/null, condition fails (skip rule)
    if field_value.is_none() {
        return false;
    }
    
    // Otherwise evaluate normally
    match condition.op {
        Operator::Equals => field_value == Some(&condition.value),
        Operator::LessThan => field_value < Some(&condition.value),
        // ...
    }
}
```

---

### 2.4 Testing & Validation

**6R Engine Test Cases:**

| App Profile | Tech Fit | Func Fit | Hosting | Commodity | Expected Strategy | Reasoning |
|-------------|----------|----------|---------|-----------|-------------------|-----------|
| **Legacy COBOL** | 1 | 2 | On-Prem | false | RETIRE | Too old, not critical |
| **Email System** | 2 | 3 | On-Prem | true | REPURCHASE | Move to Microsoft 365 |
| **Core Banking** | 2 | 4 | On-Prem | false | REFACTOR | High value, cloud-native rebuild |
| **File Server** | 3 | 3 | On-Prem | false | REHOST | Simple lift-and-shift |
| **SAP ERP** | 4 | 4 | SaaS | false | RETAIN | Already optimal |

---

## 3. TCO Allocation Engine (Estimated Cost)

**Purpose:** To provide a "Rough Order of Magnitude" budget roll-up by attributing infrastructure costs to applications and capabilities.

---

### 3.1 The "Reverse Waterfall" Logic

Costs flow **UP** the dependency graph:

```
Provider (AWS) → IT Component (EC2) → Application (CRM) → Business Capability (Sales)
```

**Graph Query (Cypher):**
```cypher
MATCH path = (provider:Provider)-[:PROVIDES_TECH]->(comp:ITComponent)-[:SUPPORTS_APP]->(app:Application)-[:SUPPORTS]->(cap:BusinessCapability)
WHERE provider.name = "AWS"
RETURN path
```

---

### 3.2 Allocation Strategies

#### Strategy A: Even Split (Default)

**Logic:** Divide the Parent Cost equally among all Children.

**Formula:**
```
child_cost = parent_cost / count(children)
```

**Example:**
```
Database Cluster: $10,000/month
  ├─ App A → $5,000 (50%)
  └─ App B → $5,000 (50%)
```

**Use Case:** Shared infrastructure where precise allocation is unknown (e.g., Network Switch).

---

#### Strategy B: Manual Percentage (Precision)

**Logic:** Use the `allocation_pct` property on the `RELIES_ON` edge.

**Formula:**
```
child_cost = parent_cost * allocation_pct
```

**Example:**
```cypher
(app_a:Application)-[:RELIES_ON {allocation_pct: 0.80}]->(db:ITComponent {cost: 10000})
(app_b:Application)-[:RELIES_ON {allocation_pct: 0.20}]->(db)
```

**Result:**
- App A: $8,000 (80%)
- App B: $2,000 (20%)

**Use Case:** Known resource consumption (e.g., CPU profiling shows App A uses 80% of DB capacity).

---

#### Strategy C: Weighted by Usage Metrics (Advanced)

**Logic:** Allocate based on actual usage data (e.g., API calls, storage GB).

**Formula:**
```
child_cost = parent_cost * (child_usage / sum(all_children_usage))
```

**Example:**
```json
{
  "database_cluster_cost": 10000,
  "usage_metrics": {
    "app_a_queries": 80000,
    "app_b_queries": 20000
  }
}
```

**Calculation:**
```
total_queries = 100,000
app_a_cost = 10,000 * (80,000 / 100,000) = $8,000
app_b_cost = 10,000 * (20,000 / 100,000) = $2,000
```

**Integration:** Pull metrics from observability tools (Datadog, New Relic).

---

### 3.3 Integration with Pustaka (ITAM System)

The **Base Costs** (at the bottom of the waterfall) are not entered manually. They are synced from **Pustaka**.

**Sync Configuration:**

| Setting | Value |
|---------|-------|
| **Sync Frequency** | Daily at 2:00 AM UTC |
| **Direction** | One-way (Pustaka → Arc Zero) |
| **Conflict Resolution** | Pustaka wins (overwrite Arc Zero) |
| **Currency Normalization** | Convert all to USD using ECB rates |

**Sync Logic:**
```rust
async fn sync_from_pustaka() {
    let assets = pustaka_client.get_all_assets().await?;
    
    for asset in assets {
        // 1. Find matching IT Component in Arc Zero
        let component = db.find_component_by_external_id(asset.id).await?;
        
        // 2. Normalize currency
        let cost_usd = normalize_currency(
            asset.monthly_cost,
            asset.currency,
            &fx_rates
        );
        
        // 3. Update JSONB field
        db.execute(
            "UPDATE cards 
             SET attributes = jsonb_set(
               attributes,
               '{financials,estimated_annual_cost}',
               to_jsonb($1::numeric)
             )
             WHERE id = $2",
            vec![&(cost_usd * 12.0), &component.id]
        ).await?;
        
        // 4. Log sync event
        audit_log.record(SyncEvent {
            source: "Pustaka",
            card_id: component.id,
            field: "financials.estimated_annual_cost",
            old_value: component.cost,
            new_value: cost_usd * 12.0,
        });
    }
}
```

---

### 3.4 Currency Normalization

**Exchange Rate Source:** European Central Bank (ECB) Daily Reference Rates  
**Fallback:** OANDA API (if ECB is down)  
**Cache Duration:** 24 hours

**Conversion Formula:**
```
amount_usd = amount_local * fx_rate_to_usd
```

**Example:**
```rust
struct ExchangeRate {
    from_currency: String,
    to_currency: String,
    rate: f64,
    as_of_date: Date,
}

fn normalize_currency(
    amount: f64,
    from_currency: &str,
    fx_rates: &[ExchangeRate]
) -> f64 {
    if from_currency == "USD" {
        return amount;  // Already in USD
    }
    
    let rate = fx_rates.iter()
        .find(|r| r.from_currency == from_currency && r.to_currency == "USD")
        .expect("Exchange rate not found");
    
    amount * rate.rate
}
```

**Storage (PostgreSQL):**
```sql
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate NUMERIC(12, 6) NOT NULL,
    as_of_date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,  -- 'ECB' or 'OANDA'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example data
INSERT INTO exchange_rates (from_currency, to_currency, rate, as_of_date, source)
VALUES
  ('EUR', 'USD', 1.0842, '2026-01-12', 'ECB'),
  ('GBP', 'USD', 1.2654, '2026-01-12', 'ECB'),
  ('JPY', 'USD', 0.0068, '2026-01-12', 'ECB');
```

---

### 3.5 TCO Report Example

**Query:** "What is the total cost of the Sales Capability?"

**Graph Traversal:**
```cypher
MATCH path = (cap:BusinessCapability {name: "Sales"})<-[:SUPPORTS]-(app:Application)<-[:RELIES_ON]-(comp:ITComponent)
RETURN cap, app, comp, comp.cost
```

**API Response:**
```json
{
  "capability": "Sales",
  "total_tco_annual": 1250000,
  "currency": "USD",
  "breakdown": [
    {
      "application": "Salesforce CRM",
      "direct_cost": 180000,
      "infrastructure_cost": 45000,
      "total": 225000,
      "components": [
        {
          "name": "AWS EC2 Instances",
          "cost": 30000,
          "allocation_method": "Even Split (3 apps)"
        },
        {
          "name": "PostgreSQL RDS",
          "cost": 15000,
          "allocation_method": "Manual (60% allocation)"
        }
      ]
    },
    {
      "application": "Sales Analytics Dashboard",
      "direct_cost": 0,
      "infrastructure_cost": 25000,
      "total": 25000
    }
    // ... more apps
  ],
  "cost_by_category": {
    "SaaS Licenses": 450000,
    "Cloud Infrastructure": 600000,
    "On-Premise Hardware": 200000
  },
  "trends": {
    "last_quarter_change": "+5.2%",
    "forecast_next_year": 1320000
  }
}
```

---

### 3.6 Testing & Validation

**Test Scenario 1: Even Split Allocation**

```rust
#[test]
fn test_even_split_allocation() {
    let db_cost = 10000.0;
    let apps = vec!["App A", "App B"];
    
    let allocated_cost = allocate_cost_even_split(db_cost, apps.len());
    
    assert_eq!(allocated_cost, 5000.0);
}
```

**Test Scenario 2: Manual Percentage Validation**

```rust
#[test]
fn test_manual_percentage_sum_100() {
    let edges = vec![
        RelationshipEdge { allocation_pct: Some(0.60) },
        RelationshipEdge { allocation_pct: Some(0.40) }
    ];
    
    let total: f64 = edges.iter()
        .map(|e| e.allocation_pct.unwrap())
        .sum();
    
    assert!((total - 1.0).abs() < 0.001, "Percentages must sum to 100%");
}
```

**Test Scenario 3: Currency Normalization**

```rust
#[test]
fn test_currency_normalization() {
    let fx_rates = vec![
        ExchangeRate { from_currency: "EUR".into(), to_currency: "USD".into(), rate: 1.08 }
    ];
    
    let amount_usd = normalize_currency(1000.0, "EUR", &fx_rates);
    
    assert_eq!(amount_usd, 1080.0);
}
```

---

## Appendix: Scoring Profile Examples

### Example 1: Financial Services (Balanced)

```json
{
  "name": "Financial Services - Balanced Risk",
  "aggregation_strategy": "WEIGHTED_AVG",
  "topology_mode": "WEIGHTED",
  "dimension_weights": {
    "financial_impact": 1.0,
    "regulatory_impact": 0.9,
    "operational_impact": 0.7,
    "reputational_impact": 0.8,
    "safety_impact": 0.3
  }
}
```

### Example 2: Manufacturing (Safety First)

```json
{
  "name": "Manufacturing - Safety Critical",
  "aggregation_strategy": "MAX",
  "topology_mode": "BOOST",
  "topology_threshold_high": 20,
  "dimension_weights": {
    "safety_impact": 1.0,
    "operational_impact": 0.6,
    "financial_impact": 0.4
  }
}
```

---

**Document Version History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-11 | Initial release | Product Team |
| 1.0.1 | 2026-01-12 | Added edge case handling, testing, currency normalization, TCO examples | Documentation Team |
