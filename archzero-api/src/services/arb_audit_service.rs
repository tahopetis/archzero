use sqlx::PgPool;
use uuid::Uuid;
use serde_json::json;
use crate::models::arb_audit_log::{ARBAuditLog, CreateAuditLogRequest};
use crate::error::AppError;

pub struct ARBAuditService {
    pool: PgPool,
}

impl ARBAuditService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Log an audit event
    pub async fn log_audit_event(
        &self,
        request: CreateAuditLogRequest,
        ip_address: Option<String>,
        user_agent: Option<String>,
    ) -> Result<ARBAuditLog, AppError> {
        let id = Uuid::new_v4();
        let now = chrono::Utc::now();

        let audit_log = sqlx::query_as::<_, ARBAuditLog>(
            r#"
            INSERT INTO arb_audit_logs
            (id, entity_type, entity_id, action, actor_id, actor_name, actor_role,
             changes, metadata, ip_address, user_agent, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#
        )
        .bind(id)
        .bind(&request.entity_type)
        .bind(request.entity_id)
        .bind(&request.action)
        .bind(request.actor_id)
        .bind(&request.actor_name)
        .bind(&request.actor_role)
        .bind(&request.changes)
        .bind(&request.metadata)
        .bind(&ip_address)
        .bind(&user_agent)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create audit log: {}", e)))?;

        Ok(audit_log)
    }

    /// Get audit logs for an entity
    pub async fn get_entity_logs(
        &self,
        entity_type: &str,
        entity_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ARBAuditLog>, AppError> {
        let logs = sqlx::query_as::<_, ARBAuditLog>(
            r#"
            SELECT * FROM arb_audit_logs
            WHERE entity_type = $1 AND entity_id = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            "#
        )
        .bind(entity_type)
        .bind(entity_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch audit logs: {}", e)))?;

        Ok(logs)
    }

    /// Get audit logs with filters
    pub async fn get_logs_filtered(
        &self,
        filters: AuditLogFilter,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ARBAuditLog>, AppError> {
        let mut query = String::from(
            "SELECT * FROM arb_audit_logs WHERE 1=1"
        );

        let mut param_count = 0;
        let mut params: Vec<String> = Vec::new();

        if let Some(entity_type) = &filters.entity_type {
            param_count += 1;
            query.push_str(&format!(" AND entity_type = ${}", param_count));
            params.push(entity_type.clone());
        }

        if let Some(entity_id) = filters.entity_id {
            param_count += 1;
            query.push_str(&format!(" AND entity_id = ${}", param_count));
            params.push(entity_id.to_string());
        }

        if let Some(action) = &filters.action {
            param_count += 1;
            query.push_str(&format!(" AND action = ${}", param_count));
            params.push(action.clone());
        }

        if let Some(actor_id) = filters.actor_id {
            param_count += 1;
            query.push_str(&format!(" AND actor_id = ${}", param_count));
            params.push(actor_id.to_string());
        }

        if let Some(start_date) = filters.start_date {
            param_count += 1;
            query.push_str(&format!(" AND created_at >= ${}", param_count));
            params.push(start_date);
        }

        if let Some(end_date) = filters.end_date {
            param_count += 1;
            query.push_str(&format!(" AND created_at <= ${}", param_count));
            params.push(end_date);
        }

        query.push_str(&format!(" ORDER BY created_at DESC LIMIT {} OFFSET {}", limit, offset));

        // For simplicity, using a basic query here
        // In production, you'd want to use sqlx's query! macro or build the query more carefully
        let logs = if filters.entity_type.is_some() && filters.entity_id.is_some() {
            self.get_entity_logs(
                filters.entity_type.as_ref().unwrap(),
                filters.entity_id.unwrap(),
                limit,
                offset,
            )
            .await?
        } else {
            sqlx::query_as::<_, ARBAuditLog>(&query)
                .fetch_all(&self.pool)
                .await
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch audit logs: {}", e)))?
        };

        Ok(logs)
    }
}

// Audit log filter struct
#[derive(Debug, Clone, Default)]
pub struct AuditLogFilter {
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub action: Option<String>,
    pub actor_id: Option<Uuid>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}
