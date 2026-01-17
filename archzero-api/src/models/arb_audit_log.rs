use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow)]
pub struct ARBAuditLog {
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor_id: Uuid,
    pub actor_name: String,
    pub actor_role: Option<String>,
    pub changes: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAuditLogRequest {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub action: String,
    pub actor_id: Uuid,
    pub actor_name: String,
    pub actor_role: Option<String>,
    pub changes: Option<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
}

pub type AuditLogFilter = crate::handlers::arb::AuditLogFilter;
