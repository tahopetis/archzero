use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use uuid::Uuid;
use serde::Deserialize;

use crate::models::tco::*;
use crate::error::AppError;
use crate::state::AppState;

/// Query parameters for TCO calculation
#[derive(Debug, Deserialize)]
pub struct TCOCalculationParams {
    pub include_dependencies: Option<bool>,
    pub max_depth: Option<u32>,
}

/// Calculate TCO for a specific card
#[utoipa::path(
    post,
    path = "/api/v1/tco/calculate",
    params(
        ("include_dependencies" = Option<bool>, Query, description = "Include dependency TCO in calculation"),
        ("max_depth" = Option<u32>, Query, description = "Maximum depth for dependency traversal")
    ),
    request_body = TCOCalculationRequest,
    responses(
        (status = 200, description = "TCO calculation result", body = TCOCalculation),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Card not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "TCO"
)]
pub async fn calculate_tco(
    State(state): State<AppState>,
    Query(params): Query<TCOCalculationParams>,
    Json(req): Json<TCOCalculationRequest>,
) -> Result<Json<TCOCalculation>, AppError> {
    // Get the card
    let card = state.card_service.get(req.card_id).await?;

    // Get dependencies if requested
    let dependencies = if params.include_dependencies.unwrap_or(false) {
        let deps = state.topology_service.get_dependencies(req.card_id).await
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
    let consumers = state.topology_service.get_dependents(req.card_id).await
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

    let calculation = state.tco_service.calculate_tco(
        req.card_id,
        card.name.clone(),
        req,
        dependencies,
        consumers_info,
    )?;

    Ok(Json(calculation))
}

/// Get TCO portfolio summary
#[utoipa::path(
    get,
    path = "/api/v1/tco/portfolio",
    responses(
        (status = 200, description = "TCO portfolio summary", body = TCOPortfolio),
        (status = 500, description = "Internal server error")
    ),
    tag = "TCO"
)]
pub async fn get_portfolio_tco(
    State(state): State<AppState>,
) -> Result<Json<TCOPortfolio>, AppError> {
    // For now, return an empty portfolio
    // In production, this would aggregate all TCO calculations
    let portfolio = state.tco_service.calculate_portfolio_tco(vec![])
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate portfolio: {}", e)))?;

    Ok(Json(portfolio))
}

/// Get detailed TCO breakdown for a card
#[utoipa::path(
    get,
    path = "/api/v1/tco/cards/{card_id}",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "Detailed TCO breakdown", body = TCOCalculation),
        (status = 404, description = "TCO calculation not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "TCO"
)]
pub async fn get_tco_breakdown(
    Path(card_id): Path<Uuid>,
) -> Result<Json<TCOCalculation>, AppError> {
    // For now, return not found
    // In production, this would retrieve from database
    Err(AppError::NotFound(format!("TCO calculation for card {} not found", card_id)))
}

/// Get TCO comparison between scenarios
#[utoipa::path(
    get,
    path = "/api/v1/tco/cards/{card_id}/comparison",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "TCO comparison between scenarios", body = TCOComparison),
        (status = 404, description = "TCO comparison not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "TCO"
)]
pub async fn get_tco_comparison(
    Path(card_id): Path<Uuid>,
) -> Result<Json<TCOComparison>, AppError> {
    // For now, return not found
    // In production, this would generate and compare scenarios
    Err(AppError::NotFound(format!("TCO comparison for card {} not found", card_id)))
}

/// Get cost trend data
#[utoipa::path(
    get,
    path = "/api/v1/tco/cards/{card_id}/trend",
    params(
        ("card_id" = Uuid, Path, description = "Card ID"),
        ("period" = Option<String>, Query, description = "Time period for trend data (e.g., '6m', '1y')"),
        ("granularity" = Option<String>, Query, description = "Data granularity (e.g., 'daily', 'monthly')")
    ),
    responses(
        (status = 200, description = "Cost trend data points", body = Vec<CostTrendDataPoint>),
        (status = 500, description = "Internal server error")
    ),
    tag = "TCO"
)]
pub async fn get_cost_trend(
    Path(_card_id): Path<Uuid>,
    Query(_params): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<CostTrendDataPoint>>, AppError> {
    // For now, return empty trend
    // In production, this would query historical TCO data
    Ok(Json(vec![]))
}