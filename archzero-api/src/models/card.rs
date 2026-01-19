use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use utoipa::{ToSchema, IntoParams};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum CardType {
    // Layer A: Strategic
    BusinessCapability,
    Objective,
    // Layer B: Application
    Application,
    Interface,
    // Layer C: Technology
    ITComponent,
    Platform,
    // Layer D: Governance (added in Phase 3)
    ArchitecturePrinciple,
    TechnologyStandard,
    ArchitecturePolicy,
    Exception,
    Initiative,
    Risk,
    ComplianceRequirement,
    ComplianceAudit,
    // Layer E: ARB (Architecture Review Board)
    ARBMeeting,
    ARBSubmission,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, ToSchema)]
#[serde(rename_all = "PascalCase")]
pub enum LifecyclePhase {
    Discovery,
    Strategy,
    Planning,
    Development,
    Testing,
    Active,
    Decommissioned,
    Retired,
}

#[derive(Debug, Serialize, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: CardType,
    pub lifecycle_phase: LifecyclePhase,
    pub quality_score: Option<i32>,
    pub description: Option<String>,
    pub owner_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub attributes: serde_json::Value,
    pub tags: Vec<String>,
    pub status: String,
}

#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateCardRequest {
    pub name: String,
    #[serde(rename = "type")]
    pub card_type: CardType,
    pub lifecycle_phase: LifecyclePhase,
    pub quality_score: Option<i32>,
    pub description: Option<String>,
    pub owner_id: Option<Uuid>,
    pub attributes: Option<serde_json::Value>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Clone, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateCardRequest {
    pub name: Option<String>,
    pub lifecycle_phase: Option<LifecyclePhase>,
    pub quality_score: Option<i32>,
    pub description: Option<String>,
    pub attributes: Option<serde_json::Value>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Clone, ToSchema, IntoParams)]
#[serde(rename_all = "camelCase")]
pub struct CardSearchParams {
    pub q: Option<String>,
    #[serde(rename = "type")]
    pub card_type: Option<CardType>,
    pub lifecycle_phase: Option<LifecyclePhase>,
    pub tags: Option<Vec<String>>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}
