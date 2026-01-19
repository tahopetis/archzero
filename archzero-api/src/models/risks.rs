use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};

/// Risk type categories
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum RiskType {
    Security,
    Compliance,
    Operational,
    Financial,
    Strategic,
    Reputational,
}

/// Risk status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum RiskStatus {
    Open,
    Mitigated,
    Accepted,
    Transferred,
    Closed,
}

/// Risk approval status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "camelCase")]
pub enum RiskApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

/// Risk register entry
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Risk {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub description: String,
    pub risk_type: RiskType,
    pub likelihood: i32,       // 1-5
    pub impact: i32,           // 1-5
    pub risk_score: i32,       // 1-25 (likelihood * impact)
    pub mitigation_plan: Option<String>,
    pub owner: Option<String>,
    pub status: RiskStatus,
    pub target_closure_date: Option<String>,  // ISO 8601 date
    pub approval_status: Option<RiskApprovalStatus>,
    pub approved_by: Option<String>,
    pub approved_at: Option<String>,  // ISO 8601 datetime
    pub is_overdue: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Create a new risk
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateRiskRequest {
    pub name: String,
    pub description: String,
    pub risk_type: RiskType,
    pub likelihood: i32,
    pub impact: i32,
    pub mitigation_plan: Option<String>,
    pub owner: Option<String>,
    pub status: Option<RiskStatus>,
    pub target_closure_date: Option<String>,
    pub approval_status: Option<RiskApprovalStatus>,
    pub approved_by: Option<String>,
    pub approved_at: Option<String>,
    pub is_overdue: Option<bool>,
}

/// Update a risk
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRiskRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub risk_type: Option<RiskType>,
    pub likelihood: Option<i32>,
    pub impact: Option<i32>,
    pub mitigation_plan: Option<String>,
    pub owner: Option<String>,
    pub status: Option<RiskStatus>,
    pub target_closure_date: Option<String>,
    pub approval_status: Option<RiskApprovalStatus>,
    pub approved_by: Option<String>,
    pub approved_at: Option<String>,
    pub is_overdue: Option<bool>,
}

/// Query parameters for listing risks
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RiskSearchParams {
    pub risk_type: Option<RiskType>,
    pub status: Option<RiskStatus>,
    pub min_score: Option<i32>,
    pub page: Option<u32>,
}

/// Heat map cell data
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct HeatMapCell {
    pub likelihood: i32,
    pub impact: i32,
    pub count: i32,
}

/// Heat map data point
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RiskHeatMapData {
    pub likelihood: i32,
    pub impact: i32,
    pub count: i32,
    pub risks: Vec<RiskHeatMapRisk>,
}

/// Simplified risk info for heat map
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RiskHeatMapRisk {
    pub id: Uuid,
    pub name: String,
    pub risk_score: i32,
}

/// Top risk item
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TopRiskItem {
    pub rank: i32,
    pub id: Uuid,
    pub name: String,
    pub risk_score: i32,
    pub risk_type: RiskType,
    pub status: RiskStatus,
}

/// Top risk entry
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TopRisk {
    pub rank: i32,
    pub id: Uuid,
    pub name: String,
    pub risk_score: i32,
    pub risk_type: RiskType,
    pub status: RiskStatus,
}

/// Response for risk list with pagination
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RiskListResponse {
    pub data: Vec<Risk>,
    pub pagination: PaginationMetadata,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaginationMetadata {
    pub page: u32,
    pub limit: u32,
    pub total: i64,
    pub total_pages: u32,
}

/// Response for top 10 risks
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TopRisksResponse {
    pub data: Vec<TopRisk>,
}

impl CreateRiskRequest {
    /// Calculate risk score from likelihood and impact
    pub fn calculate_risk_score(&self) -> i32 {
        self.likelihood * self.impact
    }

    /// Validate likelihood and impact ranges
    pub fn validate(&self) -> Result<(), String> {
        if !(1..=5).contains(&self.likelihood) {
            return Err("Likelihood must be between 1 and 5".to_string());
        }
        if !(1..=5).contains(&self.impact) {
            return Err("Impact must be between 1 and 5".to_string());
        }
        Ok(())
    }
}

impl UpdateRiskRequest {
    /// Calculate risk score if both likelihood and impact are provided
    pub fn calculate_risk_score(&self) -> Option<i32> {
        match (self.likelihood, self.impact) {
            (Some(l), Some(i)) => Some(l * i),
            _ => None,
        }
    }

    /// Validate likelihood and impact ranges if provided
    pub fn validate(&self) -> Result<(), String> {
        if let Some(likelihood) = self.likelihood {
            if !(1..=5).contains(&likelihood) {
                return Err("Likelihood must be between 1 and 5".to_string());
            }
        }
        if let Some(impact) = self.impact {
            if !(1..=5).contains(&impact) {
                return Err("Impact must be between 1 and 5".to_string());
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_score_calculation() {
        let req = CreateRiskRequest {
            name: "Test Risk".to_string(),
            description: "Test".to_string(),
            risk_type: RiskType::Operational,
            likelihood: 4,
            impact: 5,
            mitigation_plan: None,
            owner: None,
            status: None,
            target_closure_date: None,
            approval_status: None,
            approved_by: None,
            approved_at: None,
            is_overdue: None,
        };
        assert_eq!(req.calculate_risk_score(), 20);
    }

    #[test]
    fn test_validation_valid() {
        let req = CreateRiskRequest {
            name: "Test Risk".to_string(),
            description: "Test".to_string(),
            risk_type: RiskType::Operational,
            likelihood: 3,
            impact: 3,
            mitigation_plan: None,
            owner: None,
            status: None,
            target_closure_date: None,
            approval_status: None,
            approved_by: None,
            approved_at: None,
            is_overdue: None,
        };
        assert!(req.validate().is_ok());
    }

    #[test]
    fn test_validation_invalid_likelihood() {
        let req = CreateRiskRequest {
            name: "Test Risk".to_string(),
            description: "Test".to_string(),
            risk_type: RiskType::Operational,
            likelihood: 6,  // Invalid
            impact: 3,
            mitigation_plan: None,
            owner: None,
            status: None,
            target_closure_date: None,
            approval_status: None,
            approved_by: None,
            approved_at: None,
            is_overdue: None,
        };
        assert!(req.validate().is_err());
    }

    #[test]
    fn test_validation_invalid_impact() {
        let req = CreateRiskRequest {
            name: "Test Risk".to_string(),
            description: "Test".to_string(),
            risk_type: RiskType::Operational,
            likelihood: 3,
            impact: 0,  // Invalid
            mitigation_plan: None,
            owner: None,
            status: None,
            target_closure_date: None,
            approval_status: None,
            approved_by: None,
            approved_at: None,
            is_overdue: None,
        };
        assert!(req.validate().is_err());
    }
}
