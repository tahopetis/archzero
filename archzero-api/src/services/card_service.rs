use anyhow::Result;
use sqlx::{PgPool, Row};
use uuid::Uuid;
use chrono::Utc;

use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::error::AppError;

pub struct CardService {
    pool: PgPool,
}

impl CardService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, req: CreateCardRequest) -> Result<Card, AppError> {
        let card_id = Uuid::new_v4();
        let now = Utc::now();

        let card_type_str = serde_json::to_string(&req.card_type)
            .map_err(|e| anyhow::anyhow!("Failed to serialize card type: {}", e))?
            .trim_matches('"')
            .to_string();

        let lifecycle_phase_str = serde_json::to_string(&req.lifecycle_phase)
            .map_err(|e| anyhow::anyhow!("Failed to serialize lifecycle phase: {}", e))?
            .trim_matches('"')
            .to_string();

        sqlx::query(
            r#"
            INSERT INTO cards (id, name, type, lifecycle_phase, quality_score, description, owner_id, created_at, updated_at, attributes, tags, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
        )
        .bind(card_id)
        .bind(&req.name)
        .bind(&card_type_str)
        .bind(&lifecycle_phase_str)
        .bind(req.quality_score)
        .bind(&req.description)
        .bind(req.owner_id)
        .bind(now)
        .bind(now)
        .bind(&req.attributes.unwrap_or_else(|| serde_json::json!({})))
        .bind(&req.tags.unwrap_or_default())
        .bind("active")
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create card: {}", e)))?;

        self.get(card_id).await
    }

