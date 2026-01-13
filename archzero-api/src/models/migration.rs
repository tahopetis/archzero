use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// 6R Migration Recommendation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum RecommendationType {
    Rehost,     // Lift and shift to cloud (IaaS)
    Refactor,   // Minimal changes to cloud (keep stack)
    Revise,     // Rewrite partially for cloud
    Replatform, // Rewrite fully for cloud (PaaS)
    Replace,    // Buy SaaS instead of building/maintaining
    Retire,     // Decommission - no longer needed
    Retain,     // Keep as-is (on-prem or current state)
}

impl RecommendationType {
    pub fn as_str(&self) -> &str {
        match self {
            RecommendationType::Rehost => "Rehost",
            RecommendationType::Refactor => "Refactor",
            RecommendationType::Revise => "Revise",
            RecommendationType::Replatform => "Replatform",
            RecommendationType::Replace => "Replace",
            RecommendationType::Retire => "Retire",
            RecommendationType::Retain => "Retain",
        }
    }

    pub fn description(&self) -> &str {
        match self {
            RecommendationType::Rehost => "Lift and shift to cloud infrastructure with minimal changes",
            RecommendationType::Refactor => "Make minimal changes to operate in cloud without full rearchitecture",
            RecommendationType::Revise => "Partially rewrite or rearchitect for cloud optimization",
            RecommendationType::Replatform => "Fully rewrite for cloud-native platform services",
            RecommendationType::Replace => "Replace with commercial SaaS solution",
            RecommendationType::Retire => "Decommission - functionality no longer needed or replaced",
            RecommendationType::Retain => "Keep in current state (on-prem or existing environment)",
        }
    }

    pub fn effort_level(&self) -> EffortLevel {
        match self {
            RecommendationType::Retain => EffortLevel::None,
            RecommendationType::Retire => EffortLevel::Low,
            RecommendationType::Rehost => EffortLevel::Medium,
            RecommendationType::Refactor => EffortLevel::Medium,
            RecommendationType::Replace => EffortLevel::Medium,
            RecommendationType::Revise => EffortLevel::High,
            RecommendationType::Replatform => EffortLevel::VeryHigh,
        }
    }
}

/// Effort required for migration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum EffortLevel {
    None,
    Low,
    Medium,
    High,
    VeryHigh,
}

/// Cost impact of migration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum CostImpact {
    SignificantSavings,   // >30% cost reduction
    ModerateSavings,      // 10-30% cost reduction
    Neutral,              // +/-10% cost change
    ModerateIncrease,     // 10-30% cost increase
    SignificantIncrease,  // >30% cost increase
}

/// Risk level of migration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum RiskLevel {
    VeryLow,
    Low,
    Medium,
    High,
    VeryHigh,
}

/// Migration recommendation for a specific card
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationRecommendation {
    pub id: Uuid,
    pub card_id: Uuid,
    pub card_name: String,
    pub recommendation: RecommendationType,
    pub reasoning: String,
    pub effort_estimate: EffortLevel,
    pub cost_impact: CostImpact,
    pub risk_assessment: RiskLevel,
    pub confidence_score: f64,  // 0.0 - 1.0
    pub alternative_options: Vec<RecommendationType>,
    pub assessed_at: DateTime<Utc>,
    pub assessment_version: String,
}

/// Factors considered in migration decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationFactors {
    // Technical factors
    pub technology_age_years: Option<u32>,
    pub customization_level: CustomizationLevel,
    pub integration_complexity: ComplexityLevel,
    pub data_volume: DataVolume,

    // Business factors
    pub business_criticality: CriticalityLevel,
    pub strategic_fit: StrategicFit,
    pub user_satisfaction: f64,  // 0.0 - 1.0

    // Operational factors
    pub maintenance_burden: MaintenanceLevel,
    pub performance_issues: bool,
    pub security_compliance: ComplianceLevel,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum CustomizationLevel {
    None,           // COTS/OTS with no customization
    Low,            // Minor configuration changes
    Medium,         // Some customization (10-30%)
    High,           // Heavily customized (30-70%)
    VeryHigh,       // Fully custom (>70%)
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum ComplexityLevel {
    Low,            // <5 integrations
    Medium,         // 5-20 integrations
    High,           // 20-50 integrations
    VeryHigh,       // >50 integrations
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum DataVolume {
    Low,            // <100 GB
    Medium,         // 100 GB - 10 TB
    High,           // 10 TB - 100 TB
    VeryHigh,       // >100 TB
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum CriticalityLevel {
    Critical,
    High,
    Medium,
    Low,
    Minimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum StrategicFit {
    Core,           // Core to business strategy
    Supportive,     // Supports core business
    Neutral,        // Neutral strategic value
    Declining,      // Declining strategic importance
    Misaligned,     // Misaligned with strategy
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum MaintenanceLevel {
    VeryLow,        // <1 FTE
    Low,            // 1-2 FTE
    Medium,         // 2-5 FTE
    High,           // 5-10 FTE
    VeryHigh,       // >10 FTE
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum ComplianceLevel {
    Compliant,
    MinorIssues,
    MajorIssues,
    CriticalIssues,
    Unknown,
}

/// Request for migration assessment
#[derive(Debug, Deserialize)]
pub struct MigrationAssessmentRequest {
    pub card_id: Uuid,
    pub factors: MigrationFactors,
    pub target_environment: TargetEnvironment,
    pub constraints: Option<MigrationConstraints>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum TargetEnvironment {
    Aws,
    Azure,
    Gcp,
    Hybrid,
    OnPrem,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationConstraints {
    pub budget_limit: Option<f64>,
    pub timeline_months: Option<u32>,
    pub risk_tolerance: RiskLevel,
    pub mandatory_retirement_date: Option<DateTime<Utc>>,
}

/// Migration profile with decision rules
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationProfile {
    pub name: String,
    pub industry: String,
    pub rules: Vec<MigrationRule>,
    pub default_recommendation: RecommendationType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationRule {
    pub priority: u32,
    pub name: String,
    pub condition: String,  // Simplified condition language
    pub recommendation: RecommendationType,
    pub reasoning_template: String,
    pub effort_boost: Option<EffortLevel>,
    pub cost_impact: Option<CostImpact>,
    pub risk_level: Option<RiskLevel>,
}

/// Migration portfolio summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationPortfolio {
    pub total_cards: u32,
    pub recommendations: Vec<MigrationRecommendation>,
    pub summary_by_type: std::collections::HashMap<String, u32>,
    pub total_effort_months: u32,
    pub estimated_cost_impact: CostImpact,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_recommendation_effort_levels() {
        assert_eq!(RecommendationType::Retain.effort_level(), EffortLevel::None);
        assert_eq!(RecommendationType::Replatform.effort_level(), EffortLevel::VeryHigh);
    }

    #[test]
    fn test_recommendation_descriptions() {
        let rec = RecommendationType::Rehost;
        assert!(rec.description().contains("Lift and shift"));
    }
}
