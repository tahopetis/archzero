use axum::{
    extract::{Path, Query, State},
    Json,
};
use uuid::Uuid;
use serde_json::json;

use crate::models::card::{CardType, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::models::principles::*;
use crate::state::AppState;
use crate::error::AppError;
use crate::Result;

/// Helper: Convert Card to ArchitecturePrinciple
fn card_to_principle(card: crate::models::card::Card) -> Result<ArchitecturePrinciple> {
    let attrs = card.attributes;

    let statement = attrs["statement"]
        .as_str()
        .ok_or_else(|| AppError::Validation("Missing statement in attributes".to_string()))?
        .to_string();

    let rationale = attrs["rationale"]
        .as_str()
        .ok_or_else(|| AppError::Validation("Missing rationale in attributes".to_string()))?
        .to_string();

    let implications: Vec<String> = attrs["implications"]
        .as_array()
        .ok_or_else(|| AppError::Validation("Missing or invalid implications in attributes".to_string()))?
        .iter()
        .filter_map(|v| v.as_str())
        .map(String::from)
        .collect();

    let owner = attrs["owner"]
        .as_str()
        .ok_or_else(|| AppError::Validation("Missing owner in attributes".to_string()))?
        .to_string();

    let category_str = attrs["category"]
        .as_str()
        .ok_or_else(|| AppError::Validation("Missing category in attributes".to_string()))?;

    let category = match category_str {
        "Strategic" => PrincipleCategory::Strategic,
        "Business" => PrincipleCategory::Business,
        "Technical" => PrincipleCategory::Technical,
        "Data" => PrincipleCategory::Data,
        _ => return Err(AppError::Validation(format!("Invalid category: {}", category_str))),
    };

    let adherence_rate = attrs["adherence_rate"]
        .as_i64()
        .unwrap_or(0) as i32;

    Ok(ArchitecturePrinciple {
        id: card.id,
        name: card.name,
        description: card.description,
        card_type: format!("{:?}", card.card_type),
        statement,
        rationale,
        implications,
        owner,
        category,
        adherence_rate,
        quality_score: card.quality_score,
        created_at: card.created_at.to_rfc3339(),
        updated_at: card.updated_at.to_rfc3339(),
    })
}

/// List all Architecture Principles with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/principles",
    params(PrincipleSearchParams),
    responses(
        (status = 200, description = "List of architecture principles", body = PrinciplesListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn list_principles(
    State(state): State<AppState>,
    Query(params): Query<PrincipleSearchParams>,
) -> Result<Json<PrinciplesListResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let page = params.page.unwrap_or(1);
    let limit = params.limit.unwrap_or(50);

    // Build card search params
    let card_params = CardSearchParams {
        q: None,
        card_type: Some(CardType::ArchitecturePrinciple),
        lifecycle_phase: None,
        tags: None,
        page: Some(page),
        page_size: Some(limit),
    };

    // For category and owner filtering, we'll need to filter in-memory
    // since CardSearchParams doesn't support JSONB attribute filtering yet
    let (cards, total) = card_service.list(card_params).await?;

    // Convert cards to principles and apply additional filters
    let mut principles: Vec<ArchitecturePrinciple> = Vec::new();
    for card in cards {
        match card_to_principle(card) {
            Ok(principle) => {
                // Apply category filter if provided
                if let Some(ref filter_category) = params.category {
                    if &principle.category != filter_category {
                        continue;
                    }
                }

                // Apply owner filter if provided (case-insensitive partial match)
                if let Some(ref filter_owner) = params.owner {
                    if !principle.owner.to_lowercase().contains(&filter_owner.to_lowercase()) {
                        continue;
                    }
                }

                principles.push(principle);
            }
            Err(e) => {
                tracing::warn!("Skipping invalid principle card: {}", e);
                continue;
            }
        }
    }

    // Calculate total pages
    let total_pages = ((total as f64) / (limit as f64)).ceil() as u32;

    Ok(Json(PrinciplesListResponse {
        data: principles,
        pagination: PaginationMetadata {
            page,
            limit,
            total,
            total_pages,
        },
    }))
}

/// Get a specific Architecture Principle by ID
#[utoipa::path(
    get,
    path = "/api/v1/principles/{id}",
    params(
        ("id" = Uuid, Path, description = "Principle ID")
    ),
    responses(
        (status = 200, description = "Architecture principle details", body = ArchitecturePrinciple),
        (status = 404, description = "Principle not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn get_principle(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ArchitecturePrinciple>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    // Verify it's an ArchitecturePrinciple type
    if card.card_type != CardType::ArchitecturePrinciple {
        return Err(AppError::NotFound(format!("Card {} is not an Architecture Principle", id)));
    }

    let principle = card_to_principle(card)?;
    Ok(Json(principle))
}

/// Create a new Architecture Principle
#[utoipa::path(
    post,
    path = "/api/v1/principles",
    request_body = CreatePrincipleRequest,
    responses(
        (status = 201, description = "Architecture principle created", body = ArchitecturePrinciple),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn create_principle(
    State(state): State<AppState>,
    Json(req): Json<CreatePrincipleRequest>,
) -> Result<Json<ArchitecturePrinciple>> {
    // Build attributes JSONB
    let attributes = json!({
        "statement": req.statement,
        "rationale": req.rationale,
        "implications": req.implications,
        "owner": req.owner,
        "category": format!("{:?}", req.category),
        "adherence_rate": 0 // Initialize at 0, will be calculated
    });

    // Create card request
    let card_req = CreateCardRequest {
        name: req.name,
        card_type: CardType::ArchitecturePrinciple,
        lifecycle_phase: crate::models::card::LifecyclePhase::Active,
        quality_score: None,
        description: req.description,
        owner_id: None,
        attributes: Some(attributes),
        tags: None,
    };

    let card = state.saga_orchestrator.create_card(card_req).await?;
    let principle = card_to_principle(card)?;

    Ok(Json(principle))
}

/// Update an existing Architecture Principle
#[utoipa::path(
    put,
    path = "/api/v1/principles/{id}",
    params(
        ("id" = Uuid, Path, description = "Principle ID")
    ),
    request_body = UpdatePrincipleRequest,
    responses(
        (status = 200, description = "Architecture principle updated", body = ArchitecturePrinciple),
        (status = 404, description = "Principle not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn update_principle(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePrincipleRequest>,
) -> Result<Json<ArchitecturePrinciple>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // First, get the existing card to preserve attributes
    let existing_card = card_service.get(id).await?;

    if existing_card.card_type != CardType::ArchitecturePrinciple {
        return Err(AppError::NotFound(format!("Card {} is not an Architecture Principle", id)));
    }

    // Build updated attributes, merging with existing
    let mut attrs = existing_card.attributes;

    if let Some(statement) = req.statement {
        attrs["statement"] = json!(statement);
    }
    if let Some(rationale) = req.rationale {
        attrs["rationale"] = json!(rationale);
    }
    if let Some(implications) = req.implications {
        attrs["implications"] = json!(implications);
    }
    if let Some(owner) = req.owner {
        attrs["owner"] = json!(owner);
    }
    if let Some(category) = req.category {
        attrs["category"] = json!(format!("{:?}", category));
    }

    // Create update request
    let update_req = UpdateCardRequest {
        name: req.name,
        lifecycle_phase: None,
        quality_score: None,
        description: req.description,
        attributes: Some(attrs),
        tags: None,
    };

    let updated_card = state.saga_orchestrator.update_card(id, update_req).await?;
    let principle = card_to_principle(updated_card)?;

    Ok(Json(principle))
}

/// Delete an Architecture Principle
#[utoipa::path(
    delete,
    path = "/api/v1/principles/{id}",
    params(
        ("id" = Uuid, Path, description = "Principle ID")
    ),
    responses(
        (status = 200, description = "Architecture principle deleted"),
        (status = 404, description = "Principle not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn delete_principle(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // Verify it's an ArchitecturePrinciple type before deleting
    let card = card_service.get(id).await?;

    if card.card_type != CardType::ArchitecturePrinciple {
        return Err(AppError::NotFound(format!("Card {} is not an Architecture Principle", id)));
    }

    state.saga_orchestrator.get_card_service().delete(id).await?;
    Ok(Json(()))
}

/// Get compliance/adherence report for a specific principle
///
/// This endpoint shows how well cards are adhering to a given architecture principle,
/// including violations, exceptions, and overall adherence rate.
#[utoipa::path(
    get,
    path = "/api/v1/principles/{id}/compliance",
    params(
        ("id" = Uuid, Path, description = "Principle ID")
    ),
    responses(
        (status = 200, description = "Principle compliance report", body = PrincipleComplianceReport),
        (status = 404, description = "Principle not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Principles"
)]
pub async fn get_principle_compliance(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<PrincipleComplianceReport>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // Get the principle
    let card = card_service.get(id).await?;

    if card.card_type != CardType::ArchitecturePrinciple {
        return Err(AppError::NotFound(format!("Card {} is not an Architecture Principle", id)));
    }

    let principle = card_to_principle(card)?;

    // Query all active cards (excluding principles themselves)
    let all_cards_params = CardSearchParams {
        q: None,
        card_type: None, // All card types
        lifecycle_phase: None,
        tags: None,
        page: Some(1),
        page_size: Some(10000), // Get all cards
    };

    let (all_cards, _) = card_service.list(all_cards_params).await?;

    // Filter out architecture principles from the compliance check
    // (we only check regular cards against principles)
    let compliance_cards: Vec<_> = all_cards
        .into_iter()
        .filter(|c| c.card_type != CardType::ArchitecturePrinciple)
        .collect();

    let total_cards = compliance_cards.len() as i32;

    // Calculate compliance based on the principle's category
    // For now, use a simple heuristic:
    // - Strategic principles affect all cards
    // - Business principles affect business process cards
    // - Technical principles affect technical cards
    // - Data principles affect data-related cards
    let mut compliant_count = 0i32;
    let mut non_compliant_count = 0i32;
    let mut violations = Vec::new();

    for card in &compliance_cards {
        let is_compliant = check_card_compliance(&card, &principle);

        if is_compliant {
            compliant_count += 1;
        } else {
            non_compliant_count += 1;
            violations.push(ComplianceViolation {
                card_name: card.name.clone(),
                card_id: card.id,
                reason: format!("Card does not comply with principle '{}' ({:?})",
                               principle.name, principle.category),
                exception_id: None, // TODO: Check exceptions table
            });
        }
    }

    // Calculate adherence rate
    let adherence_rate = if total_cards > 0 {
        (compliant_count * 100) / total_cards
    } else {
        100 // No cards to check = 100% compliant
    };

    let compliance_report = PrincipleComplianceReport {
        principle_id: principle.id,
        principle_name: principle.name.clone(),
        adherence_rate,
        compliant_cards: compliant_count,
        non_compliant_cards: non_compliant_count,
        exempt_cards: 0, // TODO: Query from exceptions table
        violations,
    };

    Ok(Json(compliance_report))
}

/// Helper function to check if a card complies with a principle
/// This is a simplified implementation - in production, this would use
/// more sophisticated rules, possibly stored in the principle itself
fn check_card_compliance(
    card: &crate::models::card::Card,
    principle: &ArchitecturePrinciple,
) -> bool {
    // Simplified compliance check logic:
    // 1. Check if card has required attributes for the principle category
    // 2. Check if card's quality score meets minimum threshold
    // 3. Check if card's tags align with principle requirements

    match principle.category {
        PrincipleCategory::Strategic => {
            // Strategic principles apply to all cards
            // Check for basic completeness
            card.description.is_some() && card.description.as_ref().map_or(false, |d| !d.is_empty())
        }
        PrincipleCategory::Business => {
            // Business principles apply to business-related cards
            // Check if card has business context
            card.attributes.get("business_value").is_some()
                || card.attributes.get("stakeholders").is_some()
        }
        PrincipleCategory::Technical => {
            // Technical principles apply to technical components
            // Check if card has technical specifications
            card.attributes.get("technology").is_some()
                || card.attributes.get("architecture").is_some()
                || card.attributes.get("api_spec").is_some()
        }
        PrincipleCategory::Data => {
            // Data principles apply to data-related cards
            // Check if card has data classification or schema
            card.attributes.get("data_classification").is_some()
                || card.attributes.get("schema").is_some()
                || card.attributes.get("pii_fields").is_some()
        }
    }
}
