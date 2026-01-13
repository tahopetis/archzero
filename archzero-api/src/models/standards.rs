use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};

/// Technology lifecycle status (Technology Radar)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum TechnologyStatus {
    Adopt,     // Recommended for use
    Trial,     // Experiment with it
    Assess,    // Evaluate it
    Hold,      // Use with caution
    Sunset,    // Phase out
    Banned,    // Do not use
}

impl TechnologyStatus {
    pub fn as_str(&self) -> &str {
        match self {
            TechnologyStatus::Adopt => "Adopt",
            TechnologyStatus::Trial => "Trial",
            TechnologyStatus::Assess => "Assess",
            TechnologyStatus::Hold => "Hold",
            TechnologyStatus::Sunset => "Sunset",
            TechnologyStatus::Banned => "Banned",
        }
    }
}

/// Technology Standard (Technology Radar entry)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TechnologyStandard {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub category: String,
    pub status: TechnologyStatus,
    pub sunset_date: Option<String>, // ISO 8601 date string
    pub replacement_id: Option<Uuid>,
    pub rationale: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

/// Request to create a Technology Standard
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateStandardRequest {
    pub name: String,
    pub category: String,
    pub status: TechnologyStatus,
    pub sunset_date: Option<String>,
    pub replacement_id: Option<Uuid>,
    pub rationale: String,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Request to update a Technology Standard
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStandardRequest {
    pub name: Option<String>,
    pub category: Option<String>,
    pub status: Option<TechnologyStatus>,
    pub sunset_date: Option<String>,
    pub replacement_id: Option<Uuid>,
    pub rationale: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

/// Query parameters for listing Technology Standards
#[derive(Debug, Deserialize, IntoParams, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct StandardSearchParams {
    pub category: Option<String>,
    pub status: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

/// Response for paginated standards list
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct StandardsListResponse {
    pub data: Vec<TechnologyStandard>,
    pub pagination: PaginationMeta,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PaginationMeta {
    pub page: u32,
    pub limit: u32,
    pub total: i64,
}

/// Technology Radar Quadrant
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RadarQuadrant {
    pub name: String,
    pub rings: Vec<RadarRing>,
}

/// Technology Radar Ring (Adopt, Trial, Assess, Hold)
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct RadarRing {
    pub name: String,
    pub technologies: Vec<String>,
}

/// Technology Radar response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TechnologyRadar {
    pub quadrants: Vec<RadarQuadrant>,
}

/// Technology Debt Summary
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DebtSummary {
    pub total_debt_score: i64,
    pub high_risk_components: i64,
    pub estimated_migration_cost: f64,
}

/// Technology Debt Item
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct DebtItem {
    pub component_name: String,
    pub component_id: Uuid,
    pub standard_status: TechnologyStatus,
    pub eol_date: Option<String>,
    pub risk_level: String,
    pub estimated_cost: f64,
}

/// Technology Debt Report
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TechnologyDebtReport {
    pub summary: DebtSummary,
    pub debt_items: Vec<DebtItem>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_technology_status_as_str() {
        assert_eq!(TechnologyStatus::Adopt.as_str(), "Adopt");
        assert_eq!(TechnologyStatus::Trial.as_str(), "Trial");
        assert_eq!(TechnologyStatus::Sunset.as_str(), "Sunset");
    }
}
