use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

/// ARB Template for reusing submission data
#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ARBTemplate {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub request_type: String,
    pub card_id: Option<Uuid>,
    pub template_data: serde_json::Value,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create a template from an existing submission
#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub title: String,
    pub description: Option<String>,
    pub submission_id: Uuid,
}

/// Request to create a new submission from a template
#[derive(Debug, Deserialize)]
pub struct CreateFromTemplateRequest {
    pub template_id: Uuid,
    pub title: String,
    pub card_id: Option<Uuid>,
    pub additional_notes: Option<String>,
}

/// Request to update an existing template
#[derive(Debug, Deserialize)]
pub struct UpdateTemplateRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub template_data: Option<serde_json::Value>,
}
