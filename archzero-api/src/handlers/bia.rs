use axum::{
    extract::{Path, State},
    response::Json,
};
use uuid::Uuid;

use crate::models::bia::*;
use crate::error::AppError;
use crate::state::AppState;

/// List all available BIA profiles
#[utoipa::path(
    get,
    path = "/api/v1/bia/profiles",
    responses(
        (status = 200, description = "List of all available BIA profiles", body = Vec<String>),
        (status = 500, description = "Internal server error")
    ),
    tag = "BIA"
)]
pub async fn list_profiles(
    State(state): State<AppState>,
) -> Result<Json<Vec<String>>, AppError> {
    let profiles = state.bia_service.list_profiles();
    Ok(Json(profiles))
}

/// Get details of a specific BIA profile
#[utoipa::path(
    get,
    path = "/api/v1/bia/profiles/{name}",
    params(
        ("name" = String, Path, description = "Profile name")
    ),
    responses(
        (status = 200, description = "BIA profile details", body = BIAProfile),
        (status = 404, description = "Profile not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "BIA"
)]
pub async fn get_profile(
    State(state): State<AppState>,
    Path(name): Path<String>,
) -> Result<Json<BIAProfile>, AppError> {
    let profile = state.bia_service.get_profile(&name)
        .ok_or_else(|| AppError::NotFound(format!("BIA profile '{}' not found", name)))?;

    Ok(Json(profile.clone()))
}

/// Create a new BIA assessment
#[utoipa::path(
    post,
    path = "/api/v1/bia/assessments",
    request_body = CreateAssessmentRequest,
    responses(
        (status = 200, description = "BIA assessment created", body = BIAAssessment),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Profile not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "BIA"
)]
pub async fn create_assessment(
    State(state): State<AppState>,
    Json(req): Json<CreateAssessmentRequest>,
) -> Result<Json<BIAAssessment>, AppError> {
    // For now, use a fixed user ID (should come from JWT in production)
    let assessed_by = Uuid::new_v4(); // TODO: Get from authentication context

    let assessment = state.bia_service.calculate_assessment(
        req.card_id,
        &req.profile_name,
        req.responses,
        assessed_by,
    )?;

    Ok(Json(assessment))
}

/// Get a BIA assessment by ID
#[utoipa::path(
    get,
    path = "/api/v1/bia/assessments/{id}",
    params(
        ("id" = Uuid, Path, description = "Assessment ID")
    ),
    responses(
        (status = 200, description = "BIA assessment details", body = BIAAssessment),
        (status = 404, description = "Assessment not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "BIA"
)]
pub async fn get_assessment(
    Path(id): Path<Uuid>,
) -> Result<Json<BIAAssessment>, AppError> {
    // For now, return not found
    // In production, this would retrieve from database
    Err(AppError::NotFound(format!("BIA assessment {} not found", id)))
}

/// Get enhanced criticality (BIA + topology) for a card
#[utoipa::path(
    get,
    path = "/api/v1/topology/cards/{card_id}/criticality",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "Enhanced criticality assessment", body = EnhancedCriticality),
        (status = 404, description = "Card not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Topology"
)]
pub async fn get_enhanced_criticality(
    State(state): State<AppState>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<EnhancedCriticality>, AppError> {
    // Get the card to check if it exists
    let _card = state.card_service.get(card_id).await?;

    // Calculate topology metrics
    let topology_metrics = state.topology_service.calculate_topology_metrics(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate topology: {}", e)))?;

    // For now, use a default BIA score of 0.5 (Medium)
    // In production, this would come from a stored assessment
    let bia_score = 0.5;
    let bia_level = CriticalityLevel::from_score(bia_score);

    // Calculate enhanced criticality
    let enhanced = state.topology_service.calculate_enhanced_criticality(
        bia_score,
        bia_level,
        topology_metrics,
    )?;

    Ok(Json(enhanced))
}

/// Get topology metrics for a card
#[utoipa::path(
    get,
    path = "/api/v1/topology/cards/{card_id}/metrics",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "Topology metrics", body = TopologyMetrics),
        (status = 500, description = "Internal server error")
    ),
    tag = "Topology"
)]
pub async fn get_topology_metrics(
    State(state): State<AppState>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<TopologyMetrics>, AppError> {
    let metrics = state.topology_service.calculate_topology_metrics(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate topology: {}", e)))?;

    Ok(Json(metrics))
}

/// Get all critical paths (cards with high fan-in)
#[utoipa::path(
    get,
    path = "/api/v1/topology/critical-paths",
    params(
        ("threshold" = Option<u32>, Query, description = "Minimum fan-in threshold (default: 10)")
    ),
    responses(
        (status = 200, description = "List of critical paths with card IDs and fan-in counts", body = Vec<(Uuid, u32)>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Topology"
)]
pub async fn get_critical_paths(
    State(state): State<AppState>,
) -> Result<Json<Vec<(Uuid, u32)>>, AppError> {
    let paths = state.topology_service.find_critical_paths(10).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to find critical paths: {}", e)))?;

    Ok(Json(paths))
}

/// Get dependents of a card (cards that depend on this card)
#[utoipa::path(
    get,
    path = "/api/v1/topology/cards/{card_id}/dependents",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "List of dependent card IDs", body = Vec<Uuid>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Topology"
)]
pub async fn get_dependents(
    State(state): State<AppState>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let dependents = state.topology_service.get_dependents(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get dependents: {}", e)))?;

    Ok(Json(dependents))
}

/// Get dependencies of a card (cards this card depends on)
#[utoipa::path(
    get,
    path = "/api/v1/topology/cards/{card_id}/dependencies",
    params(
        ("card_id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "List of dependency card IDs", body = Vec<Uuid>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Topology"
)]
pub async fn get_dependencies(
    State(state): State<AppState>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let dependencies = state.topology_service.get_dependencies(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get dependencies: {}", e)))?;

    Ok(Json(dependencies))
}