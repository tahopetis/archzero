use axum::{
    extract::{Path, Query, Extension},
    response::Json,
};
use uuid::Uuid;
use std::sync::Arc;
use serde::Deserialize;

use crate::models::tco::*;
use crate::services::{TCOService, CardService, TopologyService};
use crate::error::AppError;

/// Query parameters for TCO calculation
#[derive(Debug, Deserialize)]
pub struct TCOCalculationParams {
    pub include_dependencies: Option<bool>,
    pub max_depth: Option<u32>,
}

/// Calculate TCO for a specific card
pub async fn calculate_tco(
    Extension(tco_service): Extension<Arc<TCOService>>,
    Extension(card_service): Extension<Arc<CardService>>,
    Extension(topology_service): Extension<Arc<TopologyService>>,
    Path(card_id): Path<Uuid>,
    Query(params): Query<TCOCalculationParams>,
    Json(req): Json<TCOCalculationRequest>,
) -> Result<Json<TCOCalculation>, AppError> {
    // Get the card
    let card = card_service.get(card_id).await?;

    // Get dependencies if requested
    let dependencies = if params.include_dependencies.unwrap_or(false) {
        let deps = topology_service.get_dependencies(card_id).await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get dependencies: {}", e)))?;

        // Convert to DependencyInfo
        deps.into_iter().map(|dep_id| {
            // In production, fetch actual TCO and consumer count
            crate::services::tco_service::DependencyInfo {
                card_id: dep_id,
                card_name: format!("Dependency-{}", dep_id),
                total_tco: 0.0,
                consumer_count: 1,
                relationship_type: "DependsOn".to_string(),
            }
        }).collect()
    } else {
        vec![]
    };

    // Get consumers
    let consumers = topology_service.get_dependents(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get consumers: {}", e)))?;

    // Convert to ConsumerInfo
    let consumers_info: Vec<crate::services::tco_service::ConsumerInfo> = consumers.into_iter().map(|consumer_id| {
        crate::services::tco_service::ConsumerInfo {
            card_id: consumer_id,
            card_name: format!("Consumer-{}", consumer_id),
            criticality: "Medium".to_string(),
            usage_metrics: None,
        }
    }).collect();

    let calculation = tco_service.calculate_tco(
        card_id,
        card.name.clone(),
        req,
        dependencies,
        consumers_info,
    )?;

    Ok(Json(calculation))
}

/// Get TCO portfolio summary
pub async fn get_portfolio_tco(
    Extension(tco_service): Extension<Arc<TCOService>>,
) -> Result<Json<TCOPortfolio>, AppError> {
    // For now, return an empty portfolio
    // In production, this would aggregate all TCO calculations
    let portfolio = tco_service.calculate_portfolio_tco(vec![])
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate portfolio: {}", e)))?;

    Ok(Json(portfolio))
}

/// Get detailed TCO breakdown for a card
pub async fn get_tco_breakdown(
    Path(card_id): Path<Uuid>,
) -> Result<Json<TCOCalculation>, AppError> {
    // For now, return not found
    // In production, this would retrieve from database
    Err(AppError::NotFound(format!("TCO calculation for card {} not found", card_id)))
}

/// Get TCO comparison between scenarios
pub async fn get_tco_comparison(
    Path(card_id): Path<Uuid>,
) -> Result<Json<TCOComparison>, AppError> {
    // For now, return not found
    // In production, this would generate and compare scenarios
    Err(AppError::NotFound(format!("TCO comparison for card {} not found", card_id)))
}

/// Get cost trend data
pub async fn get_cost_trend(
    Path(card_id): Path<Uuid>,
    Query(params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<CostTrendDataPoint>>, AppError> {
    // For now, return empty trend
    // In production, this would query historical TCO data
    Ok(Json(vec![]))
}
