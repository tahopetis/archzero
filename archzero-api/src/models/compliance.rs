use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::ToSchema;
use std::collections::HashMap;

/// Compliance framework enumeration
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "camelCase")]
pub enum ComplianceFramework {
    GDPR,
    SOX,
    HIPAA,
    #[serde(rename = "PCI-DSS")]
    PCIDSS,
    #[serde(rename = "ISO27001")]
    ISO27001,
    #[serde(rename = "SOC2")]
    SOC2,
    NIST,
    #[serde(rename = "CCPA")]
    CCPA,
    Other(String),
}

/// Compliance requirement card response
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceRequirement {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: String,
    pub framework: ComplianceFramework,
    pub description: String,
    pub applicable_card_types: Vec<String>,
    pub required_controls: Vec<String>,
    pub audit_frequency: String,
}

/// Request to create a compliance requirement
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateComplianceRequirementRequest {
    pub name: String,
    pub framework: ComplianceFramework,
    pub description: String,
    pub applicable_card_types: Vec<String>,
    pub required_controls: Vec<String>,
    pub audit_frequency: String,
}

/// Request to update a compliance requirement
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateComplianceRequirementRequest {
    pub name: Option<String>,
    pub framework: Option<ComplianceFramework>,
    pub description: Option<String>,
    pub applicable_card_types: Option<Vec<String>>,
    pub required_controls: Option<Vec<String>>,
    pub audit_frequency: Option<String>,
}

/// Query parameters for listing compliance requirements
#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceRequirementSearchParams {
    pub framework: Option<ComplianceFramework>,
    pub page: Option<u32>,
}

/// Compliance status for a single card
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardComplianceAssessmentResult {
    pub card_id: Uuid,
    pub card_name: String,
    pub status: RequirementComplianceStatus,
    pub controls_implemented: Vec<String>,
    pub missing_controls: Vec<String>,
}

/// Compliance status enumeration
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "camelCase")]
pub enum RequirementComplianceStatus {
    Compliant,
    NonCompliant,
    Exempt,
    Partial,
}

/// Request to assess card compliance
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct AssessComplianceRequest {
    pub card_ids: Vec<Uuid>,
}

/// Compliance assessment response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceAssessment {
    pub compliance_id: Uuid,
    pub framework: ComplianceFramework,
    pub total_cards: i32,
    pub compliant: i32,
    pub non_compliant: i32,
    pub results: Vec<CardComplianceAssessmentResult>,
}

/// Dashboard summary statistics
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceSummary {
    pub total_applicable_cards: i32,
    pub compliant: i32,
    pub non_compliant: i32,
    pub exempt: i32,
    pub compliance_rate: f64,
}

/// Card type breakdown for dashboard
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardTypeBreakdown {
    pub total: i32,
    pub compliant: i32,
}

/// Compliance dashboard response
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceDashboard {
    pub compliance_id: Uuid,
    pub framework: ComplianceFramework,
    pub summary: ComplianceSummary,
    pub by_card_type: HashMap<String, CardTypeBreakdown>,
    pub last_assessed: DateTime<Utc>,
}

/// Paginated response for compliance requirements
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceRequirementsListResponse {
    pub data: Vec<ComplianceRequirement>,
    pub pagination: CompliancePagination,
}

/// Pagination metadata
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CompliancePagination {
    pub total: i64,
}
