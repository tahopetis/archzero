use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Total Cost of Ownership calculation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TCOCalculation {
    pub id: Uuid,
    pub card_id: Uuid,
    pub card_name: String,
    pub base_cost: CostBreakdown,
    pub allocated_costs: Vec<AllocatedCost>,
    pub dependency_costs: Vec<DependencyCost>,
    pub total_tco: f64,
    pub total_tco_monthly: f64,
    pub currency: String,
    pub calculated_at: DateTime<Utc>,
    pub calculation_period_months: u32,
}

/// Cost breakdown for a single application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostBreakdown {
    pub annual_amount: f64,
    pub monthly_amount: f64,
    pub components: CostComponents,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostComponents {
    // Operational costs
    pub infrastructure: f64,      // Servers, storage, network
    pub software_licenses: f64,   // Licenses, subscriptions
    pub support_contracts: f64,   // Vendor support, SLAs
    pub personnel: f64,           // Operations, maintenance staff

    // One-time costs (amortized)
    pub development_amortized: f64, // Development cost spread over period
    pub implementation_amortized: f64, // Implementation/deployment cost
    pub migration_amortized: f64,     // Migration costs

    // Risk costs
    pub downtime_risk: f64,        // Expected cost of downtime
    pub security_incidents: f64,   // Expected security incident costs
    pub compliance_fines: f64,     // Potential compliance penalties

    // Other
    pub training: f64,             // Training costs
    pub other: f64,                // Uncategorized costs
}

/// Cost allocated from a shared platform to consuming applications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocatedCost {
    pub id: Uuid,
    pub source_card_id: Uuid,      // The platform/component being allocated
    pub source_card_name: String,
    pub amount: f64,
    pub percentage: f64,            // Percentage of source cost allocated to this card
    pub allocation_method: AllocationMethod,
    pub description: String,
}

/// Cost from dependencies (platforms this application depends on)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DependencyCost {
    pub id: Uuid,
    pub dependency_card_id: Uuid,  // The dependency
    pub dependency_card_name: String,
    pub allocated_amount: f64,      // Portion of dependency's TCO allocated to this card
    pub relationship_type: String,
    pub description: String,
}

/// How to allocate shared platform costs to consuming applications
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AllocationMethod {
    /// Split costs evenly among all consumers
    EvenSplit,

    /// Use manual percentage assignments
    ManualPercentage,

    /// Allocate based on actual usage metrics
    UsageBased,

    /// Allocate based on business criticality
    CriticalityBased,

    /// Allocate based on transaction volume
    TransactionBased,

    /// No allocation (cost stays with source)
    None,
}

/// TCO calculation request
#[derive(Debug, Deserialize)]
pub struct TCOCalculationRequest {
    pub card_id: Uuid,
    pub cost_breakdown: CostComponents,
    pub allocation_strategy: AllocationStrategy,
    pub currency: String,
    pub calculation_period_months: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllocationStrategy {
    pub method: AllocationMethod,
    pub include_dependencies: bool,
    pub max_depth: u32,  // How many levels of dependencies to include
    pub manual_allocations: Option<Vec<ManualAllocation>>,
    pub usage_metrics: Option<UsageMetrics>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ManualAllocation {
    pub source_card_id: Uuid,
    pub percentage: f64,  // 0.0 - 100.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageMetrics {
    pub transaction_count: Option<u64>,
    pub user_count: Option<u32>,
    pub data_volume_gb: Option<f64>,
    pub cpu_hours: Option<f64>,
    pub custom_metrics: Option<std::collections::HashMap<String, f64>>,
}

/// TCO comparison between scenarios
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TCOComparison {
    pub card_id: Uuid,
    pub scenarios: Vec<TCOScenario>,
    pub best_case: TCOScenario,
    pub worst_case: TCOScenario,
    pub variance_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TCOScenario {
    pub name: String,
    pub description: String,
    pub tco_calculation: TCOCalculation,
    pub assumptions: Vec<String>,
}

/// TCO portfolio summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TCOPortfolio {
    pub total_applications: u32,
    pub total_annual_tco: f64,
    pub average_tco_per_app: f64,
    pub cost_by_category: CostComponents,
    pub top_10_costliest: Vec<TCOItem>,
    pub cost_trend_months: Vec<CostTrendDataPoint>,
    pub currency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TCOItem {
    pub card_id: Uuid,
    pub card_name: String,
    pub annual_tco: f64,
    pub percentage_of_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CostTrendDataPoint {
    pub month: u32,
    pub total_tco: f64,
    pub breakdown: CostComponents,
}

/// ITAM integration for cost data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ITAMCostData {
    pub card_id: Uuid,
    pub source_system: String,  // e.g., "Pustaka ITAM"
    pub last_updated: DateTime<Utc>,
    pub cost_components: CostComponents,
    pub confidence_level: f64,  // 0.0 - 1.0
    pub data_quality_score: f64, // 0.0 - 1.0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cost_breakdown_calculation() {
        let components = CostComponents {
            infrastructure: 10000.0,
            software_licenses: 5000.0,
            support_contracts: 2000.0,
            personnel: 50000.0,
            development_amortized: 10000.0,
            implementation_amortized: 5000.0,
            migration_amortized: 0.0,
            downtime_risk: 1000.0,
            security_incidents: 500.0,
            compliance_fines: 0.0,
            training: 2000.0,
            other: 1000.0,
        };

        let total: f64 = [
            components.infrastructure,
            components.software_licenses,
            components.support_contracts,
            components.personnel,
            components.development_amortized,
            components.implementation_amortized,
            components.migration_amortized,
            components.downtime_risk,
            components.security_incidents,
            components.compliance_fines,
            components.training,
            components.other,
        ].iter().sum();

        assert_eq!(total, 87500.0);
    }
}
