use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use utoipa::ToSchema;
use crate::state::AppState;

// Re-export all policy models at the handler level for OpenAPI schema access
pub use crate::models::policies::*;

use crate::models::card::{Card, CardType, CardSearchParams, CreateCardRequest, UpdateCardRequest, LifecyclePhase};
use crate::Result;
use crate::error::AppError;

/// List architecture policies with optional filters
///
/// Based on API spec docs/05-api-spec.md section 9.3.1
#[utoipa::path(
    get,
    path = "/api/v1/policies",
    params(PolicySearchParams),
    responses(
        (status = 200, description = "Policies retrieved successfully", body = PolicyListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn list_policies(
    State(state): State<AppState>,
    Query(params): Query<PolicySearchParams>,
) -> Result<Json<PolicyListResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // Build card search params to filter for ArchitecturePolicy type
    let card_params = CardSearchParams {
        card_type: Some(CardType::ArchitecturePolicy),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: params.page,
        page_size: params.page_size,
    };

    let (cards, total) = card_service.list(card_params).await?;

    // Filter policies by severity and enforcement mode
    let mut policies: Vec<ArchitecturePolicy> = cards
        .into_iter()
        .filter_map(|card| card_to_policy(card))
        .filter(|policy| {
            if let Some(severity) = &params.severity {
                if &policy.severity != severity {
                    return false;
                }
            }
            if let Some(enforcement) = &params.enforcement {
                if &policy.enforcement != enforcement {
                    return false;
                }
            }
            true
        })
        .collect();

    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(50);

    // Manual pagination after filtering
    let start = ((page.saturating_sub(1)) * page_size) as usize;
    let end = (start + page_size as usize).min(policies.len());

    let paginated_policies = if start < policies.len() {
        policies.drain(start..end).collect()
    } else {
        Vec::new()
    };

    Ok(Json(PolicyListResponse {
        data: paginated_policies,
        pagination: PolicyPagination {
            page,
            limit: page_size,
            total,
        },
    }))
}

/// Get a policy by ID
#[utoipa::path(
    get,
    path = "/api/v1/policies/{id}",
    params(
        ("id" = Uuid, Path, description = "Policy ID")
    ),
    responses(
        (status = 200, description = "Policy retrieved successfully", body = ArchitecturePolicy),
        (status = 404, description = "Policy not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn get_policy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ArchitecturePolicy>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    card_to_policy(card)
        .ok_or_else(|| AppError::NotFound(format!("Policy {} not found or is not an ArchitecturePolicy", id)))
        .map(Json)
}

/// Create a new architecture policy
#[utoipa::path(
    post,
    path = "/api/v1/policies",
    request_body = CreatePolicyRequest,
    responses(
        (status = 200, description = "Policy created successfully", body = ArchitecturePolicy),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn create_policy(
    State(state): State<AppState>,
    Json(req): Json<CreatePolicyRequest>,
) -> Result<Json<ArchitecturePolicy>> {
    // Build attributes with rule_json, severity, and enforcement_mode
    let mut attributes = serde_json::json!({});
    if let Ok(rule_value) = serde_json::to_value(&req.rule_json) {
        attributes["rule_json"] = rule_value;
    }
    attributes["severity"] = serde_json::to_value(&req.severity)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize severity: {}", e)))?;
    attributes["enforcement_mode"] = serde_json::to_value(&req.enforcement)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize enforcement: {}", e)))?;

    let card_req = CreateCardRequest {
        name: req.name.clone(),
        card_type: CardType::ArchitecturePolicy,
        lifecycle_phase: LifecyclePhase::Active,
        quality_score: None,
        description: req.description,
        owner_id: None,
        attributes: Some(attributes),
        tags: None,
    };

    let card = state.saga_orchestrator.create_card(card_req).await?;

    card_to_policy(card)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Failed to convert card to policy")))
        .map(Json)
}

/// Update a policy
#[utoipa::path(
    put,
    path = "/api/v1/policies/{id}",
    params(
        ("id" = Uuid, Path, description = "Policy ID")
    ),
    request_body = UpdatePolicyRequest,
    responses(
        (status = 200, description = "Policy updated successfully", body = ArchitecturePolicy),
        (status = 404, description = "Policy not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn update_policy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdatePolicyRequest>,
) -> Result<Json<ArchitecturePolicy>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let existing_card = card_service.get(id).await?;

    // Verify it's an ArchitecturePolicy
    if existing_card.card_type != CardType::ArchitecturePolicy {
        return Err(AppError::NotFound(format!("Card {} is not an ArchitecturePolicy", id)));
    }

    // Build updated attributes
    let mut attributes = existing_card.attributes.clone();
    if let Some(rule_json) = req.rule_json {
        if let Ok(rule_value) = serde_json::to_value(&rule_json) {
            attributes["rule_json"] = rule_value;
        }
    }
    if let Some(severity) = &req.severity {
        attributes["severity"] = serde_json::to_value(severity)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize severity: {}", e)))?;
    }
    if let Some(enforcement) = &req.enforcement {
        attributes["enforcement_mode"] = serde_json::to_value(enforcement)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize enforcement: {}", e)))?;
    }

    let card_req = UpdateCardRequest {
        name: req.name,
        lifecycle_phase: None,
        quality_score: None,
        description: req.description,
        attributes: Some(attributes),
        tags: None,
    };

    let updated_card = state.saga_orchestrator.update_card(id, card_req).await?;

    card_to_policy(updated_card)
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Failed to convert updated card to policy")))
        .map(Json)
}

/// Delete a policy
#[utoipa::path(
    delete,
    path = "/api/v1/policies/{id}",
    params(
        ("id" = Uuid, Path, description = "Policy ID")
    ),
    responses(
        (status = 200, description = "Policy deleted successfully"),
        (status = 404, description = "Policy not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn delete_policy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    // Verify it's an ArchitecturePolicy
    if card.card_type != CardType::ArchitecturePolicy {
        return Err(AppError::NotFound(format!("Card {} is not an ArchitecturePolicy", id)));
    }

    state.saga_orchestrator.delete_card(id).await?;
    Ok(Json(()))
}

/// Check policy compliance against specific cards
///
/// Evaluates policy rules against card attributes
#[utoipa::path(
    post,
    path = "/api/v1/policies/check",
    request_body = PolicyComplianceCheckRequest,
    responses(
        (status = 200, description = "Compliance check completed", body = PolicyComplianceCheckResponse),
        (status = 400, description = "Bad request"),
        (status = 404, description = "Policy not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn check_policy_compliance(
    State(state): State<AppState>,
    Json(req): Json<PolicyComplianceCheckRequest>,
) -> Result<Json<PolicyComplianceCheckResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // Get all architecture policies
    let policy_params = CardSearchParams {
        card_type: Some(CardType::ArchitecturePolicy),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (policy_cards, _) = card_service.list(policy_params).await?;

    // If no policies exist, return early
    if policy_cards.is_empty() {
        return Ok(Json(PolicyComplianceCheckResponse {
            policy_id: Uuid::new_v4(),
            policy_name: "No Policies".to_string(),
            total_cards: req.card_ids.len(),
            compliant: req.card_ids.len(),
            violations: 0,
            results: req.card_ids.iter().map(|id| CardComplianceResult {
                card_id: *id,
                card_name: "Unknown".to_string(),
                status: ComplianceStatus::Compliant,
                missing_requirements: None,
                violation_details: None,
            }).collect(),
        }));
    }

    let mut all_results = Vec::new();
    let mut total_compliant = 0;
    let mut total_violations = 0;

    // Check each card against all policies
    for card_id in &req.card_ids {
        match card_service.get(*card_id).await {
            Ok(card) => {
                let mut card_compliant = true;
                let mut all_missing = Vec::new();
                let mut all_violations = Vec::new();

                // Check against all policies
                for policy_card in &policy_cards {
                    if let Some(policy) = card_to_policy(policy_card.clone()) {
                        let result = evaluate_policy_against_card(policy_card, &card);

                        match result.status {
                            ComplianceStatus::Compliant => {},
                            ComplianceStatus::Violation => {
                                card_compliant = false;
                                if let Some(mut details) = result.violation_details {
                                    all_violations.append(&mut details);
                                }
                                if let Some(mut missing) = result.missing_requirements {
                                    all_missing.append(&mut missing);
                                }
                            }
                            ComplianceStatus::Error => {
                                card_compliant = false;
                                all_violations.push(format!("Policy '{}' error", policy.name));
                            }
                        }
                    }
                }

                if card_compliant {
                    total_compliant += 1;
                } else {
                    total_violations += 1;
                }

                all_results.push(CardComplianceResult {
                    card_id: card.id,
                    card_name: card.name,
                    status: if card_compliant { ComplianceStatus::Compliant } else { ComplianceStatus::Violation },
                    missing_requirements: if all_missing.is_empty() { None } else { Some(all_missing) },
                    violation_details: if all_violations.is_empty() { None } else { Some(all_violations) },
                });
            }
            Err(_) => {
                all_results.push(CardComplianceResult {
                    card_id: *card_id,
                    card_name: "Unknown".to_string(),
                    status: ComplianceStatus::Error,
                    missing_requirements: None,
                    violation_details: Some(vec!["Card not found".to_string()]),
                });
                total_violations += 1;
            }
        }
    }

    Ok(Json(PolicyComplianceCheckResponse {
        policy_id: Uuid::new_v4(), // Multiple policies checked, using placeholder
        policy_name: format!("All Policies ({} checked)", policy_cards.len()),
        total_cards: req.card_ids.len(),
        compliant: total_compliant,
        violations: total_violations,
        results: all_results,
    }))
}

/// Validate a policy against specific cards
///
/// Based on API spec docs/05-api-spec.md section 9.3.2
#[utoipa::path(
    post,
    path = "/api/v1/policies/{id}/validate",
    params(
        ("id" = Uuid, Path, description = "Policy ID")
    ),
    request_body = ValidatePolicyRequest,
    responses(
        (status = 200, description = "Policy validation completed", body = ValidatePolicyResponse),
        (status = 404, description = "Policy not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn validate_policy(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<ValidatePolicyRequest>,
) -> Result<Json<ValidatePolicyResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let policy_card = card_service.get(id).await?;

    if policy_card.card_type != CardType::ArchitecturePolicy {
        return Err(AppError::NotFound(format!("Card {} is not an ArchitecturePolicy", id)));
    }

    let policy_name = policy_card.name.clone();
    let total_cards = req.card_ids.len();
    let mut results = Vec::new();
    let mut compliant_count = 0;

    for card_id in &req.card_ids {
        match card_service.get(*card_id).await {
            Ok(card) => {
                // Evaluate policy against card
                let compliance_result = evaluate_policy_against_card(&policy_card, &card);

                if compliance_result.status == ComplianceStatus::Compliant {
                    compliant_count += 1;
                }

                results.push(CardComplianceResult {
                    card_id: card.id,
                    card_name: card.name,
                    status: compliance_result.status,
                    missing_requirements: compliance_result.missing_requirements,
                    violation_details: compliance_result.violation_details,
                });
            }
            Err(_) => {
                results.push(CardComplianceResult {
                    card_id: *card_id,
                    card_name: "Unknown".to_string(),
                    status: ComplianceStatus::Error,
                    missing_requirements: None,
                    violation_details: Some(vec!["Card not found".to_string()]),
                });
            }
        }
    }

    Ok(Json(ValidatePolicyResponse {
        policy_id: id,
        policy_name,
        total_cards,
        compliant: compliant_count,
        violations: total_cards - compliant_count,
        results,
    }))
}

/// List all policy violations
///
/// Based on API spec docs/05-api-spec.md section 9.3.3
#[utoipa::path(
    get,
    path = "/api/v1/policies/violations",
    params(ViolationSearchParams),
    responses(
        (status = 200, description = "Violations retrieved successfully", body = PolicyViolationListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Policies"
)]
pub async fn list_violations(
    State(state): State<AppState>,
    Query(params): Query<ViolationSearchParams>,
) -> Result<Json<PolicyViolationListResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();

    // Get all policies
    let policy_params = CardSearchParams {
        card_type: Some(CardType::ArchitecturePolicy),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (policy_cards, _) = card_service.list(policy_params).await?;

    let mut all_violations = Vec::new();

    // For each policy, check all cards (simplified approach)
    for policy_card in policy_cards {
        if let Some(policy) = card_to_policy(policy_card.clone()) {
            // Filter by severity if specified
            if let Some(severity) = &params.severity {
                if &policy.severity != severity {
                    continue;
                }
            }

            // Filter by policy_id if specified
            if let Some(policy_id_filter) = &params.policy_id {
                if policy.id != *policy_id_filter {
                    continue;
                }
            }

            // Get all cards to check against this policy
            let (all_cards, _) = card_service.list(CardSearchParams {
                card_type: None,
                q: None,
                lifecycle_phase: None,
                tags: None,
                page: None,
                page_size: None,
            }).await?;

            for card in all_cards {
                // Skip self and other policy cards
                if card.card_type == CardType::ArchitecturePolicy {
                    continue;
                }

                if let Some(result) = check_policy_violation(&policy, &card) {
                    all_violations.push(result);
                }
            }
        }
    }

    // Manual pagination
    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(50);
    let total = all_violations.len() as i64;

    let start = ((page.saturating_sub(1)) * page_size) as usize;
    let end = (start + page_size as usize).min(all_violations.len());
    let paginated_violations = if start < all_violations.len() {
        all_violations.drain(start..end).collect()
    } else {
        Vec::new()
    };

    Ok(Json(PolicyViolationListResponse {
        data: paginated_violations,
        pagination: ViolationPagination { total },
    }))
}

/// Helper function to convert a Card to ArchitecturePolicy
fn card_to_policy(card: Card) -> Option<ArchitecturePolicy> {
    if card.card_type != CardType::ArchitecturePolicy {
        return None;
    }

    let rule_json = card.attributes.get("rule_json")?.clone();
    let severity = card.attributes.get("severity")?;
    let enforcement = card.attributes.get("enforcement_mode")?;

    Some(ArchitecturePolicy {
        id: card.id,
        name: card.name,
        policy_type: "ArchitecturePolicy".to_string(),
        rule_json,
        severity: serde_json::from_value(severity.clone()).ok()?,
        enforcement: serde_json::from_value(enforcement.clone()).ok()?,
        description: card.description,
        created_at: card.created_at,
        updated_at: card.updated_at,
    })
}

/// Helper function to evaluate policy against a single card
fn evaluate_policy_against_card(policy_card: &Card, card: &Card) -> CardComplianceResult {
    // Extract policy rules from attributes
    let rule_json = match policy_card.attributes.get("rule_json") {
        Some(rules) => rules,
        None => {
            return CardComplianceResult {
                card_id: card.id,
                card_name: card.name.clone(),
                status: ComplianceStatus::Error,
                missing_requirements: None,
                violation_details: Some(vec!["Policy has no rule_json defined".to_string()]),
            };
        }
    };

    // Evaluate the rules against the card
    let evaluation_result = evaluate_policy_rules(rule_json, &card.attributes, &card.card_type);

    CardComplianceResult {
        card_id: card.id,
        card_name: card.name.clone(),
        status: evaluation_result.status,
        missing_requirements: evaluation_result.missing_requirements,
        violation_details: evaluation_result.violation_details,
    }
}

/// Internal result of policy evaluation
struct PolicyEvaluationResult {
    status: ComplianceStatus,
    missing_requirements: Option<Vec<String>>,
    violation_details: Option<Vec<String>>,
}

/// Evaluate policy rules against card attributes
fn evaluate_policy_rules(
    rule_json: &serde_json::Value,
    card_attrs: &serde_json::Value,
    card_type: &crate::models::card::CardType,
) -> PolicyEvaluationResult {
    let mut missing_requirements = Vec::new();
    let mut violation_details = Vec::new();

    // Rule structure:
    // {
    //   "required_attributes": ["attr1", "attr2"],
    //   "applicable_to": ["Application", "ITComponent"],
    //   "conditions": [
    //     {"field": "attr1", "operator": "equals", "value": "expected"},
    //     {"field": "attr2", "operator": "contains", "value": "substring"}
    //   ]
    // }

    // Check if policy applies to this card type
    if let Some(applicable_to) = rule_json.get("applicable_to") {
        if let Some(types_array) = applicable_to.as_array() {
            let applies = types_array.iter().any(|t| {
                if let Some(type_str) = t.as_str() {
                    // Convert CardType enum to string for comparison
                    let card_type_str = serde_json::to_string(card_type)
                        .unwrap_or_default()
                        .trim_matches('"')
                        .to_string();
                    return card_type_str == type_str;
                }
                false
            });

            if !applies {
                // Policy doesn't apply to this card type - consider it compliant
                return PolicyEvaluationResult {
                    status: ComplianceStatus::Compliant,
                    missing_requirements: None,
                    violation_details: None,
                };
            }
        }
    }

    // Check for required attributes
    if let Some(required_attrs) = rule_json.get("required_attributes") {
        if let Some(attrs_array) = required_attrs.as_array() {
            for attr in attrs_array {
                if let Some(attr_name) = attr.as_str() {
                    if !card_attrs.get(attr_name).is_some() {
                        missing_requirements.push(format!("Missing required attribute: {}", attr_name));
                    }
                }
            }
        }
    }

    // Evaluate conditions
    if let Some(conditions) = rule_json.get("conditions") {
        if let Some(conds_array) = conditions.as_array() {
            for condition in conds_array {
                if let Some(field) = condition.get("field").and_then(|f| f.as_str()) {
                    let card_value = card_attrs.get(field);

                    let operator = condition.get("operator")
                        .and_then(|o| o.as_str())
                        .unwrap_or("equals");

                    let expected = condition.get("value");

                    match evaluate_condition(card_value, operator, expected) {
                        Ok(is_compliant) => {
                            if !is_compliant {
                                violation_details.push(format!(
                                    "Field '{}' does not meet condition: {} {:?}",
                                    field, operator, expected
                                ));
                            }
                        }
                        Err(msg) => {
                            violation_details.push(msg);
                        }
                    }
                }
            }
        }
    }

    // Determine overall status
    let status = if !missing_requirements.is_empty() || !violation_details.is_empty() {
        ComplianceStatus::Violation
    } else {
        ComplianceStatus::Compliant
    };

    PolicyEvaluationResult {
        status,
        missing_requirements: if missing_requirements.is_empty() { None } else { Some(missing_requirements) },
        violation_details: if violation_details.is_empty() { None } else { Some(violation_details) },
    }
}

/// Evaluate a single condition
fn evaluate_condition(
    card_value: Option<&serde_json::Value>,
    operator: &str,
    expected: Option<&serde_json::Value>,
) -> std::result::Result<bool, String> {
    match operator {
        "equals" => {
            if let Some(exp) = expected {
                Ok(card_value == Some(exp))
            } else {
                Err("Missing expected value for 'equals' operator".to_string())
            }
        }
        "not_equals" => {
            if let Some(exp) = expected {
                Ok(card_value != Some(exp))
            } else {
                Err("Missing expected value for 'not_equals' operator".to_string())
            }
        }
        "contains" => {
            if let (Some(cv), Some(exp)) = (card_value, expected) {
                if let (Some(cv_str), Some(exp_str)) = (cv.as_str(), exp.as_str()) {
                    Ok(cv_str.contains(exp_str))
                } else {
                    Err("'contains' operator requires string values".to_string())
                }
            } else {
                Ok(false)
            }
        }
        "exists" => {
            Ok(card_value.is_some())
        }
        "not_exists" => {
            Ok(card_value.is_none())
        }
        "greater_than" | "less_than" | "gte" | "lte" => {
            if let (Some(cv), Some(exp)) = (card_value, expected) {
                if let (Some(cv_num), Some(exp_num)) = (cv.as_f64(), exp.as_f64()) {
                    match operator {
                        "greater_than" => Ok(cv_num > exp_num),
                        "less_than" => Ok(cv_num < exp_num),
                        "gte" => Ok(cv_num >= exp_num),
                        "lte" => Ok(cv_num <= exp_num),
                        _ => Ok(false),
                    }
                } else {
                    Err(format!("'{}' operator requires numeric values", operator))
                }
            } else {
                Ok(false)
            }
        }
        _ => {
            Err(format!("Unknown operator: {}", operator))
        }
    }
}

/// Helper function to check if a card violates a policy
fn check_policy_violation(policy: &ArchitecturePolicy, card: &Card) -> Option<PolicyViolation> {
    // Evaluate policy rules against card
    let rule_json = &policy.rule_json;
    let evaluation_result = evaluate_policy_rules(rule_json, &card.attributes, &card.card_type);

    // Only return a violation if the card is not compliant
    if evaluation_result.status != ComplianceStatus::Compliant {
        let violation_details = if let Some(details) = evaluation_result.violation_details {
            details
        } else if let Some(missing) = evaluation_result.missing_requirements {
            missing
        } else {
            vec!["Policy violation detected".to_string()]
        };

        Some(PolicyViolation {
            policy_id: policy.id,
            policy_name: policy.name.clone(),
            card_id: card.id,
            card_name: card.name.clone(),
            severity: policy.severity.clone(),
            enforcement: policy.enforcement.clone(),
            violation_details,
        })
    } else {
        None
    }
}
