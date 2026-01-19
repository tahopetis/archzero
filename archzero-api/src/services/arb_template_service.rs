use anyhow::Result;
use sqlx::{PgPool, FromRow};
use uuid::Uuid;
use chrono::{Utc, DateTime};

use crate::models::arb_template::*;
use crate::error::AppError;

pub struct ArbTemplateService {
    pool: PgPool,
}

impl ArbTemplateService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// List all templates
    pub async fn list_templates(&self) -> Result<Vec<ARBTemplate>, AppError> {
        let templates = sqlx::query_as::<_, ARBTemplate>(
            "SELECT id, title, description, request_type, card_id, template_data, created_by, created_at, updated_at
             FROM arb_templates
             ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        Ok(templates)
    }

    /// Get a template by ID
    pub async fn get_template(&self, id: Uuid) -> Result<ARBTemplate, AppError> {
        let template = sqlx::query_as::<_, ARBTemplate>(
            "SELECT id, title, description, request_type, card_id, template_data, created_by, created_at, updated_at
             FROM arb_templates
             WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Template not found".to_string()))?;

        Ok(template)
    }

    /// Create a template from an existing submission
    pub async fn create_template(
        &self,
        req: CreateTemplateRequest,
        user_id: Uuid,
    ) -> Result<ARBTemplate, AppError> {
        // Get the submission to copy data from
        let submission: Option<(serde_json::Value, Option<String>)> = sqlx::query_as(
            "SELECT c.attributes, c.attributes->>'submissionType' as submission_type
             FROM cards c
             WHERE c.id = $1"
        )
        .bind(req.submission_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        let (template_data, submission_type) = submission
            .ok_or_else(|| AppError::NotFound("Submission not found".to_string()))?;

        let submission_type = submission_type.unwrap_or("application".to_string());

        let template_id = Uuid::new_v4();
        let now = Utc::now();

        let template = sqlx::query_as::<_, ARBTemplate>(
            "INSERT INTO arb_templates (id, title, description, request_type, card_id, template_data, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, title, description, request_type, card_id, template_data, created_by, created_at, updated_at"
        )
        .bind(template_id)
        .bind(&req.title)
        .bind(&req.description)
        .bind(&submission_type)
        .bind(req.submission_id)
        .bind(&template_data)
        .bind(user_id)
        .bind(now)
        .bind(now)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        Ok(template)
    }

    /// Create a submission from a template
    pub async fn create_from_template(
        &self,
        req: CreateFromTemplateRequest,
        user_id: Uuid,
    ) -> Result<crate::models::arb::ARBSubmission, AppError> {
        // Get the template
        let template = self.get_template(req.template_id).await?;

        // Extract and modify template data
        let mut attributes = template.template_data;
        if let Some(obj) = attributes.as_object_mut() {
            obj.insert("title".to_string(), serde_json::json!(req.title));
            if let Some(notes) = req.additional_notes {
                obj.insert("additionalNotes".to_string(), serde_json::json!(notes));
            }
        }

        let now = Utc::now();
        let submission_id = Uuid::new_v4();

        // Build final attributes
        let mut final_attrs = attributes;
        final_attrs["submissionType"] = serde_json::json!(template.request_type);
        final_attrs["submittedBy"] = serde_json::json!(user_id);
        final_attrs["submittedAt"] = serde_json::json!(now.to_rfc3339());
        final_attrs["status"] = serde_json::json!("pending");
        if let Some(card_id) = req.card_id {
            final_attrs["cardId"] = serde_json::json!(card_id);
        }

        // Create submission card
        sqlx::query(
            "INSERT INTO cards (id, name, card_type, lifecycle_phase, attributes, owner_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)"
        )
        .bind(submission_id)
        .bind(&req.title)
        .bind("arb_submission")
        .bind("development")
        .bind(&final_attrs)
        .bind(user_id)
        .bind(now)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        // Fetch and convert to ARBSubmission
        let card = sqlx::query_as::<_, (Uuid, String, String, String, serde_json::Value, Option<Uuid>, chrono::DateTime<Utc>, chrono::DateTime<Utc>)>(
            "SELECT id, name, card_type, lifecycle_phase, attributes, owner_id, created_at, updated_at
             FROM cards WHERE id = $1"
        )
        .bind(submission_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

        // Convert to ARBSubmission
        let card_obj = crate::models::card::Card {
            id: card.0,
            name: card.1,
            card_type: serde_json::from_str::<crate::models::card::CardType>(
                &format!("\"{}\"", card.2)
            ).unwrap_or(crate::models::card::CardType::ARBSubmission),
            lifecycle_phase: serde_json::from_str::<crate::models::card::LifecyclePhase>(
                &format!("\"{}\"", card.3)
            ).unwrap_or(crate::models::card::LifecyclePhase::Development),
            attributes: card.4,
            owner_id: card.5,
            created_at: card.6,
            updated_at: card.7,
            quality_score: None,
            description: None,
            tags: vec![],
            status: "active".to_string(),
        };

        // Use the helper function from arb.rs
        let arb_submission = crate::handlers::arb::card_to_arb_submission(card_obj)?;
        Ok(arb_submission)
    }

    /// Update a template
    pub async fn update_template(&self, id: Uuid, req: UpdateTemplateRequest) -> Result<ARBTemplate, AppError> {
        let now = Utc::now();

        let template = sqlx::query_as::<_, ARBTemplate>(
            "UPDATE arb_templates
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 template_data = COALESCE($3, template_data),
                 updated_at = $4
             WHERE id = $5
             RETURNING id, title, description, request_type, card_id, template_data, created_by, created_at, updated_at"
        )
        .bind(req.title)
        .bind(req.description)
        .bind(req.template_data)
        .bind(now)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?
        .ok_or_else(|| AppError::NotFound("Template not found".to_string()))?;

        Ok(template)
    }

    /// Delete a template
    pub async fn delete_template(&self, id: Uuid) -> Result<(), AppError> {
        let rows_affected = sqlx::query("DELETE FROM arb_templates WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?
            .rows_affected();

        if rows_affected == 0 {
            return Err(AppError::NotFound("Template not found".to_string()));
        }

        Ok(())
    }
}
