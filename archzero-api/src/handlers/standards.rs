use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;
use serde_json::json;

use crate::models::standards::*;
use crate::models::card::{CardType, CreateCardRequest, UpdateCardRequest, CardSearchParams, LifecyclePhase};
use crate::state::AppState;
use crate::Result;

/// List Technology Standards with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/tech-standards",
    params(StandardSearchParams),
    responses(
        (status = 200, description = "List of technology standards", body = StandardsListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn list_standards(
    State(state): State<AppState>,
    Query(params): Query<StandardSearchParams>,
) -> Result<Json<StandardsListResponse>> {
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);

    // Build search params for cards
    let search_params = CardSearchParams {
        q: None,
        card_type: Some(CardType::TechnologyStandard),
        lifecycle_phase: None,
        tags: None,
        page: Some(page),
        page_size: Some(limit),
    };

    let (cards, total) = state.saga_orchestrator.get_card_service().list(search_params).await?;

    // Filter by category and status if provided
    let filtered_cards: Vec<_> = cards.into_iter().filter(|card| {
        let attributes = &card.attributes;

        // Filter by category
        if let Some(category_filter) = &params.category {
            if let Some(cat) = attributes.get("category") {
                if let Some(cat_str) = cat.as_str() {
                    if cat_str != category_filter {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        // Filter by status
        if let Some(status_filter) = &params.status {
            if let Some(status) = attributes.get("status") {
                if let Some(status_str) = status.as_str() {
                    if status_str != status_filter {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        }

        true
    }).collect();

    // Convert to TechnologyStandard format
    let standards = filtered_cards.into_iter().map(|card| {
        let attributes = &card.attributes;
        TechnologyStandard {
            id: card.id,
            name: card.name,
            card_type: "TechnologyStandard".to_string(),
            category: attributes.get("category")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            status: attributes.get("status")
                .and_then(|v| v.as_str())
                .and_then(|s| match s {
                    "Adopt" => Some(TechnologyStatus::Adopt),
                    "Trial" => Some(TechnologyStatus::Trial),
                    "Assess" => Some(TechnologyStatus::Assess),
                    "Hold" => Some(TechnologyStatus::Hold),
                    "Sunset" => Some(TechnologyStatus::Sunset),
                    "Banned" => Some(TechnologyStatus::Banned),
                    _ => None,
                })
                .unwrap_or(TechnologyStatus::Assess),
            quadrant: attributes.get("quadrant")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            ring: attributes.get("ring")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            sunset_date: attributes.get("sunset_date")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
            replacement_id: attributes.get("replacement_id")
                .and_then(|v| v.as_str())
                .and_then(|s| Uuid::parse_str(s).ok()),
            rationale: attributes.get("rationale")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string(),
            description: card.description,
            created_at: card.created_at,
            updated_at: card.updated_at,
            tags: card.tags,
        }
    }).collect();

    Ok(Json(StandardsListResponse {
        data: standards,
        pagination: PaginationMeta {
            page,
            limit,
            total,
        },
    }))
}

/// Get a Technology Standard by ID
#[utoipa::path(
    get,
    path = "/api/v1/tech-standards/{id}",
    params(
        ("id" = Uuid, Path, description = "Standard ID")
    ),
    responses(
        (status = 200, description = "Technology standard details", body = TechnologyStandard),
        (status = 404, description = "Standard not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn get_standard(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<TechnologyStandard>> {
    let card = state.saga_orchestrator.get_card_service().get(id).await?;

    let attributes = &card.attributes;
    let standard = TechnologyStandard {
        id: card.id,
        name: card.name,
        card_type: "TechnologyStandard".to_string(),
        category: attributes.get("category")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        status: attributes.get("status")
            .and_then(|v| v.as_str())
            .and_then(|s| match s {
                "Adopt" => Some(TechnologyStatus::Adopt),
                "Trial" => Some(TechnologyStatus::Trial),
                "Assess" => Some(TechnologyStatus::Assess),
                "Hold" => Some(TechnologyStatus::Hold),
                "Sunset" => Some(TechnologyStatus::Sunset),
                "Banned" => Some(TechnologyStatus::Banned),
                _ => None,
            })
            .unwrap_or(TechnologyStatus::Assess),
        quadrant: attributes.get("quadrant")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        ring: attributes.get("ring")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        sunset_date: attributes.get("sunset_date")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        replacement_id: attributes.get("replacement_id")
            .and_then(|v| v.as_str())
            .and_then(|s| Uuid::parse_str(s).ok()),
        rationale: attributes.get("rationale")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        description: card.description,
        created_at: card.created_at,
        updated_at: card.updated_at,
        tags: card.tags,
    };

    Ok(Json(standard))
}

/// Create a new Technology Standard
#[utoipa::path(
    post,
    path = "/api/v1/tech-standards",
    request_body = CreateStandardRequest,
    responses(
        (status = 200, description = "Technology standard created", body = TechnologyStandard),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn create_standard(
    State(state): State<AppState>,
    Json(req): Json<CreateStandardRequest>,
) -> Result<Json<TechnologyStandard>> {
    // Build attributes JSON
    let attributes = json!({
        "category": req.category,
        "status": req.status.as_str(),
        "quadrant": req.quadrant,
        "ring": req.ring,
        "sunset_date": req.sunset_date,
        "replacement_id": req.replacement_id,
        "rationale": req.rationale,
    });

    let create_req = CreateCardRequest {
        name: req.name,
        card_type: CardType::TechnologyStandard,
        lifecycle_phase: LifecyclePhase::Active,
        quality_score: None,
        description: req.description,
        owner_id: None,
        attributes: Some(attributes),
        tags: req.tags,
    };

    let card = state.saga_orchestrator.create_card(create_req).await?;

    let standard = TechnologyStandard {
        id: card.id,
        name: card.name,
        card_type: "TechnologyStandard".to_string(),
        category: req.category,
        status: req.status,
        quadrant: req.quadrant,
        ring: req.ring,
        sunset_date: req.sunset_date,
        replacement_id: req.replacement_id,
        rationale: req.rationale,
        description: card.description,
        created_at: card.created_at,
        updated_at: card.updated_at,
        tags: card.tags,
    };

    Ok(Json(standard))
}

/// Update a Technology Standard
#[utoipa::path(
    put,
    path = "/api/v1/tech-standards/{id}",
    params(
        ("id" = Uuid, Path, description = "Standard ID")
    ),
    request_body = UpdateStandardRequest,
    responses(
        (status = 200, description = "Technology standard updated", body = TechnologyStandard),
        (status = 404, description = "Standard not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn update_standard(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateStandardRequest>,
) -> Result<Json<TechnologyStandard>> {
    // Get the current card to merge attributes
    let current_card = state.saga_orchestrator.get_card_service().get(id).await?;

    // Merge existing attributes with updates
    let mut attributes = current_card.attributes;
    if let Some(category) = req.category {
        attributes["category"] = json!(category);
    }
    if let Some(status) = &req.status {
        attributes["status"] = json!(status.as_str());
    }
    if let Some(quadrant) = &req.quadrant {
        attributes["quadrant"] = json!(quadrant);
    }
    if let Some(ring) = &req.ring {
        attributes["ring"] = json!(ring);
    }
    if let Some(sunset_date) = &req.sunset_date {
        attributes["sunset_date"] = json!(sunset_date);
    }
    if let Some(replacement_id) = req.replacement_id {
        attributes["replacement_id"] = json!(replacement_id.to_string());
    }
    if let Some(rationale) = req.rationale {
        attributes["rationale"] = json!(rationale);
    }

    let update_req = UpdateCardRequest {
        name: req.name,
        lifecycle_phase: None,
        quality_score: None,
        description: req.description,
        attributes: Some(attributes),
        tags: req.tags,
    };

    let card = state.saga_orchestrator.update_card(id, update_req).await?;

    let standard = TechnologyStandard {
        id: card.id,
        name: card.name,
        card_type: "TechnologyStandard".to_string(),
        category: card.attributes.get("category")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        status: card.attributes.get("status")
            .and_then(|v| v.as_str())
            .and_then(|s| match s {
                "Adopt" => Some(TechnologyStatus::Adopt),
                "Trial" => Some(TechnologyStatus::Trial),
                "Assess" => Some(TechnologyStatus::Assess),
                "Hold" => Some(TechnologyStatus::Hold),
                "Sunset" => Some(TechnologyStatus::Sunset),
                "Banned" => Some(TechnologyStatus::Banned),
                _ => None,
            })
            .unwrap_or(TechnologyStatus::Assess),
        quadrant: card.attributes.get("quadrant")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        ring: card.attributes.get("ring")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        sunset_date: card.attributes.get("sunset_date")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        replacement_id: card.attributes.get("replacement_id")
            .and_then(|v| v.as_str())
            .and_then(|s| Uuid::parse_str(s).ok()),
        rationale: card.attributes.get("rationale")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        description: card.description,
        created_at: card.created_at,
        updated_at: card.updated_at,
        tags: card.tags,
    };

    Ok(Json(standard))
}

/// Delete a Technology Standard
#[utoipa::path(
    delete,
    path = "/api/v1/tech-standards/{id}",
    params(
        ("id" = Uuid, Path, description = "Standard ID")
    ),
    responses(
        (status = 200, description = "Technology standard deleted"),
        (status = 404, description = "Standard not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn delete_standard(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    state.saga_orchestrator.delete_card(id).await?;
    Ok(Json(()))
}

/// Get Technology Radar data
#[utoipa::path(
    get,
    path = "/api/v1/tech-standards/radar",
    responses(
        (status = 200, description = "Technology radar data", body = TechnologyRadar),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn get_radar(
    State(state): State<AppState>,
) -> Result<Json<TechnologyRadar>> {
    let search_params = CardSearchParams {
        q: None,
        card_type: Some(CardType::TechnologyStandard),
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (cards, _) = state.saga_orchestrator.get_card_service().list(search_params).await?;

    // Group by category (quadrant) and status (ring)
    let mut quadrants: std::collections::HashMap<String, std::collections::HashMap<String, Vec<String>>> = std::collections::HashMap::new();

    for card in cards {
        let attributes = &card.attributes;
        let category = attributes.get("category")
            .and_then(|v| v.as_str())
            .unwrap_or("Other")
            .to_string();
        let status = attributes.get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("Assess")
            .to_string();

        quadrants
            .entry(category)
            .or_insert_with(std::collections::HashMap::new)
            .entry(status)
            .or_insert_with(Vec::new)
            .push(card.name);
    }

    // Convert to TechnologyRadar format
    let mut radar_quadrants = Vec::new();
    for (category, rings) in quadrants {
        let mut radar_rings = Vec::new();
        for (ring_name, technologies) in rings {
            radar_rings.push(RadarRing {
                name: ring_name,
                technologies,
            });
        }
        radar_quadrants.push(RadarQuadrant {
            name: category,
            rings: radar_rings,
        });
    }

    Ok(Json(TechnologyRadar {
        quadrants: radar_quadrants,
    }))
}

/// Get Technology Debt Report
#[utoipa::path(
    get,
    path = "/api/v1/tech-standards/debt-report",
    responses(
        (status = 200, description = "Technology debt report", body = TechnologyDebtReport),
        (status = 500, description = "Internal server error")
    ),
    tag = "Technology Standards"
)]
pub async fn get_debt_report(
    State(state): State<AppState>,
) -> Result<Json<TechnologyDebtReport>> {
    let search_params = CardSearchParams {
        q: None,
        card_type: Some(CardType::TechnologyStandard),
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (cards, _) = state.saga_orchestrator.get_card_service().list(search_params).await?;

    let mut debt_items = Vec::new();
    let mut total_debt_score = 0i64;
    let mut high_risk_count = 0i64;
    let mut estimated_cost = 0f64;

    for card in cards {
        let attributes = &card.attributes;
        let status = attributes.get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("Assess");

        // Calculate debt based on status
        let (debt_score, risk_level) = match status {
            "Sunset" => (100, "High"),
            "Hold" => (50, "Medium"),
            "Banned" => (200, "Critical"),
            _ => (0, "Low"),
        };

        if debt_score > 0 {
            total_debt_score += debt_score;

            if risk_level == "High" || risk_level == "Critical" {
                high_risk_count += 1;
            }

            // Simple cost estimation based on debt score
            let item_cost = debt_score as f64 * 1000.0;
            estimated_cost += item_cost;

            debt_items.push(DebtItem {
                component_name: card.name.clone(),
                component_id: card.id,
                standard_status: match status {
                    "Adopt" => TechnologyStatus::Adopt,
                    "Trial" => TechnologyStatus::Trial,
                    "Assess" => TechnologyStatus::Assess,
                    "Hold" => TechnologyStatus::Hold,
                    "Sunset" => TechnologyStatus::Sunset,
                    "Banned" => TechnologyStatus::Banned,
                    _ => TechnologyStatus::Assess,
                },
                eol_date: attributes.get("sunset_date")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                risk_level: risk_level.to_string(),
                estimated_cost: item_cost,
            });
        }
    }

    Ok(Json(TechnologyDebtReport {
        summary: DebtSummary {
            total_debt_score,
            high_risk_components: high_risk_count,
            estimated_migration_cost: estimated_cost,
        },
        debt_items,
    }))
}