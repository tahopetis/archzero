/**
 * Bulk Operations Handlers
 */

use crate::models::Card;
use crate::services::CardService;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct BulkDeleteRequest {
    pub ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkUpdateRequest {
    pub ids: Vec<String>,
    pub updates: CardUpdates,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CardUpdates {
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub lifecycle_phase: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub owner_id: Option<Uuid>,
    pub quality_score: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct BulkOperationResult {
    pub success: bool,
    pub processed_count: usize,
    pub failed_ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct BulkExportRequest {
    pub ids: Vec<String>,
    #[serde(default)]
    pub format: String,
}

#[derive(Debug, Serialize)]
pub struct ExportData {
    pub format: String,
    pub data: String,
    pub count: usize,
}

/**
 * Bulk Delete Cards
 * DELETE /api/v1/cards/bulk
 */
pub async fn bulk_delete_cards(
    State(card_service): State<Arc<CardService>>,
    Json(req): Json<BulkDeleteRequest>,
) -> Result<Json<BulkOperationResult>, (StatusCode, String)> {
    let mut failed_ids = Vec::new();
    let mut processed_count = 0;

    for id_str in &req.ids {
        match Uuid::parse_str(id_str) {
            Ok(id) => {
                match card_service.delete_card(id).await {
                    Ok(_) => processed_count += 1,
                    Err(_) => failed_ids.push(id_str.clone()),
                }
            }
            Err(_) => failed_ids.push(id_str.clone()),
        }
    }

    Ok(Json(BulkOperationResult {
        success: failed_ids.is_empty(),
        processed_count,
        failed_ids,
    }))
}

/**
 * Bulk Update Cards
 * PUT /api/v1/cards/bulk/update
 */
pub async fn bulk_update_cards(
    State(card_service): State<Arc<CardService>>,
    Json(req): Json<BulkUpdateRequest>,
) -> Result<Json<BulkOperationResult>, (StatusCode, String)> {
    let mut failed_ids = Vec::new();
    let mut processed_count = 0;

    for id_str in &req.ids {
        match Uuid::parse_str(id_str) {
            Ok(id) => {
                // Fetch existing card
                match card_service.get_card(id).await {
                    Ok(mut card) => {
                        // Apply updates
                        if let Some(type_) = &req.updates.type_ {
                            card.type_ = type_.clone();
                        }
                        if let Some(lifecycle_phase) = &req.updates.lifecycle_phase {
                            card.lifecycle_phase = lifecycle_phase.clone();
                        }
                        if let Some(description) = &req.updates.description {
                            card.description = Some(description.clone());
                        }
                        if let Some(tags) = &req.updates.tags {
                            card.tags = tags.clone();
                        }
                        if let Some(owner_id) = req.updates.owner_id {
                            card.owner_id = Some(owner_id);
                        }
                        if let Some(quality_score) = req.updates.quality_score {
                            card.quality_score = Some(quality_score);
                        }

                        // Update card
                        match card_service.update_card(id, card).await {
                            Ok(_) => processed_count += 1,
                            Err(_) => failed_ids.push(id_str.clone()),
                        }
                    }
                    Err(_) => failed_ids.push(id_str.clone()),
                }
            }
            Err(_) => failed_ids.push(id_str.clone()),
        }
    }

    Ok(Json(BulkOperationResult {
        success: failed_ids.is_empty(),
        processed_count,
        failed_ids,
    }))
}

/**
 * Bulk Export Cards
 * POST /api/v1/export/bulk
 */
pub async fn bulk_export_cards(
    State(card_service): State<Arc<CardService>>,
    Json(req): Json<BulkExportRequest>,
) -> Result<Json<ExportData>, (StatusCode, String)> {
    let mut cards = Vec::new();

    for id_str in &req.ids {
        if let Ok(id) = Uuid::parse_str(id_str) {
            if let Ok(card) = card_service.get_card(id).await {
                cards.push(card);
            }
        }
    }

    // Convert to export format (CSV for now)
    let data = export_to_csv(&cards);

    Ok(Json(ExportData {
        format: req.format,
        data,
        count: cards.len(),
    }))
}

fn export_to_csv(cards: &[Card]) -> String {
    let mut csv = String::from("ID,Name,Type,Lifecycle Phase,Description,Tags,Owner ID,Quality Score\n");

    for card in cards {
        let tags_str = card.tags.join(";");
        let owner_str = card.owner_id.map(|id| id.to_string()).unwrap_or_default();
        let quality_str = card.quality_score.map(|s| s.to_string()).unwrap_or_default();
        let desc_str = card.description.as_ref().map(|s| s.as_str()).unwrap_or("");

        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            card.id,
            card.name,
            card.type_,
            card.lifecycle_phase,
            desc_str.replace(',', ';'),
            tags_str,
            owner_str,
            quality_str
        ));
    }

    csv
}
