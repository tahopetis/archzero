use serde::{Deserialize, Serialize};
use uuid::Uuid;
use utoipa::ToSchema;

/// Initiative status enum
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum InitiativeStatus {
    Planning,
    InProgress,
    OnHold,
    Completed,
    Cancelled,
}

/// Initiative health enum
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum InitiativeHealth {
    OnTrack,
    AtRisk,
    BehindSchedule,
}

/// Initiative type enum
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum InitiativeType {
    Modernization,
    Migration,
    Consolidation,
    NewBuild,
    Decommission,
    Integration,
}

/// Initiative model
#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Initiative {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub initiative_type: InitiativeType,
    pub strategic_theme: String,
    pub budget_total: f64,
    pub budget_spent: f64,
    pub start_date: String,
    pub target_end_date: String,
    pub actual_end_date: Option<String>,
    pub owner: String,
    pub status: InitiativeStatus,
    pub health: InitiativeHealth,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// Create initiative request
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateInitiativeRequest {
    pub name: String,
    #[serde(rename = "type")]
    pub initiative_type: InitiativeType,
    pub strategic_theme: String,
    pub budget_total: f64,
    pub budget_spent: f64,
    pub start_date: String,
    pub target_end_date: String,
    pub actual_end_date: Option<String>,
    pub owner: String,
    pub status: InitiativeStatus,
    pub health: InitiativeHealth,
    pub description: Option<String>,
}

/// Update initiative request
#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInitiativeRequest {
    pub name: Option<String>,
    #[serde(rename = "type")]
    pub initiative_type: Option<InitiativeType>,
    pub strategic_theme: Option<String>,
    pub budget_total: Option<f64>,
    pub budget_spent: Option<f64>,
    pub start_date: Option<String>,
    pub target_end_date: Option<String>,
    pub actual_end_date: Option<String>,
    pub owner: Option<String>,
    pub status: Option<InitiativeStatus>,
    pub health: Option<InitiativeHealth>,
    pub description: Option<String>,
}

/// Initiative search parameters
#[derive(Debug, Deserialize, ToSchema, utoipa::IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct InitiativeSearchParams {
    pub status: Option<InitiativeStatus>,
    pub health: Option<InitiativeHealth>,
    #[serde(rename = "type")]
    pub initiative_type: Option<InitiativeType>,
    pub page: Option<u32>,
}

/// Initiative list response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct InitiativeListResponse {
    pub data: Vec<Initiative>,
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

/// Initiative impact map response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct InitiativeImpactMap {
    pub initiative_id: Uuid,
    pub initiative_name: String,
    pub impacted_cards: Vec<ImpactedCard>,
    pub total_impacted: i64,
}

/// Impacted card in initiative
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct ImpactedCard {
    pub card_id: Uuid,
    pub card_name: String,
    pub card_type: String,
    pub impact_description: String,
    pub current_state: Option<String>,
    pub target_state: Option<String>,
}

/// Card link request
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardLinkRequest {
    pub card_links: Vec<CardLink>,
}

/// Individual card link
#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardLink {
    pub card_id: Uuid,
    pub impact_description: String,
}

/// Card link response
#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CardLinkResponse {
    pub initiative_id: Uuid,
    pub linked_cards: i64,
    pub total_impacted: i64,
}
