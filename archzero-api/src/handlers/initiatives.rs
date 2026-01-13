use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;

use crate::models::initiatives::{
    Initiative, CreateInitiativeRequest, UpdateInitiativeRequest, InitiativeSearchParams,
    InitiativeListResponse, PaginationMetadata, InitiativeImpactMap, ImpactedCard,
    CardLinkRequest, CardLinkResponse,
};
use crate::models::card::{Card, CardType};
use crate::models::relationship::{CreateRelationshipRequest, RelationshipType};
use crate::state::AppState;
use crate::Result;

/// List initiatives with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/initiatives",
    params(InitiativeSearchParams),
    responses(
        (status = 200, description = "Initiatives retrieved successfully", body = InitiativeListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn list_initiatives(
    State(state): State<AppState>,
    Query(params): Query<InitiativeSearchParams>,
) -> Result<Json<InitiativeListResponse>> {
    let page = params.page.unwrap_or(1);

    // Search for initiative cards
    let card_params = crate::models::card::CardSearchParams {
        q: None,
        card_type: Some(CardType::Initiative),
        lifecycle_phase: None,
        tags: None,
        page: Some(page),
        page_size: Some(20),
    };

    let (cards, total) = state.saga_orchestrator.get_card_service().list(card_params).await?;

    // Filter by status, health, type if provided
    let filtered_cards: Vec<Card> = cards.into_iter().filter(|card| {
        if let Some(status_filter) = &params.status {
            if let Some(card_status) = card.attributes.get("status") {
                if let Some(status_str) = card_status.as_str() {
                    let status_matches = match status_filter {
                        crate::models::initiatives::InitiativeStatus::Planning => status_str == "Planning",
                        crate::models::initiatives::InitiativeStatus::InProgress => status_str == "In Progress",
                        crate::models::initiatives::InitiativeStatus::OnHold => status_str == "On Hold",
                        crate::models::initiatives::InitiativeStatus::Completed => status_str == "Completed",
                        crate::models::initiatives::InitiativeStatus::Cancelled => status_str == "Cancelled",
                    };
                    if !status_matches {
                        return false;
                    }
                }
            }
        }

        if let Some(health_filter) = &params.health {
            if let Some(card_health) = card.attributes.get("health") {
                if let Some(health_str) = card_health.as_str() {
                    let health_matches = match health_filter {
                        crate::models::initiatives::InitiativeHealth::OnTrack => health_str == "On Track",
                        crate::models::initiatives::InitiativeHealth::AtRisk => health_str == "At Risk",
                        crate::models::initiatives::InitiativeHealth::BehindSchedule => health_str == "Behind Schedule",
                    };
                    if !health_matches {
                        return false;
                    }
                }
            }
        }

        if let Some(type_filter) = &params.initiative_type {
            if let Some(card_type) = card.attributes.get("type") {
                if let Some(type_str) = card_type.as_str() {
                    let type_matches = match type_filter {
                        crate::models::initiatives::InitiativeType::Modernization => type_str == "Modernization",
                        crate::models::initiatives::InitiativeType::Migration => type_str == "Migration",
                        crate::models::initiatives::InitiativeType::Consolidation => type_str == "Consolidation",
                        crate::models::initiatives::InitiativeType::NewBuild => type_str == "New Build",
                        crate::models::initiatives::InitiativeType::Decommission => type_str == "Decommission",
                        crate::models::initiatives::InitiativeType::Integration => type_str == "Integration",
                    };
                    if !type_matches {
                        return false;
                    }
                }
            }
        }

        true
    }).collect();

    let initiatives: Vec<Initiative> = filtered_cards.into_iter().map(|card| {
        let status_str = card.attributes.get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("Planning");

        let health_str = card.attributes.get("health")
            .and_then(|v| v.as_str())
            .unwrap_or("OnTrack");

        let type_str = card.attributes.get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("Modernization");

        Initiative {
            id: card.id,
            name: card.name,
            initiative_type: match type_str {
                "Migration" => crate::models::initiatives::InitiativeType::Migration,
                "Consolidation" => crate::models::initiatives::InitiativeType::Consolidation,
                "New Build" => crate::models::initiatives::InitiativeType::NewBuild,
                "Decommission" => crate::models::initiatives::InitiativeType::Decommission,
                "Integration" => crate::models::initiatives::InitiativeType::Integration,
                _ => crate::models::initiatives::InitiativeType::Modernization,
            },
            strategic_theme: card.attributes.get("strategic_theme")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            budget_total: card.attributes.get("budget_total")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            budget_spent: card.attributes.get("budget_spent")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0),
            start_date: card.attributes.get("start_date")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            target_end_date: card.attributes.get("target_end_date")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            actual_end_date: card.attributes.get("actual_end_date")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            owner: card.attributes.get("owner")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            status: match status_str {
                "In Progress" => crate::models::initiatives::InitiativeStatus::InProgress,
                "On Hold" => crate::models::initiatives::InitiativeStatus::OnHold,
                "Completed" => crate::models::initiatives::InitiativeStatus::Completed,
                "Cancelled" => crate::models::initiatives::InitiativeStatus::Cancelled,
                _ => crate::models::initiatives::InitiativeStatus::Planning,
            },
            health: match health_str {
                "At Risk" => crate::models::initiatives::InitiativeHealth::AtRisk,
                "Behind Schedule" => crate::models::initiatives::InitiativeHealth::BehindSchedule,
                _ => crate::models::initiatives::InitiativeHealth::OnTrack,
            },
            description: card.description,
            created_at: card.created_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
            updated_at: card.updated_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        }
    }).collect();

    Ok(Json(InitiativeListResponse {
        data: initiatives,
        pagination: PaginationMetadata {
            page,
            limit: 20,
            total,
            total_pages: (total as f64 / 20.0).ceil() as u32,
        },
    }))
}

/// Get an initiative by ID
#[utoipa::path(
    get,
    path = "/api/v1/initiatives/{id}",
    params(
        ("id" = Uuid, Path, description = "Initiative ID")
    ),
    responses(
        (status = 200, description = "Initiative retrieved successfully", body = Initiative),
        (status = 404, description = "Initiative not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn get_initiative(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Initiative>> {
    let card = state.saga_orchestrator.get_card_service().get(id).await?;

    if card.card_type != CardType::Initiative {
        return Err(crate::error::AppError::NotFound(format!("Card {} is not an initiative", id)));
    }

    let status_str = card.attributes.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("Planning");

    let health_str = card.attributes.get("health")
        .and_then(|v| v.as_str())
        .unwrap_or("OnTrack");

    let type_str = card.attributes.get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("Modernization");

    let initiative = Initiative {
        id: card.id,
        name: card.name,
        initiative_type: match type_str {
            "Migration" => crate::models::initiatives::InitiativeType::Migration,
            "Consolidation" => crate::models::initiatives::InitiativeType::Consolidation,
            "New Build" => crate::models::initiatives::InitiativeType::NewBuild,
            "Decommission" => crate::models::initiatives::InitiativeType::Decommission,
            "Integration" => crate::models::initiatives::InitiativeType::Integration,
            _ => crate::models::initiatives::InitiativeType::Modernization,
        },
        strategic_theme: card.attributes.get("strategic_theme")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        budget_total: card.attributes.get("budget_total")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        budget_spent: card.attributes.get("budget_spent")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        start_date: card.attributes.get("start_date")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        target_end_date: card.attributes.get("target_end_date")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        actual_end_date: card.attributes.get("actual_end_date")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        owner: card.attributes.get("owner")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        status: match status_str {
            "In Progress" => crate::models::initiatives::InitiativeStatus::InProgress,
            "On Hold" => crate::models::initiatives::InitiativeStatus::OnHold,
            "Completed" => crate::models::initiatives::InitiativeStatus::Completed,
            "Cancelled" => crate::models::initiatives::InitiativeStatus::Cancelled,
            _ => crate::models::initiatives::InitiativeStatus::Planning,
        },
        health: match health_str {
            "At Risk" => crate::models::initiatives::InitiativeHealth::AtRisk,
            "Behind Schedule" => crate::models::initiatives::InitiativeHealth::BehindSchedule,
            _ => crate::models::initiatives::InitiativeHealth::OnTrack,
        },
        description: card.description,
        created_at: card.created_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        updated_at: card.updated_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
    };

    Ok(Json(initiative))
}

/// Create a new initiative
#[utoipa::path(
    post,
    path = "/api/v1/initiatives",
    request_body = CreateInitiativeRequest,
    responses(
        (status = 200, description = "Initiative created successfully", body = Initiative),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn create_initiative(
    State(state): State<AppState>,
    Json(req): Json<CreateInitiativeRequest>,
) -> Result<Json<Initiative>> {
    // Build attributes JSON from request
    let mut attributes = serde_json::Map::new();
    attributes.insert("type".to_string(), serde_json::json!(format!("{:?}", req.initiative_type)));
    attributes.insert("strategic_theme".to_string(), serde_json::json!(req.strategic_theme));
    attributes.insert("budget_total".to_string(), serde_json::json!(req.budget_total));
    attributes.insert("budget_spent".to_string(), serde_json::json!(req.budget_spent));
    attributes.insert("start_date".to_string(), serde_json::json!(req.start_date));
    attributes.insert("target_end_date".to_string(), serde_json::json!(req.target_end_date));
    if let Some(actual_end_date) = &req.actual_end_date {
        attributes.insert("actual_end_date".to_string(), serde_json::json!(actual_end_date));
    }
    attributes.insert("owner".to_string(), serde_json::json!(req.owner));
    attributes.insert("status".to_string(), serde_json::json!(format!("{:?}", req.status)));
    attributes.insert("health".to_string(), serde_json::json!(format!("{:?}", req.health)));

    let status_str: String = match req.status {
        crate::models::initiatives::InitiativeStatus::InProgress => "In Progress".to_string(),
        crate::models::initiatives::InitiativeStatus::OnHold => "On Hold".to_string(),
        _ => format!("{:?}", req.status),
    };

    let health_str: String = match req.health {
        crate::models::initiatives::InitiativeHealth::AtRisk => "At Risk".to_string(),
        crate::models::initiatives::InitiativeHealth::BehindSchedule => "Behind Schedule".to_string(),
        _ => format!("{:?}", req.health),
    };

    let type_str: String = match req.initiative_type {
        crate::models::initiatives::InitiativeType::NewBuild => "New Build".to_string(),
        _ => format!("{:?}", req.initiative_type),
    };

    attributes.insert("status".to_string(), serde_json::json!(status_str));
    attributes.insert("health".to_string(), serde_json::json!(health_str));
    attributes.insert("type".to_string(), serde_json::json!(type_str));

    let description = req.description.clone();
    let card_req = crate::models::card::CreateCardRequest {
        name: req.name.clone(),
        card_type: CardType::Initiative,
        lifecycle_phase: crate::models::card::LifecyclePhase::Active,
        quality_score: None,
        description: req.description,
        owner_id: None,
        attributes: Some(serde_json::Value::Object(attributes)),
        tags: None,
    };

    let card = state.saga_orchestrator.create_card(card_req).await?;

    let initiative = Initiative {
        id: card.id,
        name: card.name,
        initiative_type: req.initiative_type,
        strategic_theme: req.strategic_theme,
        budget_total: req.budget_total,
        budget_spent: req.budget_spent,
        start_date: req.start_date,
        target_end_date: req.target_end_date,
        actual_end_date: req.actual_end_date,
        owner: req.owner,
        status: req.status,
        health: req.health,
        description,
        created_at: card.created_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        updated_at: card.updated_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
    };

    Ok(Json(initiative))
}

/// Update an initiative
#[utoipa::path(
    put,
    path = "/api/v1/initiatives/{id}",
    params(
        ("id" = Uuid, Path, description = "Initiative ID")
    ),
    request_body = UpdateInitiativeRequest,
    responses(
        (status = 200, description = "Initiative updated successfully", body = Initiative),
        (status = 404, description = "Initiative not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn update_initiative(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateInitiativeRequest>,
) -> Result<Json<Initiative>> {
    // Get the current card to merge attributes
    let current = state.saga_orchestrator.get_card_service().get(id).await?;

    if current.card_type != CardType::Initiative {
        return Err(crate::error::AppError::NotFound(format!("Card {} is not an initiative", id)));
    }

    // Build updated attributes
    let mut attributes = current.attributes.as_object().unwrap_or(&serde_json::Map::new()).clone();

    if let Some(initiative_type) = &req.initiative_type {
        let type_str: String = match initiative_type {
            crate::models::initiatives::InitiativeType::NewBuild => "New Build".to_string(),
            _ => format!("{:?}", initiative_type),
        };
        attributes.insert("type".to_string(), serde_json::json!(type_str));
    }

    if let Some(strategic_theme) = &req.strategic_theme {
        attributes.insert("strategic_theme".to_string(), serde_json::json!(strategic_theme));
    }

    if let Some(budget_total) = req.budget_total {
        attributes.insert("budget_total".to_string(), serde_json::json!(budget_total));
    }

    if let Some(budget_spent) = req.budget_spent {
        attributes.insert("budget_spent".to_string(), serde_json::json!(budget_spent));
    }

    if let Some(start_date) = &req.start_date {
        attributes.insert("start_date".to_string(), serde_json::json!(start_date));
    }

    if let Some(target_end_date) = &req.target_end_date {
        attributes.insert("target_end_date".to_string(), serde_json::json!(target_end_date));
    }

    if let Some(actual_end_date) = &req.actual_end_date {
        attributes.insert("actual_end_date".to_string(), serde_json::json!(actual_end_date));
    }

    if let Some(owner) = &req.owner {
        attributes.insert("owner".to_string(), serde_json::json!(owner));
    }

    if let Some(status) = &req.status {
        let status_str: String = match status {
            crate::models::initiatives::InitiativeStatus::InProgress => "In Progress".to_string(),
            crate::models::initiatives::InitiativeStatus::OnHold => "On Hold".to_string(),
            _ => format!("{:?}", status),
        };
        attributes.insert("status".to_string(), serde_json::json!(status_str));
    }

    if let Some(health) = &req.health {
        let health_str: String = match health {
            crate::models::initiatives::InitiativeHealth::AtRisk => "At Risk".to_string(),
            crate::models::initiatives::InitiativeHealth::BehindSchedule => "Behind Schedule".to_string(),
            _ => format!("{:?}", health),
        };
        attributes.insert("health".to_string(), serde_json::json!(health_str));
    }

    let card_req = crate::models::card::UpdateCardRequest {
        name: req.name.clone(),
        lifecycle_phase: None,
        quality_score: None,
        description: req.description.clone(),
        attributes: Some(serde_json::Value::Object(attributes)),
        tags: None,
    };

    let card = state.saga_orchestrator.update_card(id, card_req).await?;

    let status_str = card.attributes.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("Planning");

    let health_str = card.attributes.get("health")
        .and_then(|v| v.as_str())
        .unwrap_or("OnTrack");

    let type_str = card.attributes.get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("Modernization");

    let initiative = Initiative {
        id: card.id,
        name: card.name,
        initiative_type: match type_str {
            "Migration" => crate::models::initiatives::InitiativeType::Migration,
            "Consolidation" => crate::models::initiatives::InitiativeType::Consolidation,
            "New Build" => crate::models::initiatives::InitiativeType::NewBuild,
            "Decommission" => crate::models::initiatives::InitiativeType::Decommission,
            "Integration" => crate::models::initiatives::InitiativeType::Integration,
            _ => crate::models::initiatives::InitiativeType::Modernization,
        },
        strategic_theme: card.attributes.get("strategic_theme")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        budget_total: card.attributes.get("budget_total")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        budget_spent: card.attributes.get("budget_spent")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
        start_date: card.attributes.get("start_date")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        target_end_date: card.attributes.get("target_end_date")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        actual_end_date: card.attributes.get("actual_end_date")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        owner: card.attributes.get("owner")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        status: match status_str {
            "In Progress" => crate::models::initiatives::InitiativeStatus::InProgress,
            "On Hold" => crate::models::initiatives::InitiativeStatus::OnHold,
            "Completed" => crate::models::initiatives::InitiativeStatus::Completed,
            "Cancelled" => crate::models::initiatives::InitiativeStatus::Cancelled,
            _ => crate::models::initiatives::InitiativeStatus::Planning,
        },
        health: match health_str {
            "At Risk" => crate::models::initiatives::InitiativeHealth::AtRisk,
            "Behind Schedule" => crate::models::initiatives::InitiativeHealth::BehindSchedule,
            _ => crate::models::initiatives::InitiativeHealth::OnTrack,
        },
        description: card.description,
        created_at: card.created_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
        updated_at: card.updated_at.format("%Y-%m-%dT%H:%M:%SZ").to_string(),
    };

    Ok(Json(initiative))
}

/// Delete an initiative
#[utoipa::path(
    delete,
    path = "/api/v1/initiatives/{id}",
    params(
        ("id" = Uuid, Path, description = "Initiative ID")
    ),
    responses(
        (status = 200, description = "Initiative deleted successfully"),
        (status = 404, description = "Initiative not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn delete_initiative(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    // Verify it's an initiative
    let card = state.saga_orchestrator.get_card_service().get(id).await?;
    if card.card_type != CardType::Initiative {
        return Err(crate::error::AppError::NotFound(format!("Card {} is not an initiative", id)));
    }

    state.saga_orchestrator.delete_card(id).await?;
    Ok(Json(()))
}

/// Get initiative impact map
#[utoipa::path(
    get,
    path = "/api/v1/initiatives/{id}/impact-map",
    params(
        ("id" = Uuid, Path, description = "Initiative ID")
    ),
    responses(
        (status = 200, description = "Impact map retrieved successfully", body = InitiativeImpactMap),
        (status = 404, description = "Initiative not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn get_initiative_impact_map(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<InitiativeImpactMap>> {
    // Get initiative
    let initiative_card = state.saga_orchestrator.get_card_service().get(id).await?;
    if initiative_card.card_type != CardType::Initiative {
        return Err(crate::error::AppError::NotFound(format!("Card {} is not an initiative", id)));
    }

    // Get all relationships where this initiative is the source
    let relationships = state.relationship_service.list_for_card(id).await?;

    let mut impacted_cards = Vec::new();

    for relationship in relationships {
        // Only look at relationships where the initiative is the source
        if relationship.from_card_id == id {
            // Get the target card
            match state.saga_orchestrator.get_card_service().get(relationship.to_card_id).await {
                Ok(target_card) => {
                    let impact_description = relationship.attributes.get("impact_description")
                        .and_then(|v| v.as_str())
                        .unwrap_or("No description")
                        .to_string();

                    let card_type_str = format!("{:?}", target_card.card_type);

                    impacted_cards.push(ImpactedCard {
                        card_id: target_card.id,
                        card_name: target_card.name,
                        card_type: card_type_str,
                        impact_description,
                        current_state: target_card.attributes.get("current_state")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string()),
                        target_state: target_card.attributes.get("target_state")
                            .and_then(|v| v.as_str())
                            .map(|s| s.to_string()),
                    });
                }
                Err(e) => {
                    tracing::warn!("Failed to fetch target card {}: {}", relationship.to_card_id, e);
                }
            }
        }
    }

    let total_impacted = impacted_cards.len() as i64;

    Ok(Json(InitiativeImpactMap {
        initiative_id: id,
        initiative_name: initiative_card.name,
        impacted_cards,
        total_impacted,
    }))
}

/// Link cards to an initiative
#[utoipa::path(
    post,
    path = "/api/v1/initiatives/{id}/link-cards",
    params(
        ("id" = Uuid, Path, description = "Initiative ID")
    ),
    request_body = CardLinkRequest,
    responses(
        (status = 200, description = "Cards linked successfully", body = CardLinkResponse),
        (status = 404, description = "Initiative not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Initiatives"
)]
pub async fn link_cards_to_initiative(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<CardLinkRequest>,
) -> Result<Json<CardLinkResponse>> {
    // Verify initiative exists
    let initiative_card = state.saga_orchestrator.get_card_service().get(id).await?;
    if initiative_card.card_type != CardType::Initiative {
        return Err(crate::error::AppError::NotFound(format!("Card {} is not an initiative", id)));
    }

    let mut linked_count = 0;

    for card_link in &req.card_links {
        // Verify target card exists
        match state.saga_orchestrator.get_card_service().get(card_link.card_id).await {
            Ok(_) => {
                // Create relationship
                let mut attributes = serde_json::Map::new();
                attributes.insert("impact_description".to_string(), serde_json::json!(card_link.impact_description));

                let relationship_req = CreateRelationshipRequest {
                    from_card_id: id,
                    to_card_id: card_link.card_id,
                    relationship_type: RelationshipType::Impacts,
                    valid_from: None,
                    valid_to: None,
                    attributes: Some(serde_json::Value::Object(attributes)),
                    confidence: None,
                };

                match state.relationship_service.create(relationship_req).await {
                    Ok(_) => linked_count += 1,
                    Err(e) => {
                        tracing::warn!("Failed to link card {} to initiative {}: {}", card_link.card_id, id, e);
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Failed to fetch card {}: {}", card_link.card_id, e);
            }
        }
    }

    // Get total impacted count
    let relationships = state.relationship_service.list_for_card(id).await?;
    let total_impacted = relationships.len() as i64;

    Ok(Json(CardLinkResponse {
        initiative_id: id,
        linked_cards: linked_count,
        total_impacted,
    }))
}