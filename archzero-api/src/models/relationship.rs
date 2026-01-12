use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "PascalCase")]
pub enum RelationshipType {
    // Core dependencies
    ReliesOn,
    DependsOn,
    // Governance relationships (Phase 3)
    Guides,
    Standardizes,
    AppliesTo,
    Enforces,
    Impacts,
    Achieves,
    Threatens,
    MitigatedBy,
    RequiresComplianceFrom,
    ExemptsFrom,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Relationship {
    pub id: Uuid,
    pub from_card_id: Uuid,
    pub to_card_id: Uuid,
    pub relationship_type: RelationshipType,
    pub valid_from: String,  // ISO date string
    pub valid_to: Option<String>,  // ISO date string
    pub attributes: serde_json::Value,
    pub confidence: Option<f64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateRelationshipRequest {
    pub from_card_id: Uuid,
    pub to_card_id: Uuid,
    pub relationship_type: RelationshipType,
    pub valid_from: Option<String>,  // ISO date string
    pub valid_to: Option<String>,  // ISO date string
    pub attributes: Option<serde_json::Value>,
    pub confidence: Option<f64>,
}
