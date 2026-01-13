use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};
use serde_json::Value as JsonValue;

/// Architecture Policy representation
/// Based on metamodel spec docs/01-metamodel-spec.md lines 682-701
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ArchitecturePolicy {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub policy_type: String, // Always "ArchitecturePolicy"
    pub rule_json: JsonValue,
    pub severity: PolicySeverity,
    pub enforcement: PolicyEnforcement,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Policy severity levels
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum PolicySeverity {
    Critical,
    High,
    Medium,
    Low,
}

/// Policy enforcement modes
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum PolicyEnforcement {
    Blocking,
    Warning,
}

/// Request to create a new architecture policy
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreatePolicyRequest {
    pub name: String,
    pub rule_json: JsonValue,
    pub severity: PolicySeverity,
    pub enforcement: PolicyEnforcement,
    pub description: Option<String>,
}

/// Request to update an existing architecture policy
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePolicyRequest {
    pub name: Option<String>,
    pub rule_json: Option<JsonValue>,
    pub severity: Option<PolicySeverity>,
    pub enforcement: Option<PolicyEnforcement>,
    pub description: Option<String>,
}

/// Query parameters for listing policies
#[derive(Debug, Deserialize, ToSchema, IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct PolicySearchParams {
    pub severity: Option<PolicySeverity>,
    pub enforcement: Option<PolicyEnforcement>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

/// Request to check policy compliance against cards
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyComplianceCheckRequest {
    pub card_ids: Vec<Uuid>,
}

/// Response from policy compliance check
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyComplianceCheckResponse {
    pub policy_id: Uuid,
    pub policy_name: String,
    pub total_cards: usize,
    pub compliant: usize,
    pub violations: usize,
    pub results: Vec<CardComplianceResult>,
}

/// Result for a single card's compliance check
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardComplianceResult {
    pub card_id: Uuid,
    pub card_name: String,
    pub status: ComplianceStatus,
    pub missing_requirements: Option<Vec<String>>,
    pub violation_details: Option<Vec<String>>,
}

/// Compliance status of a card
#[derive(Debug, Serialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum ComplianceStatus {
    Compliant,
    Violation,
    Error,
}

/// Response for listing all policy violations
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyViolationListResponse {
    pub data: Vec<PolicyViolation>,
    pub pagination: ViolationPagination,
}

/// Single policy violation record
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyViolation {
    pub policy_id: Uuid,
    pub policy_name: String,
    pub card_id: Uuid,
    pub card_name: String,
    pub severity: PolicySeverity,
    pub enforcement: PolicyEnforcement,
    pub violation_details: Vec<String>,
}

/// Pagination metadata for violations
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ViolationPagination {
    pub total: i64,
}

/// Request to validate a policy against specific cards
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ValidatePolicyRequest {
    pub card_ids: Vec<Uuid>,
}

/// Response from policy validation
#[derive(Debug, Serialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ValidatePolicyResponse {
    pub policy_id: Uuid,
    pub policy_name: String,
    pub total_cards: usize,
    pub compliant: usize,
    pub violations: usize,
    pub results: Vec<CardComplianceResult>,
}

/// Paginated response for policy list
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyListResponse {
    pub data: Vec<ArchitecturePolicy>,
    pub pagination: PolicyPagination,
}

/// Pagination metadata for policies
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PolicyPagination {
    pub page: u32,
    pub limit: u32,
    pub total: i64,
}

/// Query parameters for listing violations
#[derive(Debug, Deserialize, ToSchema, IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct ViolationSearchParams {
    pub severity: Option<PolicySeverity>,
    pub policy_id: Option<Uuid>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}
