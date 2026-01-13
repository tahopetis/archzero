use anyhow::Result;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::Utc;

use crate::models::relationship::{Relationship, CreateRelationshipRequest, UpdateRelationshipRequest};
use crate::error::AppError;

pub struct RelationshipService {
    pool: PgPool,
}

impl RelationshipService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateRelationshipRequest) -> Result<Relationship, AppError> {
        let relationship_id = Uuid::new_v4();
        let now = Utc::now();
        let valid_from = req.valid_from.unwrap_or_else(|| now.format("%Y-%m-%d").to_string());

        let relationship_type_str = serde_json::to_string(&req.relationship_type)
            .map_err(|e| anyhow::anyhow!("Failed to serialize relationship type: {}", e))?
            .trim_matches('"')
            .to_string();

        sqlx::query(
            r#"
            INSERT INTO relationships (id, from_card_id, to_card_id, relationship_type, valid_from, valid_to, attributes, confidence, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (from_card_id, to_card_id, relationship_type, valid_from) DO NOTHING
            "#,
        )
        .bind(relationship_id)
        .bind(req.from_card_id)
        .bind(req.to_card_id)
        .bind(&relationship_type_str)
        .bind(&valid_from)
        .bind(&req.valid_to)
        .bind(&req.attributes.unwrap_or_else(|| serde_json::json!({})))
        .bind(req.confidence)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create relationship: {}", e)))?;

        self.get(relationship_id).await
    }

    pub async fn get(&self, id: Uuid) -> Result<Relationship, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, from_card_id, to_card_id, relationship_type, valid_from, valid_to, attributes, confidence, created_at
            FROM relationships
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch relationship: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Relationship {} not found", id)))?;

        self.row_to_relationship(row)
    }

    pub async fn list_for_card(&self, card_id: Uuid) -> Result<Vec<Relationship>, AppError> {
        let rows = sqlx::query(
            r#"
            SELECT id, from_card_id, to_card_id, relationship_type, valid_from, valid_to, attributes, confidence, created_at
            FROM relationships
            WHERE from_card_id = $1 OR to_card_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(card_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to list relationships: {}", e)))?;

        let mut relationships = Vec::new();
        for row in rows {
            match self.row_to_relationship(row) {
                Ok(rel) => relationships.push(rel),
                Err(e) => {
                    tracing::warn!("Failed to parse relationship row: {:?}", e);
                    continue;
                }
            }
        }

        Ok(relationships)
    }

    pub async fn update(&self, id: Uuid, req: UpdateRelationshipRequest) -> Result<Relationship, AppError> {
        let mut updates = Vec::new();
        let mut param_idx = 2;

        if req.valid_from.is_some() {
            updates.push(format!("valid_from = ${}", param_idx));
            param_idx += 1;
        }
        if req.valid_to.is_some() {
            updates.push(format!("valid_to = ${}", param_idx));
            param_idx += 1;
        }
        if req.attributes.is_some() {
            updates.push(format!("attributes = ${}", param_idx));
            param_idx += 1;
        }
        if req.confidence.is_some() {
            updates.push(format!("confidence = ${}", param_idx));
            param_idx += 1;
        }

        if updates.is_empty() {
            return self.get(id).await;
        }

        let update_query = format!(
            "UPDATE relationships SET {} WHERE id = $1",
            updates.join(", ")
        );

        let mut query_builder = sqlx::query(&update_query).bind(id);

        if let Some(valid_from) = &req.valid_from {
            query_builder = query_builder.bind(valid_from);
        }
        if let Some(valid_to) = &req.valid_to {
            query_builder = query_builder.bind(valid_to);
        }
        if let Some(attributes) = &req.attributes {
            query_builder = query_builder.bind(attributes);
        }
        if let Some(confidence) = req.confidence {
            query_builder = query_builder.bind(confidence);
        }

        query_builder
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to update relationship: {}", e)))?;

        self.get(id).await
    }

    pub async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        let result = sqlx::query("DELETE FROM relationships WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to delete relationship: {}", e)))?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Relationship {} not found", id)));
        }

        Ok(())
    }
}

impl RelationshipService {
    fn row_to_relationship(&self, row: sqlx::postgres::PgRow) -> Result<Relationship, AppError> {
        let type_str: String = row.try_get("relationship_type")
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing relationship_type: {}", e)))?;

        let relationship_type: crate::models::relationship::RelationshipType =
            serde_json::from_str(&format!("\"{}\"", type_str))
                .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid relationship type: {}", type_str)))?;

        Ok(Relationship {
            id: row.try_get("id")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing id: {}", e)))?,
            from_card_id: row.try_get("from_card_id")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing from_card_id: {}", e)))?,
            to_card_id: row.try_get("to_card_id")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing to_card_id: {}", e)))?,
            relationship_type,
            valid_from: row.try_get("valid_from")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing valid_from: {}", e)))?,
            valid_to: row.try_get("valid_to").ok(),
            attributes: row.try_get("attributes")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing attributes: {}", e)))?,
            confidence: row.try_get("confidence").ok(),
            created_at: row.try_get("created_at")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing created_at: {}", e)))?,
        })
    }
}
