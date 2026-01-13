use axum::{
    extract::{Extension, Path},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::sync::Arc;

use crate::{
    error::AppError,
    services::CardService,
    models::card::{Card, UpdateCardRequest},
};

/// Bulk delete cards request
#[derive(Debug, Deserialize)]
pub struct BulkDeleteRequest {
    pub ids: Vec<Uuid>,
}

/// Bulk delete cards response
#[derive(Debug, Serialize)]
pub struct BulkDeleteResponse {
    pub success: bool,
    pub deleted_count: usize,
    pub failed_ids: Vec<Uuid>,
    pub errors: Vec<String>,
}

/// Bulk update cards request
#[derive(Debug, Deserialize)]
pub struct BulkUpdateRequest {
    pub ids: Vec<Uuid>,
    pub updates: UpdateCardRequest,
}

/// Bulk update cards response
#[derive(Debug, Serialize)]
pub struct BulkUpdateResponse {
    pub success: bool,
    pub processed_count: usize,
    pub failed_ids: Vec<Uuid>,
    pub errors: Vec<String>,
}

/// Bulk export cards request
#[derive(Debug, Deserialize)]
pub struct BulkExportRequest {
    pub ids: Option<Vec<Uuid>>,
    pub filters: Option<CardFilters>,
    pub format: ExportFormat,
}

#[derive(Debug, Deserialize)]
pub struct CardFilters {
    pub card_type: Option<String>,
    pub lifecycle_phase: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat {
    Csv,
    Excel,
    Json,
}

/// Bulk delete cards
///
/// Deletes multiple cards by their IDs
#[utoipa::path(
    delete,
    path = "/api/v1/cards/bulk",
    request_body = BulkDeleteRequest,
    responses(
        (status = 200, description = "Cards deleted successfully", body = BulkDeleteResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn bulk_delete_cards(
    Extension(card_service): Extension<Arc<CardService>>,
    Json(req): Json<BulkDeleteRequest>,
) -> Result<Json<BulkDeleteResponse>, AppError> {
    let mut deleted_count = 0;
    let mut failed_ids = Vec::new();
    let mut errors = Vec::new();

    for id in &req.ids {
        match card_service.delete(*id).await {
            Ok(_) => deleted_count += 1,
            Err(e) => {
                failed_ids.push(*id);
                errors.push(format!("Card {}: {}", id, e));
            }
        }
    }

    Ok(Json(BulkDeleteResponse {
        success: failed_ids.is_empty(),
        deleted_count,
        failed_ids,
        errors,
    }))
}

/// Bulk update cards
///
/// Updates multiple cards with the same changes
#[utoipa::path(
    put,
    path = "/api/v1/cards/bulk/update",
    request_body = BulkUpdateRequest,
    responses(
        (status = 200, description = "Cards updated successfully", body = BulkUpdateResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn bulk_update_cards(
    Extension(card_service): Extension<Arc<CardService>>,
    Json(req): Json<BulkUpdateRequest>,
) -> Result<Json<BulkUpdateResponse>, AppError> {
    let mut processed_count = 0;
    let mut failed_ids = Vec::new();
    let mut errors = Vec::new();

    for id in &req.ids {
        match card_service.update(*id, req.updates.clone()).await {
            Ok(_) => processed_count += 1,
            Err(e) => {
                failed_ids.push(*id);
                errors.push(format!("Card {}: {}", id, e));
            }
        }
    }

    Ok(Json(BulkUpdateResponse {
        success: failed_ids.is_empty(),
        processed_count,
        failed_ids,
        errors,
    }))
}

/// Bulk export cards
///
/// Exports multiple cards to specified format
#[utoipa::path(
    post,
    path = "/api/v1/export/bulk",
    request_body = BulkExportRequest,
    responses(
        (status = 200, description = "Cards exported successfully", content_type = "application/json"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn bulk_export_cards(
    Extension(card_service): Extension<Arc<CardService>>,
    Json(req): Json<BulkExportRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    // For now, return JSON format
    // TODO: Implement CSV and Excel export
    let cards = if let Some(ids) = req.ids {
        // Export specific cards
        let mut exported_cards = Vec::new();
        for id in ids {
            match card_service.get(id).await {
                Ok(card) => exported_cards.push(card),
                Err(_) => continue,
            }
        }
        exported_cards
    } else {
        // Export all cards (with optional filters)
        let (cards, _) = card_service
            .list(crate::models::card::CardSearchParams {
                q: None,
                card_type: None,
                lifecycle_phase: None,
                tags: None,
                page: None,
                page_size: Some(10000),
            })
            .await?;
        cards
    };

    Ok(Json(serde_json::json!({
        "success": true,
        "count": cards.len(),
        "cards": cards
    })))
}
