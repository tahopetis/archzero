use uuid::Uuid;
use std::sync::Arc;

use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest};
use crate::models::relationship::{Relationship, CreateRelationshipRequest};
use crate::services::{CardService, RelationshipService, Neo4jService};
use crate::error::AppError;

/// SAGA orchestrator for dual-write operations between PostgreSQL and Neo4j
/// Implements the SAGA pattern to ensure data consistency across databases
#[derive(Clone)]
pub struct SagaOrchestrator {
    card_service: Arc<CardService>,
    relationship_service: Arc<RelationshipService>,
    neo4j_service: Arc<Neo4jService>,
}

impl SagaOrchestrator {
    pub fn new(
        card_service: Arc<CardService>,
        relationship_service: Arc<RelationshipService>,
        neo4j_service: Arc<Neo4jService>,
    ) -> Self {
        Self {
            card_service,
            relationship_service,
            neo4j_service,
        }
    }

    /// Create card with SAGA pattern:
    /// 1. Create in PostgreSQL (primary)
    /// 2. Create in Neo4j (secondary)
    /// 3. If Neo4j fails, compensate by deleting from PostgreSQL
    pub async fn create_card(&self, req: CreateCardRequest) -> Result<Card, AppError> {
        // Step 1: Create card in PostgreSQL
        let card = match self.card_service.create(req).await {
            Ok(c) => c,
            Err(e) => return Err(e),
        };

        // Step 2: Create card node in Neo4j
        if let Err(e) = self.neo4j_service.create_card_node(&card).await {
            tracing::error!("Neo4j sync failed: {}", e);

            // Compensating transaction: Delete from PostgreSQL
            if let Err(compensate_err) = self.card_service.delete(card.id).await {
                tracing::error!("Failed to compensate PostgreSQL delete: {}", compensate_err);
            }

            return Err(AppError::Internal(anyhow::anyhow!(
                "Failed to sync card to Neo4j, rolled back PostgreSQL: {}", e
            )));
        }

        Ok(card)
    }

    /// Update card with SAGA pattern:
    /// 1. Update in PostgreSQL
    /// 2. Update in Neo4j
    /// 3. If Neo4j fails, compensate by reverting PostgreSQL update (snapshot approach)
    pub async fn update_card(&self, id: Uuid, req: UpdateCardRequest) -> Result<Card, AppError> {
        // Snapshot current state for potential compensation
        let snapshot = self.card_service.get(id).await?;

        // Step 1: Update in PostgreSQL
        let card = match self.card_service.update(id, req.clone()).await {
            Ok(c) => c,
            Err(e) => return Err(e),
        };

        // Step 2: Update in Neo4j
        if let Err(e) = self.neo4j_service.update_card_node(&card).await {
            tracing::error!("Neo4j sync failed: {}", e);

            // Compensating transaction: Revert to snapshot
            if let Err(compensate_err) = self.revert_card_update(snapshot).await {
                tracing::error!("Failed to compensate PostgreSQL revert: {}", compensate_err);
            }

            return Err(AppError::Internal(anyhow::anyhow!(
                "Failed to sync card update to Neo4j, rolled back: {}", e
            )));
        }

        Ok(card)
    }

    /// Delete card with SAGA pattern:
    /// 1. Soft delete in PostgreSQL
    /// 2. Delete from Neo4j
    /// 3. If Neo4j fails, compensate by restoring in PostgreSQL
    pub async fn delete_card(&self, id: Uuid) -> Result<(), AppError> {
        // Snapshot current state
        let snapshot = self.card_service.get(id).await?;

        // Step 1: Soft delete in PostgreSQL
        if let Err(e) = self.card_service.delete(id).await {
            return Err(e);
        }

        // Step 2: Delete from Neo4j
        if let Err(e) = self.neo4j_service.delete_card_node(id).await {
            tracing::error!("Neo4j sync failed: {}", e);

            // Compensating transaction: Restore in PostgreSQL
            if let Err(compensate_err) = self.restore_card(snapshot).await {
                tracing::error!("Failed to compensate PostgreSQL restore: {}", compensate_err);
            }

            return Err(AppError::Internal(anyhow::anyhow!(
                "Failed to sync card deletion to Neo4j, rolled back: {}", e
            )));
        }

        Ok(())
    }

    /// Create relationship with SAGA pattern
    pub async fn create_relationship(&self, req: CreateRelationshipRequest) -> Result<Relationship, AppError> {
        // Step 1: Create in PostgreSQL
        let relationship = match self.relationship_service.create(req).await {
            Ok(r) => r,
            Err(e) => return Err(e),
        };

        // Step 2: Create in Neo4j
        if let Err(e) = self.neo4j_service.create_relationship(&relationship).await {
            tracing::error!("Neo4j sync failed: {}", e);

            // Compensating transaction: Delete from PostgreSQL
            if let Err(compensate_err) = self.relationship_service.delete(relationship.id).await {
                tracing::error!("Failed to compensate PostgreSQL delete: {}", compensate_err);
            }

            return Err(AppError::Internal(anyhow::anyhow!(
                "Failed to sync relationship to Neo4j, rolled back: {}", e
            )));
        }

        Ok(relationship)
    }

    /// Compensating transaction: Revert card to snapshot state
    async fn revert_card_update(&self, snapshot: Card) -> Result<(), AppError> {
        let revert_req = UpdateCardRequest {
            name: Some(snapshot.name.clone()),
            lifecycle_phase: Some(snapshot.lifecycle_phase.clone()),
            quality_score: snapshot.quality_score,
            description: snapshot.description.clone(),
            attributes: Some(snapshot.attributes.clone()),
            tags: Some(snapshot.tags.clone()),
        };

        self.card_service
            .update(snapshot.id, revert_req)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to revert card: {}", e)))?;

        Ok(())
    }

    /// Compensating transaction: Restore deleted card
    async fn restore_card(&self, snapshot: Card) -> Result<(), AppError> {
        // This is a simplified restore - in production you'd store the full snapshot
        // For now, we'll create a new card with the snapshot data
        let create_req = CreateCardRequest {
            name: snapshot.name,
            card_type: snapshot.card_type,
            lifecycle_phase: snapshot.lifecycle_phase,
            quality_score: snapshot.quality_score,
            description: snapshot.description,
            owner_id: snapshot.owner_id,
            attributes: Some(snapshot.attributes),
            tags: Some(snapshot.tags),
        };

        self.card_service
            .create(create_req)
            .await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to restore card: {}", e)))?;

        Ok(())
    }

    /// Helper to access the card service for read operations
    pub fn get_card_service(&self) -> Arc<CardService> {
        Arc::clone(&self.card_service)
    }
}
