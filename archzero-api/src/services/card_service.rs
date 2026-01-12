use anyhow::Result;
use sqlx::PgPool;
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

        let card = Card {
            id: card_id,
            name: req.name,
            card_type: req.card_type,
            lifecycle_phase: req.lifecycle_phase,
            quality_score: req.quality_score,
            description: req.description,
            owner_id: req.owner_id,
            created_at: now,
            updated_at: now,
            attributes: req.attributes.unwrap_or_default(),
            tags: req.tags.unwrap_or_default(),
            status: "active".to_string(),
        };

        // TODO: This will fail until cards table is created in migration
        Ok(card)
    }

    pub async fn get(&self, id: Uuid) -> Result<Card, AppError> {
        // TODO: Implement when cards table exists
        Err(AppError::NotFound("Card not found".to_string()))
    }

    pub async fn list(&self, _params: CardSearchParams) -> Result<Vec<Card>, AppError> {
        // TODO: Implement when cards table exists
        Ok(vec![])
    }

    pub async fn update(&self, _id: Uuid, _req: UpdateCardRequest) -> Result<Card, AppError> {
        // TODO: Implement when cards table exists
        Err(AppError::NotFound("Not implemented yet".to_string()))
    }

    pub async fn delete(&self, _id: Uuid) -> Result<(), AppError> {
        // TODO: Implement soft delete when cards table exists
        Err(AppError::NotFound("Not implemented yet".to_string()))
    }
}