    pub async fn get(&self, id: Uuid) -> Result<Card, AppError> {
        let row = sqlx::query(
            r#"
            SELECT id, name, type, lifecycle_phase, quality_score, description, owner_id,
                   created_at, updated_at, attributes, tags, status
            FROM cards
            WHERE id = $1 AND status = 'active'
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to fetch card: {}", e)))?
        .ok_or_else(|| AppError::NotFound(format!("Card {} not found", id)))?;

        self.row_to_card(row)
    }

    pub async fn list(&self, params: CardSearchParams) -> Result<(Vec<Card>, i64), AppError> {
        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let offset = (page - 1) * page_size;

        // Build parameterized query to prevent SQL injection
        let mut base_query = "SELECT id, name, type, lifecycle_phase, quality_score, description, owner_id, created_at, updated_at, attributes, tags, status FROM cards WHERE status = 'active'".to_string();
        let mut base_count = "SELECT COUNT(*) FROM cards WHERE status = 'active'".to_string();
        let mut conditions = Vec::new();
        let mut param_idx = 1;

        // Search query parameter
        let search_pattern = if let Some(q) = &params.q {
            param_idx += 1;
            conditions.push(format!("(name ILIKE ${} OR description ILIKE ${})", param_idx - 1, param_idx));
            param_idx += 1;
            Some(format!("%{}%", q))
        } else {
            None
        };

        // Card type parameter
        let card_type_str = if let Some(card_type) = &params.card_type {
            param_idx += 1;
            let type_str = serde_json::to_string(card_type)
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize card type: {}", e)))?
                .trim_matches('"')
                .to_string();
            conditions.push(format!("type = ${}", param_idx));
            Some(type_str)
        } else {
            None
        };

        // Lifecycle phase parameter
        let lifecycle_phase_str = if let Some(lifecycle_phase) = &params.lifecycle_phase {
            param_idx += 1;
            let phase_str = serde_json::to_string(lifecycle_phase)
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize lifecycle phase: {}", e)))?
                .trim_matches('"')
                .to_string();
            conditions.push(format!("lifecycle_phase = ${}", param_idx));
            Some(phase_str)
        } else {
            None
        };

        // Tags parameter - use ANY for secure parameterization
        let tags_array = if let Some(tags) = &params.tags {
            if !tags.is_empty() {
                param_idx += 1;
                conditions.push(format!("tags && ${}", param_idx));
                Some(tags.clone())
            } else {
                None
            }
        } else {
            None
        };

        // Build final queries with conditions
        if !conditions.is_empty() {
            base_query = format!("{} {}", base_query, "AND ".to_string() + &conditions.join(" AND "));
            base_count = format!("{} {}", base_count, "AND ".to_string() + &conditions.join(" AND "));
        }

        // Build count query with parameters
        let mut count_query = sqlx::query_as::<_, (i64,)>(&base_count);

        // Bind parameters in correct order
        if let Some(ref pattern) = search_pattern {
            count_query = count_query.bind(pattern).bind(pattern);
        }
        if let Some(ref type_str) = card_type_str {
            count_query = count_query.bind(type_str);
        }
        if let Some(ref phase_str) = lifecycle_phase_str {
            count_query = count_query.bind(phase_str);
        }
        if let Some(ref tags) = tags_array {
            count_query = count_query.bind(tags);
        }

        let count_row = count_query
            .fetch_one(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to count cards: {}", e)))?;

        // Build data query with parameters
        let data_query = format!("{} ORDER BY created_at DESC LIMIT ${} OFFSET ${}",
            base_query, param_idx + 1, param_idx + 2);

        let mut data_query_builder = sqlx::query(&data_query);

        // Bind parameters in correct order
        if let Some(ref pattern) = search_pattern {
            data_query_builder = data_query_builder.bind(pattern).bind(pattern);
        }
        if let Some(ref type_str) = card_type_str {
            data_query_builder = data_query_builder.bind(type_str);
        }
        if let Some(ref phase_str) = lifecycle_phase_str {
            data_query_builder = data_query_builder.bind(phase_str);
        }
        if let Some(ref tags) = tags_array {
            data_query_builder = data_query_builder.bind(tags);
        }
        data_query_builder = data_query_builder.bind(page_size as i64).bind(offset as i64);

        let rows = data_query_builder
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to list cards: {}", e)))?;

        let mut cards = Vec::new();
        for row in rows {
            match self.row_to_card(row) {
                Ok(card) => cards.push(card),
                Err(e) => {
                    tracing::warn!("Failed to parse card row: {:?}", e);
                    continue;
                }
            }
        }

        Ok((cards, count_row.0))
    }

    pub async fn update(&self, id: Uuid, req: UpdateCardRequest) -> Result<Card, AppError> {
        let now = Utc::now();

        // Build dynamic UPDATE query
        let mut updates = Vec::new();
        let mut param_idx = 2;

        if req.name.is_some() {
            updates.push(format!("name = ${}", param_idx));
            param_idx += 1;
        }
        if req.lifecycle_phase.is_some() {
            updates.push(format!("lifecycle_phase = ${}", param_idx));
            param_idx += 1;
        }
        if req.quality_score.is_some() {
            updates.push(format!("quality_score = ${}", param_idx));
            param_idx += 1;
        }
        if req.description.is_some() {
            updates.push(format!("description = ${}", param_idx));
            param_idx += 1;
        }
        if req.attributes.is_some() {
            updates.push(format!("attributes = ${}", param_idx));
            param_idx += 1;
        }
        if req.tags.is_some() {
            updates.push(format!("tags = ${}", param_idx));
            param_idx += 1;
        }

        if updates.is_empty() {
            return self.get(id).await;
        }

        updates.push(format!("updated_at = ${}", param_idx));

        let update_query = format!(
            "UPDATE cards SET {} WHERE id = $1 AND status = 'active'",
            updates.join(", ")
        );

        let mut query_builder = sqlx::query(&update_query).bind(id);

        if let Some(name) = &req.name {
            query_builder = query_builder.bind(name);
        }
        if let Some(lifecycle_phase) = &req.lifecycle_phase {
            let phase_str = serde_json::to_string(lifecycle_phase)
                .unwrap_or_default()
                .trim_matches('"')
                .to_string();
            query_builder = query_builder.bind(phase_str);
        }
        if let Some(quality_score) = req.quality_score {
            query_builder = query_builder.bind(quality_score);
        }
        if let Some(description) = &req.description {
            query_builder = query_builder.bind(description);
        }
        if let Some(attributes) = &req.attributes {
            query_builder = query_builder.bind(attributes);
        }
        if let Some(tags) = &req.tags {
            query_builder = query_builder.bind(tags);
        }
        query_builder = query_builder.bind(now);

        query_builder
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to update card: {}", e)))?;

        self.get(id).await
    }

    pub async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        let result = sqlx::query(
            "UPDATE cards SET status = 'deleted', updated_at = $1 WHERE id = $2"
        )
        .bind(Utc::now())
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to delete card: {}", e)))?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound(format!("Card {} not found", id)));
        }

        Ok(())
    }
}

impl CardService {
    fn row_to_card(&self, row: sqlx::postgres::PgRow) -> Result<Card, AppError> {
        let type_str: String = row.try_get("type")
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing type column: {}", e)))?;

        let lifecycle_phase_str: String = row.try_get("lifecycle_phase")
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing lifecycle_phase column: {}", e)))?;

        let card_type: crate::models::card::CardType = serde_json::from_str(&format!("\"{}\"", type_str))
            .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid card type: {}", type_str)))?;

        let lifecycle_phase: crate::models::card::LifecyclePhase = serde_json::from_str(&format!("\"{}\"", lifecycle_phase_str))
            .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid lifecycle phase: {}", lifecycle_phase_str)))?;

        Ok(Card {
            id: row.try_get("id")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing id: {}", e)))?,
            name: row.try_get("name")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing name: {}", e)))?,
            card_type,
            lifecycle_phase,
            quality_score: row.try_get("quality_score").ok(),
            description: row.try_get("description").ok(),
            owner_id: row.try_get("owner_id").ok(),
            created_at: row.try_get("created_at")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing created_at: {}", e)))?,
            updated_at: row.try_get("updated_at")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing updated_at: {}", e)))?,
            attributes: row.try_get("attributes")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing attributes: {}", e)))?,
            tags: row.try_get("tags")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing tags: {}", e)))?,
            status: row.try_get("status")
                .map_err(|e| AppError::Internal(anyhow::anyhow!("Missing status: {}", e)))?,
        })
    }
}
