use axum::{
    extract::{Path, Extension},
    response::Json,
};
use uuid::Uuid;
use std::sync::Arc;

use crate::models::bia::*;
use crate::services::{BIAService, TopologyService, CardService};
use crate::error::AppError;

/// List all available BIA profiles
pub async fn list_profiles(
    Extension(bia_service): Extension<Arc<BIAService>>,
) -> Result<Json<Vec<String>>, AppError> {
    let profiles = bia_service.list_profiles();
    Ok(Json(profiles))
}

/// Get details of a specific BIA profile
pub async fn get_profile(
    Extension(bia_service): Extension<Arc<BIAService>>,
    Path(name): Path<String>,
) -> Result<Json<BIAProfile>, AppError> {
    let profile = bia_service.get_profile(&name)
        .ok_or_else(|| AppError::NotFound(format!("BIA profile '{}' not found", name)))?;

    Ok(Json(profile.clone()))
}

/// Create a new BIA assessment
pub async fn create_assessment(
    Extension(bia_service): Extension<Arc<BIAService>>,
    Json(req): Json<CreateAssessmentRequest>,
) -> Result<Json<BIAAssessment>, AppError> {
    // For now, use a fixed user ID (should come from JWT in production)
    let assessed_by = Uuid::new_v4(); // TODO: Get from authentication context

    let assessment = bia_service.calculate_assessment(
        req.card_id,
        &req.profile_name,
        req.responses,
        assessed_by,
    )?;

    Ok(Json(assessment))
}

/// Get a BIA assessment by ID
pub async fn get_assessment(
    Path(id): Path<Uuid>,
) -> Result<Json<BIAAssessment>, AppError> {
    // For now, return not found
    // In production, this would retrieve from database
    Err(AppError::NotFound(format!("BIA assessment {} not found", id)))
}

/// Get enhanced criticality (BIA + topology) for a card
pub async fn get_enhanced_criticality(
    Extension(bia_service): Extension<Arc<BIAService>>,
    Extension(topology_service): Extension<Arc<TopologyService>>,
    Extension(card_service): Extension<Arc<CardService>>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<EnhancedCriticality>, AppError> {
    // Get the card to check if it exists
    let card = card_service.get(card_id).await?;

    // Calculate topology metrics
    let topology_metrics = topology_service.calculate_topology_metrics(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate topology: {}", e)))?;

    // For now, use a default BIA score of 0.5 (Medium)
    // In production, this would come from a stored assessment
    let bia_score = 0.5;
    let bia_level = CriticalityLevel::from_score(bia_score);

    // Calculate enhanced criticality
    let enhanced = topology_service.calculate_enhanced_criticality(
        bia_score,
        bia_level,
        topology_metrics,
    )?;

    Ok(Json(enhanced))
}

/// Get topology metrics for a card
pub async fn get_topology_metrics(
    Extension(topology_service): Extension<Arc<TopologyService>>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<TopologyMetrics>, AppError> {
    let metrics = topology_service.calculate_topology_metrics(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to calculate topology: {}", e)))?;

    Ok(Json(metrics))
}

/// Get all critical paths (cards with high fan-in)
pub async fn get_critical_paths(
    Extension(topology_service): Extension<Arc<TopologyService>>,
) -> Result<Json<Vec<(Uuid, u32)>>, AppError> {
    let paths = topology_service.find_critical_paths(10).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to find critical paths: {}", e)))?;

    Ok(Json(paths))
}

/// Get dependents of a card (cards that depend on this card)
pub async fn get_dependents(
    Extension(topology_service): Extension<Arc<TopologyService>>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let dependents = topology_service.get_dependents(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get dependents: {}", e)))?;

    Ok(Json(dependents))
}

/// Get dependencies of a card (cards this card depends on)
pub async fn get_dependencies(
    Extension(topology_service): Extension<Arc<TopologyService>>,
    Path(card_id): Path<Uuid>,
) -> Result<Json<Vec<Uuid>>, AppError> {
    let dependencies = topology_service.get_dependencies(card_id).await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to get dependencies: {}", e)))?;

    Ok(Json(dependencies))
}
