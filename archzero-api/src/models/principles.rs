use serde::{Deserialize, Serialize};
use uuid::Uuid;
use utoipa::ToSchema;

/// Architecture Principle category
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum PrincipleCategory {
    Strategic,
    Business,
    Technical,
    Data,
}

/// Architecture Principle - stored as a Card with type ArchitecturePrinciple
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ArchitecturePrinciple {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub card_type: String,
    /// The principle statement (max 500 chars)
    pub statement: String,
    /// Rationale for the principle (max 2000 chars)
    pub rationale: String,
    /// List of implications
    pub implications: Vec<String>,
    /// Owner of this principle (max 100 chars)
    pub owner: String,
    /// Category of the principle
    pub category: PrincipleCategory,
    /// Adherence rate (0-100, auto-calculated)
    pub adherence_rate: i32,
    /// Quality score
    pub quality_score: Option<i32>,
    pub created_at: String,
    pub updated_at: String,
}

/// Request to create a new Architecture Principle
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreatePrincipleRequest {
    pub name: String,
    pub description: Option<String>,
    /// The principle statement (max 500 chars)
    pub statement: String,
    /// Rationale for the principle (max 2000 chars)
    pub rationale: String,
    /// List of implications
    pub implications: Vec<String>,
    /// Owner of this principle (max 100 chars)
    pub owner: String,
    /// Category of the principle
    pub category: PrincipleCategory,
}

/// Request to update an existing Architecture Principle
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdatePrincipleRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub statement: Option<String>,
    pub rationale: Option<String>,
    pub implications: Option<Vec<String>>,
    pub owner: Option<String>,
    pub category: Option<PrincipleCategory>,
}

/// Search parameters for listing principles
#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct PrincipleSearchParams {
    /// Filter by category
    pub category: Option<PrincipleCategory>,
    /// Filter by owner
    pub owner: Option<String>,
    /// Page number (default: 1)
    pub page: Option<u32>,
    /// Items per page (default: 50)
    pub limit: Option<u32>,
}

/// Principle compliance/adherence report
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PrincipleComplianceReport {
    pub principle_id: Uuid,
    pub principle_name: String,
    /// Adherence rate (0-100)
    pub adherence_rate: i32,
    /// Number of compliant cards
    pub compliant_cards: i32,
    /// Number of non-compliant cards
    pub non_compliant_cards: i32,
    /// Number of exempt cards
    pub exempt_cards: i32,
    /// List of violations with reasons
    pub violations: Vec<ComplianceViolation>,
}

/// A compliance violation record
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ComplianceViolation {
    pub card_name: String,
    pub card_id: Uuid,
    pub reason: String,
    pub exception_id: Option<Uuid>,
}

/// List response with pagination
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct PrinciplesListResponse {
    pub data: Vec<ArchitecturePrinciple>,
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
