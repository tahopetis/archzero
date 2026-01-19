use axum::{
    extract::{Path, Query, State},
    response::Json,
};
use uuid::Uuid;

use crate::models::risks::*;
use crate::models::card::{CardType, CreateCardRequest, UpdateCardRequest};
use crate::error::AppError;
use crate::state::AppState;
use crate::Result;

/// List all risks with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/risks",
    params(
        ("risk_type" = Option<RiskType>, Query, description = "Filter by risk type"),
        ("status" = Option<RiskStatus>, Query, description = "Filter by status"),
        ("min_score" = Option<i32>, Query, description = "Filter by minimum risk score"),
        ("page" = Option<u32>, Query, description = "Page number")
    ),
    responses(
        (status = 200, description = "List of risks", body = RiskListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn list_risks(
    State(state): State<AppState>,
    Query(params): Query<RiskSearchParams>,
) -> Result<Json<RiskListResponse>> {
    // Build card search params from risk params
    let card_params = crate::models::card::CardSearchParams {
        q: None,
        card_type: Some(CardType::Risk),
        lifecycle_phase: None,
        tags: None,
        page: params.page,
        page_size: None,
    };

    // Get all risk cards
    let (cards, total) = state.card_service.list(card_params).await?;

    // Convert cards to risks and apply filters
    let risks: Vec<Risk> = cards
        .into_iter()
        .filter_map(|card| {
            let risk = card_to_risk(card)?;
            // Apply risk_type filter
            if let Some(ref filter_type) = params.risk_type {
                if &risk.risk_type != filter_type {
                    return None;
                }
            }
            // Apply status filter
            if let Some(ref filter_status) = params.status {
                if &risk.status != filter_status {
                    return None;
                }
            }
            // Apply min_score filter
            if let Some(min_score) = params.min_score {
                if risk.risk_score < min_score {
                    return None;
                }
            }
            Some(risk)
        })
        .collect();

    let page = params.page.unwrap_or(1);
    let limit = 20; // Default page size
    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(RiskListResponse {
        data: risks,
        pagination: PaginationMetadata {
            page,
            limit,
            total,
            total_pages,
        },
    }))
}

/// Get a specific risk by ID
#[utoipa::path(
    get,
    path = "/api/v1/risks/{id}",
    params(
        ("id" = Uuid, Path, description = "Risk ID")
    ),
    responses(
        (status = 200, description = "Risk details", body = Risk),
        (status = 404, description = "Risk not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn get_risk(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Risk>> {
    let card = state.card_service.get(id).await?;
    card_to_risk(card)
        .map(Json)
        .ok_or_else(|| AppError::NotFound(format!("Risk {} not found or invalid", id)))
}

/// Create a new risk
#[utoipa::path(
    post,
    path = "/api/v1/risks",
    request_body = CreateRiskRequest,
    responses(
        (status = 200, description = "Risk created successfully", body = Risk),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn create_risk(
    State(state): State<AppState>,
    Json(req): Json<CreateRiskRequest>,
) -> Result<Json<Risk>> {
    // Validate the request
    req.validate()
        .map_err(|e| AppError::Validation(e))?;

    // Calculate risk score
    let risk_score = req.calculate_risk_score();

    // Build attributes JSON
    let mut attributes = serde_json::json!({
        "riskType": req.risk_type,
        "likelihood": req.likelihood,
        "impact": req.impact,
        "riskScore": risk_score,
        "status": req.status.unwrap_or(RiskStatus::Open),
    });

    if let Some(mitigation_plan) = &req.mitigation_plan {
        attributes["mitigationPlan"] = serde_json::json!(mitigation_plan);
    }
    if let Some(owner) = &req.owner {
        attributes["owner"] = serde_json::json!(owner);
    }
    if let Some(target_date) = &req.target_closure_date {
        attributes["targetClosureDate"] = serde_json::json!(target_date);
    }
    if let Some(approval_status) = &req.approval_status {
        attributes["approvalStatus"] = serde_json::json!(approval_status);
    }
    if let Some(approved_by) = &req.approved_by {
        attributes["approvedBy"] = serde_json::json!(approved_by);
    }
    if let Some(approved_at) = &req.approved_at {
        attributes["approvedAt"] = serde_json::json!(approved_at);
    }
    if let Some(is_overdue) = &req.is_overdue {
        attributes["isOverdue"] = serde_json::json!(is_overdue);
    }

    // Create card request
    let card_req = CreateCardRequest {
        name: req.name,
        card_type: CardType::Risk,
        lifecycle_phase: crate::models::card::LifecyclePhase::Active,
        quality_score: None,
        description: Some(req.description),
        owner_id: None,
        attributes: Some(attributes),
        tags: None,
    };

    let card = state.card_service.create(card_req).await?;
    card_to_risk(card)
        .map(Json)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Failed to create risk")))
}

/// Update a risk
#[utoipa::path(
    put,
    path = "/api/v1/risks/{id}",
    params(
        ("id" = Uuid, Path, description = "Risk ID")
    ),
    request_body = UpdateRiskRequest,
    responses(
        (status = 200, description = "Risk updated successfully", body = Risk),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Risk not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn update_risk(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateRiskRequest>,
) -> Result<Json<Risk>> {
    // Validate the request
    req.validate()
        .map_err(|e| AppError::Validation(e))?;

    // Get existing card to merge attributes
    let existing_card = state.card_service.get(id).await?;
    let existing_attrs = existing_card.attributes;

    // Build updated attributes
    let mut attributes = serde_json::json!({});

    // Copy existing attributes
    if let Some(risk_type) = existing_attrs.get("riskType") {
        attributes["riskType"] = risk_type.clone();
    }
    if let Some(likelihood) = existing_attrs.get("likelihood") {
        attributes["likelihood"] = likelihood.clone();
    }
    if let Some(impact) = existing_attrs.get("impact") {
        attributes["impact"] = impact.clone();
    }
    if let Some(risk_score) = existing_attrs.get("riskScore") {
        attributes["riskScore"] = risk_score.clone();
    }
    if let Some(status) = existing_attrs.get("status") {
        attributes["status"] = status.clone();
    }
    if let Some(mitigation_plan) = existing_attrs.get("mitigationPlan") {
        attributes["mitigationPlan"] = mitigation_plan.clone();
    }
    if let Some(owner) = existing_attrs.get("owner") {
        attributes["owner"] = owner.clone();
    }
    if let Some(target_date) = existing_attrs.get("targetClosureDate") {
        attributes["targetClosureDate"] = target_date.clone();
    }
    if let Some(approval_status) = existing_attrs.get("approvalStatus") {
        attributes["approvalStatus"] = approval_status.clone();
    }
    if let Some(approved_by) = existing_attrs.get("approvedBy") {
        attributes["approvedBy"] = approved_by.clone();
    }
    if let Some(approved_at) = existing_attrs.get("approvedAt") {
        attributes["approvedAt"] = approved_at.clone();
    }
    if let Some(is_overdue) = existing_attrs.get("isOverdue") {
        attributes["isOverdue"] = is_overdue.clone();
    }

    // Update with new values
    if let Some(risk_type) = &req.risk_type {
        attributes["riskType"] = serde_json::json!(risk_type);
    }
    if let Some(likelihood) = req.likelihood {
        attributes["likelihood"] = serde_json::json!(likelihood);
    }
    if let Some(impact) = req.impact {
        attributes["impact"] = serde_json::json!(impact);
    }
    // Calculate risk score if both likelihood and impact are provided
    if let (Some(likelihood), Some(impact)) = (req.likelihood, req.impact) {
        attributes["riskScore"] = serde_json::json!(likelihood * impact);
    }
    if let Some(status) = &req.status {
        attributes["status"] = serde_json::json!(status);
    }
    if let Some(mitigation_plan) = &req.mitigation_plan {
        attributes["mitigationPlan"] = serde_json::json!(mitigation_plan);
    }
    if let Some(owner) = &req.owner {
        attributes["owner"] = serde_json::json!(owner);
    }
    if let Some(target_date) = &req.target_closure_date {
        attributes["targetClosureDate"] = serde_json::json!(target_date);
    }
    if let Some(approval_status) = &req.approval_status {
        attributes["approvalStatus"] = serde_json::json!(approval_status);
    }
    if let Some(approved_by) = &req.approved_by {
        attributes["approvedBy"] = serde_json::json!(approved_by);
    }
    if let Some(approved_at) = &req.approved_at {
        attributes["approvedAt"] = serde_json::json!(approved_at);
    }
    if let Some(is_overdue) = &req.is_overdue {
        attributes["isOverdue"] = serde_json::json!(is_overdue);
    }

    // Create update request
    let card_req = UpdateCardRequest {
        name: req.name,
        description: None,  // Description updates not supported through UpdateRiskRequest
        lifecycle_phase: None,
        quality_score: None,
        attributes: Some(attributes),
        tags: None,
    };

    let card = state.card_service.update(id, card_req).await?;
    card_to_risk(card)
        .map(Json)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Failed to update risk")))
}

/// Delete a risk
#[utoipa::path(
    delete,
    path = "/api/v1/risks/{id}",
    params(
        ("id" = Uuid, Path, description = "Risk ID")
    ),
    responses(
        (status = 200, description = "Risk deleted successfully"),
        (status = 404, description = "Risk not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn delete_risk(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    state.card_service.delete(id).await?;
    Ok(Json(()))
}

/// Get risk heat map data
#[utoipa::path(
    get,
    path = "/api/v1/risks/heat-map",
    responses(
        (status = 200, description = "Risk heat map data (5x5 matrix)", body = Vec<RiskHeatMapData>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn get_risk_heat_map(
    State(state): State<AppState>,
) -> Result<Json<Vec<RiskHeatMapData>>> {
    // Get all risk cards
    let params = crate::models::card::CardSearchParams {
        q: None,
        card_type: Some(CardType::Risk),
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (cards, _) = state.card_service.list(params).await?;

    // Convert to risks
    let risks: Vec<Risk> = cards
        .into_iter()
        .filter_map(|card| card_to_risk(card))
        .collect();

    // Build 5x5 heat map (likelihood x impact)
    let mut heat_map: std::collections::HashMap<(i32, i32), RiskHeatMapData> =
        std::collections::HashMap::new();

    for risk in risks {
        let key = (risk.likelihood, risk.impact);
        let entry = heat_map.entry(key).or_insert(RiskHeatMapData {
            likelihood: risk.likelihood,
            impact: risk.impact,
            count: 0,
            risks: Vec::new(),
        });

        entry.count += 1;
        entry.risks.push(RiskHeatMapRisk {
            id: risk.id,
            name: risk.name,
            risk_score: risk.risk_score,
        });
    }

    // Convert to sorted vector
    let mut result: Vec<RiskHeatMapData> = heat_map.into_values().collect();
    result.sort_by(|a, b| {
        b.likelihood
            .cmp(&a.likelihood)
            .then_with(|| b.impact.cmp(&a.impact))
    });

    Ok(Json(result))
}

/// Get top 10 risks by risk score
#[utoipa::path(
    get,
    path = "/api/v1/risks/top-10",
    responses(
        (status = 200, description = "Top 10 risks", body = TopRisksResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Risks"
)]
pub async fn get_top_risks(
    State(state): State<AppState>,
) -> Result<Json<TopRisksResponse>> {
    // Get all risk cards
    let params = crate::models::card::CardSearchParams {
        q: None,
        card_type: Some(CardType::Risk),
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (cards, _) = state.card_service.list(params).await?;

    // Convert to risks
    let mut risks: Vec<Risk> = cards
        .into_iter()
        .filter_map(|card| card_to_risk(card))
        .collect();

    // Sort by risk score descending
    risks.sort_by(|a, b| b.risk_score.cmp(&a.risk_score));

    // Take top 10
    let top_risks: Vec<TopRisk> = risks
        .into_iter()
        .take(10)
        .enumerate()
        .map(|(idx, risk)| TopRisk {
            rank: (idx + 1) as i32,
            id: risk.id,
            name: risk.name,
            risk_score: risk.risk_score,
            risk_type: risk.risk_type,
            status: risk.status,
        })
        .collect();

    Ok(Json(TopRisksResponse { data: top_risks }))
}

/// Convert a card to a risk
fn card_to_risk(card: crate::models::card::Card) -> Option<Risk> {
    if card.card_type != crate::models::card::CardType::Risk {
        return None;
    }

    let attrs = &card.attributes;

    // Extract risk-specific attributes
    let risk_type: RiskType = attrs.get("riskType")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let likelihood: i32 = attrs.get("likelihood")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let impact: i32 = attrs.get("impact")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let risk_score: i32 = attrs.get("riskScore")
        .and_then(|v| serde_json::from_value(v.clone()).ok())?;

    let status: RiskStatus = attrs.get("status")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or(RiskStatus::Open);

    let mitigation_plan: Option<String> = attrs
        .get("mitigationPlan")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let owner: Option<String> = attrs
        .get("owner")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let target_closure_date: Option<String> = attrs
        .get("targetClosureDate")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let approval_status: Option<crate::models::risks::RiskApprovalStatus> = attrs
        .get("approvalStatus")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let approved_by: Option<String> = attrs
        .get("approvedBy")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let approved_at: Option<String> = attrs
        .get("approvedAt")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    let is_overdue: Option<bool> = attrs
        .get("isOverdue")
        .and_then(|v| serde_json::from_value(v.clone()).ok());

    Some(Risk {
        id: card.id,
        name: card.name,
        card_type: "Risk".to_string(),
        description: card.description.unwrap_or_default(),
        risk_type,
        likelihood,
        impact,
        risk_score,
        mitigation_plan,
        owner,
        status,
        target_closure_date,
        approval_status,
        approved_by,
        approved_at,
        is_overdue,
        created_at: card.created_at,
        updated_at: card.updated_at,
    })
}