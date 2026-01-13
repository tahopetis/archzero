use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Business Impact Analysis Profile
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BIAProfile {
    pub name: String,
    pub industry: String,
    pub dimensions: Vec<BIADimension>,
    pub aggregation_strategy: AggregationStrategy,
}

/// BIA Dimension (e.g., Financial, Legal, Safety, Operational, Reputational)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BIADimension {
    pub id: String,
    pub name: String,
    pub weight: f64,
    pub description: String,
    pub questions: Vec<BIAQuestion>,
}

/// BIA Question within a dimension
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BIAQuestion {
    pub id: String,
    pub text: String,
    pub weight: f64,
    pub response_options: Vec<ResponseOption>,
    pub required: bool,
}

/// Response option for a BIA question
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResponseOption {
    pub value: String,
    pub label: String,
    pub score: f64,  // Impact score (0.0 - 1.0)
}

/// How to aggregate dimension scores into overall criticality
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AggregationStrategy {
    /// Take the maximum score across all dimensions
    Max,
    /// Weighted average of all dimension scores
    WeightedAvg,
    /// Sum of all dimension scores
    Sum,
}

/// BIA Assessment for a specific card
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BIAAssessment {
    pub id: Uuid,
    pub card_id: Uuid,
    pub profile_name: String,
    pub assessed_by: Uuid,
    pub assessed_at: DateTime<Utc>,
    pub responses: Vec<BIAResponse>,
    pub dimension_scores: Vec<DimensionScore>,
    pub overall_score: f64,
    pub criticality_level: CriticalityLevel,
}

/// Response to a BIA question
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BIAResponse {
    pub question_id: String,
    pub dimension_id: String,
    pub selected_option: String,
    pub score: f64,
}

/// Score for a single dimension
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DimensionScore {
    pub dimension_id: String,
    pub dimension_name: String,
    pub score: f64,
    pub weight: f64,
    pub weighted_score: f64,
}

/// Overall criticality level based on BIA score
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum CriticalityLevel {
    Critical,    // 0.8 - 1.0
    High,        // 0.6 - 0.79
    Medium,      // 0.4 - 0.59
    Low,         // 0.2 - 0.39
    Minimal,     // 0.0 - 0.19
}

impl CriticalityLevel {
    pub fn from_score(score: f64) -> Self {
        match score {
            s if s >= 0.8 => CriticalityLevel::Critical,
            s if s >= 0.6 => CriticalityLevel::High,
            s if s >= 0.4 => CriticalityLevel::Medium,
            s if s >= 0.2 => CriticalityLevel::Low,
            _ => CriticalityLevel::Minimal,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            CriticalityLevel::Critical => "Critical",
            CriticalityLevel::High => "High",
            CriticalityLevel::Medium => "Medium",
            CriticalityLevel::Low => "Low",
            CriticalityLevel::Minimal => "Minimal",
        }
    }
}

/// Request to create a BIA assessment
#[derive(Debug, Deserialize)]
pub struct CreateAssessmentRequest {
    pub card_id: Uuid,
    pub profile_name: String,
    pub responses: Vec<BIAResponse>,
}

/// Topology metrics for a card
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopologyMetrics {
    pub card_id: Uuid,
    pub fan_in: u32,       // Number of cards that depend on this card
    pub fan_out: u32,      // Number of cards this card depends on
    pub total_connections: u32,
    pub criticality_boost: Option<CriticalityLevel>,
}

/// Enhanced criticality with topology consideration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnhancedCriticality {
    pub bia_score: f64,
    pub bia_level: CriticalityLevel,
    pub topology_metrics: TopologyMetrics,
    pub final_level: CriticalityLevel,
    pub escalation_reason: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_criticality_from_score() {
        assert_eq!(CriticalityLevel::from_score(0.9), CriticalityLevel::Critical);
        assert_eq!(CriticalityLevel::from_score(0.7), CriticalityLevel::High);
        assert_eq!(CriticalityLevel::from_score(0.5), CriticalityLevel::Medium);
        assert_eq!(CriticalityLevel::from_score(0.3), CriticalityLevel::Low);
        assert_eq!(CriticalityLevel::from_score(0.1), CriticalityLevel::Minimal);
    }
}
