use axum::{
    extract::{Path, Extension},
    response::Json,
};
use uuid::Uuid;
use std::sync::Arc;

use crate::models::migration::*;
use crate::models::tco::TCOComparison;
use crate::services::{MigrationService, CardService};
use crate::error::AppError;

/// Generate a migration recommendation for a card
#[utoipa::path(
    post,
    path = "/api/v1/migration/assess",
    request_body = MigrationAssessmentRequest,
    responses(
        (status = 200, description = "Migration recommendation generated", body = MigrationRecommendation),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Card not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Migration"
)]
pub async fn assess_migration(
    Extension(migration_service): Extension<Arc<MigrationService>>,
    Extension(card_service): Extension<Arc<CardService>>,
    Json(mut req): Json<MigrationAssessmentRequest>,
) -> Result<Json<MigrationRecommendation>, AppError> {
    // Get the card to retrieve its name
    let card = card_service.get(req.card_id).await?;

    let recommendation = migration_service.assess_migration(
        req.card_id,
        card.name.clone(),
        req,
    )?;

    Ok(Json(recommendation))
}

/// Get a migration recommendation by ID
#[utoipa::path(
    get,
    path = "/api/v1/migration/recommendations/{id}",
    params(
        ("id" = Uuid, Path, description = "Recommendation ID")
    ),
    responses(
        (status = 200, description = "Migration recommendation details", body = MigrationRecommendation),
        (status = 404, description = "Recommendation not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Migration"
)]
pub async fn get_recommendation(
    Path(id): Path<Uuid>,
) -> Result<Json<MigrationRecommendation>, AppError> {
    // For now, return not found
    // In production, this would retrieve from database
    Err(AppError::NotFound(format!("Migration recommendation {} not found", id)))
}

/// Get all migration recommendations for a card
#[utoipa::path(
    get,
    path = "/api/v1/migration/cards/{card_id}/recommendations",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "List of migration recommendations", body = Vec<MigrationRecommendation>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Migration"
)]
pub async fn get_card_recommendations(
    Path(card_id): Path<Uuid>,
) -> Result<Json<Vec<MigrationRecommendation>>, AppError> {
    // For now, return empty list
    // In production, this would query from database
    Ok(Json(vec![]))
}

/// Compare migration scenarios for a card
pub async fn compare_scenarios(
    Path(card_id): Path<Uuid>,
) -> Result<Json<TCOComparison>, AppError> {
    // For now, return not found
    // In production, this would generate multiple scenarios and compare
    Err(AppError::NotFound(format!("TCO comparison for card {} not found", card_id)))
}
