use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use chrono::{Utc, Duration};

use crate::models::exceptions::*;
use crate::models::card::{CardType, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::error::AppError;
use crate::Result;
use crate::state::AppState;

/// List exceptions with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/exceptions",
    params(ExceptionListParams),
    responses(
        (status = 200, description = "Exceptions retrieved successfully", body = ExceptionListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn list_exceptions(
    State(state): State<AppState>,
    Query(params): Query<ExceptionListParams>,
) -> Result<Json<ExceptionListResponse>> {
    // Get card service from saga orchestrator for read operations
    let card_service = state.saga_orchestrator.get_card_service();

    // Build card search params for Exception type
    let card_params = CardSearchParams {
        card_type: Some(CardType::Exception),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: params.page,
        page_size: params.page_size,
    };

    // Get all exceptions (filtering by status will be done after retrieval)
    let (cards, total) = card_service.list(card_params).await?;

    // Convert cards to exceptions and filter by status/policy_id
    let mut exceptions: Vec<Exception> = cards
        .into_iter()
        .filter_map(|card| card_to_exception(card).ok())
        .filter(|exc| {
            if let Some(status) = &params.status {
                &exc.status == status
            } else {
                true
            }
        })
        .filter(|exc| {
            if let Some(policy_id) = &params.policy_id {
                &exc.policy_id == policy_id
            } else {
                true
            }
        })
        .collect();

    // Update expired status
    let now = Utc::now();
    for exc in &mut exceptions {
        if let Some(expires_at) = exc.expires_at {
            if expires_at < now && exc.status == ExceptionStatus::Approved {
                exc.status = ExceptionStatus::Expired;
            }
        }
    }

    Ok(Json(ExceptionListResponse {
        data: exceptions,
        pagination: ExceptionPagination { total },
    }))
}

/// Get an exception by ID
#[utoipa::path(
    get,
    path = "/api/v1/exceptions/{id}",
    params(
        ("id" = Uuid, Path, description = "Exception ID")
    ),
    responses(
        (status = 200, description = "Exception retrieved successfully", body = Exception),
        (status = 404, description = "Exception not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn get_exception(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Exception>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    if card.card_type != CardType::Exception {
        return Err(AppError::NotFound(format!("Card {} is not an exception", id)));
    }

    let mut exception = card_to_exception(card)?;

    // Update status if expired
    let now = Utc::now();
    if let Some(expires_at) = exception.expires_at {
        if expires_at < now && exception.status == ExceptionStatus::Approved {
            exception.status = ExceptionStatus::Expired;
        }
    }

    Ok(Json(exception))
}

/// Create a new exception request
#[utoipa::path(
    post,
    path = "/api/v1/exceptions",
    request_body = CreateExceptionRequest,
    responses(
        (status = 201, description = "Exception request created", body = CreateExceptionResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn create_exception_request(
    State(state): State<AppState>,
    Json(req): Json<CreateExceptionRequest>,
) -> Result<Json<CreateExceptionResponse>> {
    let now = Utc::now();

    // Calculate expires_at based on duration
    let expires_at = match req.duration {
        ExceptionDuration::Days30 => Some(now + Duration::days(30)),
        ExceptionDuration::Days60 => Some(now + Duration::days(60)),
        ExceptionDuration::Days90 => Some(now + Duration::days(90)),
        ExceptionDuration::Permanent => None,
    };

    // Build attributes JSONB with exception-specific fields
    let attributes = serde_json::json!({
        "related_policy_id": req.policy_id,
        "exception_reason": req.justification.clone(),
        "duration": req.duration,
        "compensating_controls": req.compensating_controls,
        "status": ExceptionStatus::Pending,
        "approved_by": serde_json::Value::Null,
        "approved_at": serde_json::Value::Null,
        "expiration_date": expires_at.map(|dt| dt.to_rfc3339()),
        "card_id": req.card_id,
    });

    // Create the card request
    let card_req = CreateCardRequest {
        name: req.name,
        card_type: CardType::Exception,
        lifecycle_phase: crate::models::card::LifecyclePhase::Active,
        quality_score: None,
        description: Some(req.justification.clone()),
        owner_id: None,
        attributes: Some(attributes),
        tags: Some(vec!["exception".to_string(), "pending".to_string()]),
    };

    // Use SAGA orchestrator for dual-write to PostgreSQL and Neo4j
    let card = state.saga_orchestrator.create_card(card_req).await?;

    Ok(Json(CreateExceptionResponse {
        id: card.id,
        status: ExceptionStatus::Pending,
        created_at: card.created_at,
    }))
}

/// Approve an exception request
#[utoipa::path(
    patch,
    path = "/api/v1/exceptions/{id}/approve",
    params(
        ("id" = Uuid, Path, description = "Exception ID")
    ),
    request_body = ApproveExceptionRequest,
    responses(
        (status = 200, description = "Exception approved", body = ApproveExceptionResponse),
        (status = 404, description = "Exception not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn approve_exception(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<ApproveExceptionRequest>,
) -> Result<Json<ApproveExceptionResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    if card.card_type != CardType::Exception {
        return Err(AppError::NotFound(format!("Card {} is not an exception", id)));
    }

    let exception = card_to_exception(card.clone())?;

    if exception.status != ExceptionStatus::Pending {
        return Err(AppError::Validation(format!(
            "Exception must be in Pending status to approve, current status: {:?}",
            exception.status
        )));
    }

    // Update attributes with approval info using proper field names
    let approved_at = Utc::now();
    let mut attributes = card.attributes;
    if let Some(attrs) = attributes.as_object_mut() {
        attrs.insert("status".to_string(), serde_json::json!(ExceptionStatus::Approved));
        attrs.insert("approved_by".to_string(), serde_json::json!(req.approved_by));
        attrs.insert("approved_at".to_string(), serde_json::json!(approved_at.to_rfc3339()));
        if let Some(comments) = req.comments {
            attrs.insert("approval_comments".to_string(), serde_json::json!(comments));
        }
    }

    let update_req = UpdateCardRequest {
        name: None,
        lifecycle_phase: None,
        quality_score: None,
        description: None,
        attributes: Some(attributes),
        tags: Some(vec!["exception".to_string(), "approved".to_string()]),
    };

    // Use SAGA orchestrator for update (ensures consistency between PostgreSQL and Neo4j)
    let _updated_card = state.saga_orchestrator.update_card(id, update_req).await?;

    Ok(Json(ApproveExceptionResponse {
        id,
        status: ExceptionStatus::Approved,
        approved_by: req.approved_by,
        approved_at,
    }))
}

/// Reject an exception request
#[utoipa::path(
    patch,
    path = "/api/v1/exceptions/{id}/reject",
    params(
        ("id" = Uuid, Path, description = "Exception ID")
    ),
    request_body = RejectExceptionRequest,
    responses(
        (status = 200, description = "Exception rejected", body = RejectExceptionResponse),
        (status = 404, description = "Exception not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn reject_exception(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<RejectExceptionRequest>,
) -> Result<Json<RejectExceptionResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    if card.card_type != CardType::Exception {
        return Err(AppError::NotFound(format!("Card {} is not an exception", id)));
    }

    let exception = card_to_exception(card.clone())?;

    if exception.status != ExceptionStatus::Pending {
        return Err(AppError::Validation(format!(
            "Exception must be in Pending status to reject, current status: {:?}",
            exception.status
        )));
    }

    // Update attributes with rejection info
    let mut attributes = card.attributes;
    if let Some(attrs) = attributes.as_object_mut() {
        attrs.insert("status".to_string(), serde_json::json!(ExceptionStatus::Rejected));
        attrs.insert("approved_by".to_string(), serde_json::json!(req.approved_by));
        attrs.insert("rejection_reason".to_string(), serde_json::json!(req.rejection_reason));
        attrs.insert("rejected_at".to_string(), serde_json::json!(Utc::now().to_rfc3339()));
    }

    let update_req = UpdateCardRequest {
        name: None,
        lifecycle_phase: None,
        quality_score: None,
        description: None,
        attributes: Some(attributes),
        tags: Some(vec!["exception".to_string(), "rejected".to_string()]),
    };

    // Use SAGA orchestrator for update (ensures consistency between PostgreSQL and Neo4j)
    state.saga_orchestrator.update_card(id, update_req).await?;

    Ok(Json(RejectExceptionResponse {
        id,
        status: ExceptionStatus::Rejected,
        approved_by: req.approved_by,
        rejection_reason: req.rejection_reason,
    }))
}

/// List exceptions expiring soon
#[utoipa::path(
    get,
    path = "/api/v1/exceptions/expiring",
    params(ExpiringExceptionsParams),
    responses(
        (status = 200, description = "Expiring exceptions retrieved", body = ExpiringExceptionsResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn list_expiring_exceptions(
    State(state): State<AppState>,
    Query(params): Query<ExpiringExceptionsParams>,
) -> Result<Json<ExpiringExceptionsResponse>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let days = params.days.unwrap_or(30) as i64;
    let now = Utc::now();
    let threshold = now + Duration::days(days);

    // Get all exception cards
    let card_params = CardSearchParams {
        card_type: Some(CardType::Exception),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    };

    let (cards, _) = card_service.list(card_params).await?;

    // Filter for approved exceptions expiring within threshold
    let mut expiring: Vec<ExpiringException> = cards
        .into_iter()
        .filter_map(|card| {
            let exc = card_to_exception(card).ok()?;
            if exc.status != ExceptionStatus::Approved {
                return None;
            }
            let expires_at = exc.expires_at?;
            if expires_at <= threshold {
                let days_until = (expires_at - now).num_days();
                Some(ExpiringException {
                    id: exc.id,
                    policy_name: format!("Policy {}", exc.policy_id), // Would fetch from policy service
                    card_name: exc.name,
                    expires_at,
                    days_until_expiry: days_until as i32,
                    status: exc.status,
                })
            } else {
                None
            }
        })
        .collect();

    let total = expiring.len() as i64;

    // Sort by days_until_expiry ascending
    expiring.sort_by_key(|e| e.days_until_expiry);

    Ok(Json(ExpiringExceptionsResponse {
        data: expiring,
        total,
    }))
}

/// Delete an exception
#[utoipa::path(
    delete,
    path = "/api/v1/exceptions/{id}",
    params(
        ("id" = Uuid, Path, description = "Exception ID")
    ),
    responses(
        (status = 200, description = "Exception deleted successfully"),
        (status = 404, description = "Exception not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Exceptions"
)]
pub async fn delete_exception(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    let card_service = state.saga_orchestrator.get_card_service();
    let card = card_service.get(id).await?;

    if card.card_type != CardType::Exception {
        return Err(AppError::NotFound(format!("Card {} is not an exception", id)));
    }

    // Use SAGA orchestrator for delete (ensures consistency between PostgreSQL and Neo4j)
    state.saga_orchestrator.delete_card(id).await?;
    Ok(Json(()))
}

/// Helper: Convert Card to Exception
fn card_to_exception(card: crate::models::card::Card) -> Result<Exception> {
    let attrs = card.attributes;

    // Handle both old and new attribute field names for backward compatibility
    let policy_id: Uuid = attrs.get("related_policy_id")
        .or_else(|| attrs.get("policy_id"))
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Invalid or missing policy_id")))?;

    let card_id: Uuid = attrs.get("card_id")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Invalid or missing card_id")))?;

    let justification: String = attrs.get("exception_reason")
        .or_else(|| attrs.get("justification"))
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_else(|| card.description.clone().unwrap_or_default());

    let duration: ExceptionDuration = attrs.get("duration")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or(ExceptionDuration::Permanent);

    let compensating_controls: Vec<String> = attrs.get("compensating_controls")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or_default();

    let status: ExceptionStatus = attrs.get("status")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .unwrap_or(ExceptionStatus::Pending);

    // For now, use owner_id as requested_by since we don't have explicit user tracking yet
    let requested_by: Uuid = card.owner_id.unwrap_or_else(Uuid::new_v4);

    let approved_by: Option<Uuid> = attrs.get("approved_by")
        .cloned()
        .and_then(|v| serde_json::from_value(v).ok())
        .filter(|uuid: &Uuid| !uuid.is_nil()); // Filter out null/empty UUIDs

    // Handle both expiration_date and expires_at field names
    let expires_at: Option<chrono::DateTime<Utc>> =
        if let Some(exp_date) = attrs.get("expiration_date") {
            if exp_date.is_null() {
                None
            } else {
                serde_json::from_value(exp_date.clone()).ok()
            }
        } else if let Some(old_field) = attrs.get("expires_at") {
            if old_field.is_null() {
                None
            } else {
                serde_json::from_value(old_field.clone()).ok()
            }
        } else {
            None
        };

    Ok(Exception {
        id: card.id,
        name: card.name,
        card_type: "Exception".to_string(),
        policy_id,
        card_id,
        justification,
        duration,
        compensating_controls,
        status,
        requested_by,
        approved_by,
        expires_at,
        created_at: card.created_at,
    })
}