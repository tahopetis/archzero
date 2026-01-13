use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use std::collections::HashMap;
use utoipa::ToSchema;

use crate::models::card::{Card, CardType, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::models::compliance::*;
use crate::state::AppState;
use crate::Result;

/// List compliance requirements with optional framework filter
#[utoipa::path(
    get,
    path = "/api/v1/compliance-requirements",
    params(ComplianceRequirementSearchParams),
    responses(
        (status = 200, description = "Compliance requirements retrieved successfully", body = ComplianceRequirementsListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn list_compliance_requirements(
    State(state): State<AppState>,
    Query(params): Query<ComplianceRequirementSearchParams>,
) -> Result<Json<ComplianceRequirementsListResponse>> {
    // Build search params for cards
    let card_params = CardSearchParams {
        card_type: Some(CardType::ComplianceRequirement),
        page: params.page,
        ..Default::default()
    };

    // If framework filter is provided, we'll need to filter by attributes
    // This is a simplified approach - in production you'd want database-level filtering
    let (cards, total) = state.card_service.list(card_params).await?;

    // Filter by framework if specified
    let filtered_cards: Vec<Card> = if let Some(framework) = params.framework {
        let framework_str = serde_json::to_string(&framework)
            .map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Serialization error: {}", e)))?
            .trim_matches('"')
            .to_string();

        cards.into_iter()
            .filter(|card| {
                card.attributes.get("framework")
                    .and_then(|v| v.as_str())
                    .map(|s| s == framework_str.as_str())
                    .unwrap_or(false)
            })
            .collect()
    } else {
        cards
    };

    // Convert to compliance requirement response
    let compliance_reqs: Vec<ComplianceRequirement> = filtered_cards
        .into_iter()
        .map(|card| card_to_compliance_requirement(card))
        .collect();

    Ok(Json(ComplianceRequirementsListResponse {
        data: compliance_reqs,
        pagination: CompliancePagination { total },
    }))
}

/// Get a compliance requirement by ID
#[utoipa::path(
    get,
    path = "/api/v1/compliance-requirements/{id}",
    params(
        ("id" = Uuid, Path, description = "Compliance requirement ID")
    ),
    responses(
        (status = 200, description = "Compliance requirement retrieved successfully", body = ComplianceRequirement),
        (status = 404, description = "Compliance requirement not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn get_compliance_requirement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ComplianceRequirement>> {
    let card = state.card_service.get(id).await?;

    // Validate card type
    if card.card_type != CardType::ComplianceRequirement {
        return Err(crate::error::AppError::NotFound(format!(
            "Card {} is not a compliance requirement", id
        )));
    }

    Ok(Json(card_to_compliance_requirement(card)))
}

/// Create a new compliance requirement
#[utoipa::path(
    post,
    path = "/api/v1/compliance-requirements",
    request_body = CreateComplianceRequirementRequest,
    responses(
        (status = 200, description = "Compliance requirement created successfully", body = ComplianceRequirement),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn create_compliance_requirement(
    State(state): State<AppState>,
    Json(req): Json<CreateComplianceRequirementRequest>,
) -> Result<Json<ComplianceRequirement>> {
    // Convert to card
    let framework_str = serde_json::to_string(&req.framework)
        .map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Serialization error: {}", e)))?
        .trim_matches('"')
        .to_string();

    let attributes = serde_json::json!({
        "framework": framework_str,
        "description": req.description,
        "applicableCardTypes": req.applicable_card_types,
        "requiredControls": req.required_controls,
        "auditFrequency": req.audit_frequency
    });

    let card_req = CreateCardRequest {
        name: req.name.clone(),
        card_type: CardType::ComplianceRequirement,
        lifecycle_phase: crate::models::card::LifecyclePhase::Active,
        quality_score: None,
        description: Some(req.description.clone()),
        owner_id: None,
        attributes: Some(attributes),
        tags: Some(vec![framework_str.clone()]),
    };

    let card = state.card_service.create(card_req).await?;
    Ok(Json(card_to_compliance_requirement(card)))
}

/// Update a compliance requirement
#[utoipa::path(
    put,
    path = "/api/v1/compliance-requirements/{id}",
    params(
        ("id" = Uuid, Path, description = "Compliance requirement ID")
    ),
    request_body = UpdateComplianceRequirementRequest,
    responses(
        (status = 200, description = "Compliance requirement updated successfully", body = ComplianceRequirement),
        (status = 404, description = "Compliance requirement not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn update_compliance_requirement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateComplianceRequirementRequest>,
) -> Result<Json<ComplianceRequirement>> {
    // Get existing card to merge attributes
    let existing = state.card_service.get(id).await?;

    // Validate card type
    if existing.card_type != CardType::ComplianceRequirement {
        return Err(crate::error::AppError::NotFound(format!(
            "Card {} is not a compliance requirement", id
        )));
    }

    // Build updated attributes
    let mut attributes = existing.attributes;
    if let Some(framework) = &req.framework {
        let framework_str = serde_json::to_string(framework)
            .map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Serialization error: {}", e)))?
            .trim_matches('"')
            .to_string();
        attributes["framework"] = serde_json::Value::String(framework_str);
    }
    if let Some(description) = &req.description {
        attributes["description"] = serde_json::Value::String(description.clone());
    }
    if let Some(applicable_types) = &req.applicable_card_types {
        attributes["applicableCardTypes"] = serde_json::to_value(applicable_types)
            .map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Serialization error: {}", e)))?;
    }
    if let Some(controls) = &req.required_controls {
        attributes["requiredControls"] = serde_json::to_value(controls)
            .map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Serialization error: {}", e)))?;
    }
    if let Some(frequency) = &req.audit_frequency {
        attributes["auditFrequency"] = serde_json::Value::String(frequency.clone());
    }

    let card_req = UpdateCardRequest {
        name: req.name,
        lifecycle_phase: None,
        quality_score: None,
        description: req.description.clone(),
        attributes: Some(attributes),
        tags: None,
    };

    let card = state.card_service.update(id, card_req).await?;
    Ok(Json(card_to_compliance_requirement(card)))
}

/// Delete a compliance requirement
#[utoipa::path(
    delete,
    path = "/api/v1/compliance-requirements/{id}",
    params(
        ("id" = Uuid, Path, description = "Compliance requirement ID")
    ),
    responses(
        (status = 200, description = "Compliance requirement deleted successfully"),
        (status = 404, description = "Compliance requirement not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn delete_compliance_requirement(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    // Validate that the card exists and is a compliance requirement
    let card = state.card_service.get(id).await?;
    if card.card_type != CardType::ComplianceRequirement {
        return Err(crate::error::AppError::NotFound(format!(
            "Card {} is not a compliance requirement", id
        )));
    }

    state.card_service.delete(id).await?;
    Ok(Json(()))
}

/// Assess compliance of specified cards against a compliance requirement
#[utoipa::path(
    post,
    path = "/api/v1/compliance-requirements/{id}/assess",
    params(
        ("id" = Uuid, Path, description = "Compliance requirement ID")
    ),
    request_body = AssessComplianceRequest,
    responses(
        (status = 200, description = "Compliance assessment completed successfully", body = ComplianceAssessment),
        (status = 404, description = "Compliance requirement not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn assess_card_compliance(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<AssessComplianceRequest>,
) -> Result<Json<ComplianceAssessment>> {
    // Get the compliance requirement
    let compliance_card = state.card_service.get(id).await?;

    // Validate card type
    if compliance_card.card_type != CardType::ComplianceRequirement {
        return Err(crate::error::AppError::NotFound(format!(
            "Card {} is not a compliance requirement", id
        )));
    }

    // Extract framework and required controls
    let framework_str = compliance_card.attributes.get("framework")
        .and_then(|v| v.as_str())
        .unwrap_or("Other");

    let framework: ComplianceFramework = serde_json::from_str(
        &format!("\"{}\"", framework_str)
    ).map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Failed to parse framework: {}", e)))?;

    let required_controls: Vec<String> = serde_json::from_value(
        compliance_card.attributes.get("requiredControls").unwrap_or(&serde_json::json!([])).clone()
    ).unwrap_or_default();

    // Assess each card
    let mut results = Vec::new();
    let mut compliant_count = 0;
    let mut non_compliant_count = 0;
    let total_cards = req.card_ids.len() as i32;

    for card_id in req.card_ids {
        let card = state.card_service.get(card_id).await?;

        // Check if card has required controls
        let card_controls: Vec<String> = card.attributes.get("controls")
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();

        let missing_controls: Vec<String> = required_controls.iter()
            .filter(|c| !card_controls.contains(c))
            .cloned()
            .collect();

        let (status, controls_implemented) = if missing_controls.is_empty() {
            (RequirementComplianceStatus::Compliant, card_controls.clone())
        } else if card_controls.is_empty() {
            (RequirementComplianceStatus::NonCompliant, vec![])
        } else {
            (RequirementComplianceStatus::Partial, card_controls.clone())
        };

        if status == RequirementComplianceStatus::Compliant {
            compliant_count += 1;
        } else {
            non_compliant_count += 1;
        }

        results.push(CardComplianceAssessmentResult {
            card_id,
            card_name: card.name,
            status,
            controls_implemented,
            missing_controls,
        });
    }

    Ok(Json(ComplianceAssessment {
        compliance_id: id,
        framework,
        total_cards,
        compliant: compliant_count,
        non_compliant: non_compliant_count,
        results,
    }))
}

/// Get compliance dashboard data for a compliance requirement
#[utoipa::path(
    get,
    path = "/api/v1/compliance-requirements/{id}/dashboard",
    params(
        ("id" = Uuid, Path, description = "Compliance requirement ID")
    ),
    responses(
        (status = 200, description = "Compliance dashboard data retrieved successfully", body = ComplianceDashboard),
        (status = 404, description = "Compliance requirement not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Compliance"
)]
pub async fn get_compliance_dashboard(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ComplianceDashboard>> {
    use chrono::Utc;

    // Get the compliance requirement
    let compliance_card = state.card_service.get(id).await?;

    // Validate card type
    if compliance_card.card_type != CardType::ComplianceRequirement {
        return Err(crate::error::AppError::NotFound(format!(
            "Card {} is not a compliance requirement", id
        )));
    }

    // Extract framework and applicable card types
    let framework_str = compliance_card.attributes.get("framework")
        .and_then(|v| v.as_str())
        .unwrap_or("Other");

    let framework: ComplianceFramework = serde_json::from_str(
        &format!("\"{}\"", framework_str)
    ).map_err(|e| crate::error::AppError::Internal(anyhow::anyhow!("Failed to parse framework: {}", e)))?;

    let applicable_types: Vec<String> = serde_json::from_value(
        compliance_card.attributes.get("applicableCardTypes").unwrap_or(&serde_json::json!([])).clone()
    ).unwrap_or_default();

    let required_controls: Vec<String> = serde_json::from_value(
        compliance_card.attributes.get("requiredControls").unwrap_or(&serde_json::json!([])).clone()
    ).unwrap_or_default();

    // Get all cards of applicable types
    let mut summary = ComplianceSummary {
        total_applicable_cards: 0,
        compliant: 0,
        non_compliant: 0,
        exempt: 0,
        compliance_rate: 0.0,
    };

    let mut by_card_type: HashMap<String, CardTypeBreakdown> = HashMap::new();

    for card_type_str in applicable_types {
        // Convert string to CardType
        let card_type = match card_type_str.as_str() {
            "BusinessCapability" => Ok(CardType::BusinessCapability),
            "Objective" => Ok(CardType::Objective),
            "Application" => Ok(CardType::Application),
            "Interface" => Ok(CardType::Interface),
            "ITComponent" => Ok(CardType::ITComponent),
            "Platform" => Ok(CardType::Platform),
            "ArchitecturePrinciple" => Ok(CardType::ArchitecturePrinciple),
            "TechnologyStandard" => Ok(CardType::TechnologyStandard),
            "ArchitecturePolicy" => Ok(CardType::ArchitecturePolicy),
            "Exception" => Ok(CardType::Exception),
            "Initiative" => Ok(CardType::Initiative),
            "Risk" => Ok(CardType::Risk),
            "ComplianceRequirement" => Ok(CardType::ComplianceRequirement),
            "DataObject" => Ok(CardType::ITComponent), // Map DataObject to ITComponent
            _ => Err(crate::error::AppError::Internal(anyhow::anyhow!("Unknown card type: {}", card_type_str)))
        };

        if let Ok(ct) = card_type {
            let params = CardSearchParams {
                card_type: Some(ct),
                ..Default::default()
            };

            let (cards, _) = state.card_service.list(params).await?;
            let total = cards.len() as i32;
            let mut compliant = 0;

            for card in &cards {
                let card_controls: Vec<String> = card.attributes.get("controls")
                    .and_then(|v| serde_json::from_value(v.clone()).ok())
                    .unwrap_or_default();

                let has_all_controls = required_controls.iter()
                    .all(|c| card_controls.contains(c));

                if has_all_controls {
                    compliant += 1;
                }
            }

            summary.total_applicable_cards += total;
            summary.compliant += compliant;
            summary.non_compliant += total - compliant;

            by_card_type.insert(card_type_str, CardTypeBreakdown {
                total,
                compliant,
            });
        }
    }

    // Calculate compliance rate
    if summary.total_applicable_cards > 0 {
        summary.compliance_rate = (summary.compliant as f64 / summary.total_applicable_cards as f64) * 100.0;
    }

    Ok(Json(ComplianceDashboard {
        compliance_id: id,
        framework,
        summary,
        by_card_type,
        last_assessed: Utc::now(),
    }))
}

/// Helper function to convert a Card to ComplianceRequirement
fn card_to_compliance_requirement(card: Card) -> ComplianceRequirement {
    let framework_str = card.attributes.get("framework")
        .and_then(|v| v.as_str())
        .unwrap_or("Other");

    let framework: ComplianceFramework = serde_json::from_str(
        &format!("\"{}\"", framework_str)
    ).unwrap_or(ComplianceFramework::Other("Unknown".to_string()));

    let description = card.attributes.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let applicable_card_types: Vec<String> = serde_json::from_value(
        card.attributes.get("applicableCardTypes").unwrap_or(&serde_json::json!([])).clone()
    ).unwrap_or_default();

    let required_controls: Vec<String> = serde_json::from_value(
        card.attributes.get("requiredControls").unwrap_or(&serde_json::json!([])).clone()
    ).unwrap_or_default();

    let audit_frequency = card.attributes.get("auditFrequency")
        .and_then(|v| v.as_str())
        .unwrap_or("Not specified")
        .to_string();

    ComplianceRequirement {
        id: card.id,
        name: card.name,
        card_type: "ComplianceRequirement".to_string(),
        framework,
        description,
        applicable_card_types,
        required_controls,
        audit_frequency,
    }
}

// Implement Default for CardSearchParams
impl Default for CardSearchParams {
    fn default() -> Self {
        Self {
            q: None,
            card_type: None,
            lifecycle_phase: None,
            tags: None,
            page: None,
            page_size: None,
        }
    }
}