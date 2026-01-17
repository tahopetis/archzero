use axum::{
    extract::{Path, Query, State, Extension},
    Json,
    http::StatusCode,
};
use uuid::Uuid;
use chrono::{Utc, NaiveDate};
use serde::Deserialize;

use crate::{
    models::{
        arb::*,
        arb_template::*,
        card::{CardType, LifecyclePhase, CreateCardRequest, UpdateCardRequest},
        user::Claims,
    },
    state::AppState,
    error::AppError,
};

/// Helper to extract ARB meeting from card attributes
fn card_to_arb_meeting(card: crate::models::card::Card) -> Result<ARBMeeting, AppError> {
    let attrs = &card.attributes;

    let scheduled_date_str = attrs["scheduledDate"]
        .as_str()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing scheduledDate")))?;
    let scheduled_date = NaiveDate::parse_from_str(scheduled_date_str, "%Y-%m-%d")
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Invalid scheduledDate: {}", e)))?;

    let status_str = attrs["status"]
        .as_str()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing status")))?;
    let status: ARBMeetingStatus = serde_json::from_str(&format!("\"{}\"", status_str))
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid status: {}", status_str)))?;

    let agenda_value = attrs["agenda"]
        .as_array()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Invalid agenda")))?;
    let agenda: Vec<String> = serde_json::from_value(serde_json::json!(agenda_value))
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid agenda")))?;

    let attendees_value = attrs["attendees"]
        .as_array()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Invalid attendees")))?;
    let attendees: Vec<Uuid> = serde_json::from_value(serde_json::json!(attendees_value))
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid attendees")))?;

    Ok(ARBMeeting {
        id: card.id,
        title: card.name,
        meeting_type: "ARBMeeting".to_string(),
        scheduled_date,
        status,
        agenda,
        attendees,
        created_at: card.created_at,
        updated_at: card.updated_at,
    })
}

/// Helper to extract ARB submission from card attributes
pub fn card_to_arb_submission(card: crate::models::card::Card) -> Result<ARBSubmission, AppError> {
    let attrs = &card.attributes;

    let meeting_id = attrs.get("meetingId")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());

    let card_id = attrs.get("cardId")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());

    let submission_type_str = attrs["submissionType"]
        .as_str()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing submissionType")))?;
    let submission_type: ARBSubmissionType = serde_json::from_str(&format!("\"{}\"", submission_type_str))
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid submissionType: {}", submission_type_str)))?;

    let rationale = attrs["rationale"]
        .as_str()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing rationale")))?
        .to_string();

    let submitted_by = attrs["submittedBy"]
        .as_str()
        .and_then(|s| Uuid::parse_str(s).ok())
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing or invalid submittedBy")))?;

    let submitted_at_str = attrs["submittedAt"]
        .as_str()
        .ok_or_else(|| AppError::Internal(anyhow::anyhow!("Missing submittedAt")))?;
    let submitted_at: chrono::DateTime<Utc> = submitted_at_str.parse()
        .map_err(|_| AppError::Internal(anyhow::anyhow!("Invalid submittedAt")))?;

    let decision = attrs.get("decision")
        .and_then(|v| serde_json::from_value::<ARBDecision>(v.clone()).ok());

    let priority = attrs.get("priority")
        .and_then(|v| v.as_str())
        .and_then(|s| serde_json::from_str::<ARBPriority>(&format!("\"{}\"", s)).ok());

    let related_policy_id = attrs.get("relatedPolicyId")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());

    Ok(ARBSubmission {
        id: card.id,
        title: attrs.get("title").and_then(|v| v.as_str()).map(String::from),
        meeting_id,
        card_id,
        submission_type,
        rationale,
        submitted_by,
        submitted_at,
        decision,
        priority,
        related_policy_id,
        created_at: card.created_at,
        updated_at: card.updated_at,
    })
}

/// List all ARB meetings
#[utoipa::path(
    get,
    path = "/api/v1/arb/meetings",
    params(ARBMeetingSearchParams),
    responses(
        (status = 200, description = "ARB meetings listed successfully", body = ARBMeetingListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "list_arb_meetings"
)]
pub async fn list_meetings(
    State(state): State<AppState>,
    Query(params): Query<ARBMeetingSearchParams>,
) -> Result<Json<ARBMeetingListResponse>, StatusCode> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).min(100);

    // Build query filter - we'll need to filter by attributes
    let (cards, total) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBMeeting),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: Some(page),
        page_size: Some(page_size),
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list ARB meetings: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Filter by status and date range from attributes
    let mut meetings: Vec<ARBMeeting> = Vec::new();
    for card in cards {
        match card_to_arb_meeting(card) {
            Ok(meeting) => {
                // Apply status filter
                if let Some(ref status_filter) = params.status {
                    if &meeting.status != status_filter {
                        continue;
                    }
                }

                // Apply date range filters
                if let Some(from) = params.date_from {
                    if meeting.scheduled_date < from {
                        continue;
                    }
                }
                if let Some(to) = params.date_to {
                    if meeting.scheduled_date > to {
                        continue;
                    }
                }

                meetings.push(meeting);
            }
            Err(e) => {
                tracing::warn!("Failed to convert card to ARB meeting: {}", e);
                continue;
            }
        }
    }

    Ok(Json(ARBMeetingListResponse {
        data: meetings,
        pagination: ARBPagination {
            page,
            limit: page_size,
            total,
        },
    }))
}

/// Get a specific ARB meeting by ID
#[utoipa::path(
    get,
    path = "/api/v1/arb/meetings/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB meeting ID")
    ),
    responses(
        (status = 200, description = "ARB meeting found", body = ARBMeeting),
        (status = 404, description = "ARB meeting not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "get_arb_meeting"
)]
pub async fn get_meeting(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ARBMeeting>, StatusCode> {
    let card = match state.card_service.get(id).await {
        Ok(c) => c,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if card.card_type != CardType::ARBMeeting {
        return Err(StatusCode::NOT_FOUND);
    }

    match card_to_arb_meeting(card) {
        Ok(meeting) => return Ok(Json(meeting)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Create a new ARB meeting
#[utoipa::path(
    post,
    path = "/api/v1/arb/meetings",
    request_body = CreateARBMeetingRequest,
    responses(
        (status = 201, description = "ARB meeting created", body = ARBMeeting),
        (status = 400, description = "Invalid request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "create_arb_meeting"
)]
pub async fn create_meeting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateARBMeetingRequest>,
) -> Result<Json<ARBMeeting>, StatusCode> {
    // Extract user ID from JWT claims (injected by auth middleware)
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    let attributes = serde_json::json!({
        "scheduledDate": req.scheduled_date.to_string(),
        "status": ARBMeetingStatus::Scheduled,
        "agenda": req.agenda,
        "attendees": req.attendees,
    });

    let create_req = CreateCardRequest {
        name: req.title,
        card_type: CardType::ARBMeeting,
        lifecycle_phase: LifecyclePhase::Active,
        quality_score: None,
        description: Some("ARB Meeting".to_string()),
        owner_id: Some(user_id),
        attributes: Some(attributes),
        tags: Some(vec!["arb".to_string(), "meeting".to_string()]),
    };

    let card = match state.card_service.create(create_req).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to create ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match card_to_arb_meeting(card) {
        Ok(meeting) => return Ok(Json(meeting)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Update an ARB meeting
#[utoipa::path(
    put,
    path = "/api/v1/arb/meetings/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB meeting ID")
    ),
    request_body = UpdateARBMeetingRequest,
    responses(
        (status = 200, description = "ARB meeting updated", body = ARBMeeting),
        (status = 404, description = "ARB meeting not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "update_arb_meeting"
)]
pub async fn update_meeting(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateARBMeetingRequest>,
) -> Result<Json<ARBMeeting>, StatusCode> {
    // First get the current card to merge attributes
    let current = match state.card_service.get(id).await {
        Ok(c) => c,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if current.card_type != CardType::ARBMeeting {
        return Err(StatusCode::NOT_FOUND);
    }

    // Merge the existing attributes with updates
    let mut attrs = current.attributes;
    if let Some(scheduled_date) = req.scheduled_date {
        attrs["scheduledDate"] = serde_json::json!(scheduled_date.to_string());
    }
    if let Some(status) = req.status {
        attrs["status"] = serde_json::json!(status);
    }
    if let Some(agenda) = req.agenda {
        attrs["agenda"] = serde_json::json!(agenda);
    }
    if let Some(attendees) = req.attendees {
        attrs["attendees"] = serde_json::json!(attendees);
    }

    let update_req = UpdateCardRequest {
        name: req.title,
        lifecycle_phase: None,
        quality_score: None,
        description: None,
        attributes: Some(attrs),
        tags: None,
    };

    let card = match state.card_service.update(id, update_req).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to update ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match card_to_arb_meeting(card) {
        Ok(meeting) => return Ok(Json(meeting)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Delete an ARB meeting
#[utoipa::path(
    delete,
    path = "/api/v1/arb/meetings/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB meeting ID")
    ),
    responses(
        (status = 204, description = "ARB meeting deleted"),
        (status = 404, description = "ARB meeting not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "delete_arb_meeting"
)]
pub async fn delete_meeting(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    match state.card_service.delete(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to delete ARB meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Get meeting agenda
#[utoipa::path(
    get,
    path = "/api/v1/arb/meetings/{id}/agenda",
    params(
        ("id" = Uuid, Path, description = "ARB meeting ID")
    ),
    responses(
        (status = 200, description = "Meeting agenda retrieved", body = Vec<ARBAgendaItem>),
        (status = 404, description = "ARB meeting not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "get_meeting_agenda"
)]
pub async fn get_meeting_agenda(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<ARBAgendaItem>>, StatusCode> {
    // Get all submissions and filter by meeting_id
    let (cards, _) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBSubmission),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list submissions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let mut agenda_items = Vec::new();
    for card in cards {
        if let Ok(submission) = card_to_arb_submission(card) {
            if submission.meeting_id == Some(id) {
                let card_ref = match submission.card_id {
                    Some(card_id) => match state.card_service.get(card_id).await {
                        Ok(c) => c,
                        Err(_) => continue,
                    },
                    None => continue,
                };

                let item = ARBAgendaItem {
                    submission_id: submission.id,
                    title: card_ref.name,
                    submission_type: submission.submission_type,
                    priority: submission.priority.unwrap_or(ARBPriority::Medium),
                    estimated_duration_minutes: None,
                };
                agenda_items.push(item);
            }
        }
    }

    Ok(Json(agenda_items))
}

/// Add submission to meeting agenda
#[utoipa::path(
    post,
    path = "/api/v1/arb/meetings/{id}/agenda",
    params(
        ("id" = Uuid, Path, description = "ARB meeting ID")
    ),
    request_body = AddSubmissionToMeetingRequest,
    responses(
        (status = 200, description = "Submission added to agenda"),
        (status = 404, description = "ARB meeting or submission not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "add_submission_to_agenda"
)]
pub async fn add_submission_to_agenda(
    State(state): State<AppState>,
    Path(meeting_id): Path<Uuid>,
    Json(req): Json<AddSubmissionToMeetingRequest>,
) -> Result<StatusCode, StatusCode> {
    // Verify meeting exists
    let meeting = match state.card_service.get(meeting_id).await {
        Ok(m) => m,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get meeting: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if meeting.card_type != CardType::ARBMeeting {
        return Err(StatusCode::NOT_FOUND);
    }

    // Get submission and update its meeting_id
    let submission = match state.card_service.get(req.submission_id).await {
        Ok(s) => s,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if submission.card_type != CardType::ARBSubmission {
        return Err(StatusCode::NOT_FOUND);
    }

    // Update submission's meeting_id in attributes
    let mut attrs = submission.attributes;
    attrs["meetingId"] = serde_json::json!(meeting_id);

    let update_req = UpdateCardRequest {
        name: None,
        lifecycle_phase: None,
        quality_score: None,
        description: None,
        attributes: Some(attrs),
        tags: None,
    };

    match state.card_service.update(req.submission_id, update_req).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => {
            tracing::error!("Failed to add submission to agenda: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// List all ARB submissions
#[utoipa::path(
    get,
    path = "/api/v1/arb/submissions",
    params(ARBSubmissionSearchParams),
    responses(
        (status = 200, description = "ARB submissions listed successfully", body = ARBSubmissionListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "list_arb_submissions"
)]
pub async fn list_submissions(
    State(state): State<AppState>,
    Query(params): Query<ARBSubmissionSearchParams>,
) -> Result<Json<ARBSubmissionListResponse>, StatusCode> {
    let page = params.page.unwrap_or(1).max(1);
    let page_size = params.page_size.unwrap_or(20).min(100);

    let (cards, total) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBSubmission),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: Some(page),
        page_size: Some(page_size),
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list ARB submissions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let mut submissions: Vec<ARBSubmission> = Vec::new();
    for card in cards {
        match card_to_arb_submission(card) {
            Ok(submission) => {
                // Apply filters
                if let Some(ref meeting_id) = params.meeting_id {
                    if submission.meeting_id != Some(*meeting_id) {
                        continue;
                    }
                }

                if let Some(ref submission_type) = params.submission_type {
                    if &submission.submission_type != submission_type {
                        continue;
                    }
                }

                // Determine status based on decision
                let status = if submission.decision.is_some() {
                    ARBSubmissionStatus::DecisionMade
                } else if submission.meeting_id.is_some() {
                    ARBSubmissionStatus::UnderReview
                } else {
                    ARBSubmissionStatus::Pending
                };

                if let Some(ref status_filter) = params.status {
                    if &status != status_filter {
                        continue;
                    }
                }

                submissions.push(submission);
            }
            Err(e) => {
                tracing::warn!("Failed to convert card to ARB submission: {}", e);
                continue;
            }
        }
    }

    Ok(Json(ARBSubmissionListResponse {
        data: submissions,
        pagination: ARBPagination {
            page,
            limit: page_size,
            total,
        },
    }))
}

/// Get a specific ARB submission
#[utoipa::path(
    get,
    path = "/api/v1/arb/submissions/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB submission ID")
    ),
    responses(
        (status = 200, description = "ARB submission found", body = ARBSubmission),
        (status = 404, description = "ARB submission not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "get_arb_submission"
)]
pub async fn get_submission(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ARBSubmission>, StatusCode> {
    let card = match state.card_service.get(id).await {
        Ok(c) => c,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if card.card_type != CardType::ARBSubmission {
        return Err(StatusCode::NOT_FOUND);
    }

    match card_to_arb_submission(card) {
        Ok(submission) => return Ok(Json(submission)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Create a new ARB submission
#[utoipa::path(
    post,
    path = "/api/v1/arb/submissions",
    request_body = CreateARBSubmissionRequest,
    responses(
        (status = 201, description = "ARB submission created", body = ARBSubmission),
        (status = 400, description = "Invalid request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "create_arb_submission"
)]
pub async fn create_submission(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateARBSubmissionRequest>,
) -> Result<Json<ARBSubmission>, StatusCode> {
    // Extract user ID from JWT claims (injected by auth middleware)
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Get the related card to use as name
    let related_card = match req.card_id {
        Some(card_id) => {
            let card = state.card_service.get(card_id).await
                .map_err(|e| {
                    tracing::error!("Failed to get related card: {}", e);
                    if matches!(e, AppError::NotFound(_)) {
                        StatusCode::BAD_REQUEST
                    } else {
                        StatusCode::INTERNAL_SERVER_ERROR
                    }
                })?;
            Some(card)
        },
        None => None,
    };

    // The ARB submission is always owned by the authenticated user creating it
    let submitted_by = user_id;
    let submitted_at = Utc::now();
    let unique_id = Uuid::new_v4().to_string();
    let unique_suffix = unique_id.split('-').next().unwrap_or("xxxx");

    // Generate a unique name for the submission card
    let submission_name = if let Some(ref title) = req.title {
        format!("{} - {}", title, unique_suffix)
    } else {
        related_card.as_ref().map(|c| {
            format!("{} - {}", c.name, unique_suffix)
        }).unwrap_or_else(|| {
            format!("ARB Submission - {} - {}", submitted_at.format("%Y%m%d%H%M%S"), unique_suffix)
        })
    };

    let attributes = serde_json::json!({
        "title": req.title,
        "meetingId": req.meeting_id,
        "cardId": req.card_id,
        "submissionType": req.submission_type,
        "rationale": req.rationale,
        "submittedBy": submitted_by,
        "submittedAt": submitted_at.to_rfc3339(),
        "priority": req.priority,
        "relatedPolicyId": req.related_policy_id,
    });

    let create_req = CreateCardRequest {
        name: submission_name,
        card_type: CardType::ARBSubmission,
        lifecycle_phase: LifecyclePhase::Discovery,
        quality_score: None,
        description: Some(req.rationale.clone()),
        owner_id: Some(submitted_by),
        attributes: Some(attributes),
        tags: Some(vec!["arb".to_string(), "submission".to_string()]),
    };

    let card = match state.card_service.create(create_req).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to create ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match card_to_arb_submission(card) {
        Ok(submission) => return Ok(Json(submission)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Update an ARB submission
#[utoipa::path(
    put,
    path = "/api/v1/arb/submissions/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB submission ID")
    ),
    request_body = UpdateARBSubmissionRequest,
    responses(
        (status = 200, description = "ARB submission updated", body = ARBSubmission),
        (status = 404, description = "ARB submission not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "update_arb_submission"
)]
pub async fn update_submission(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateARBSubmissionRequest>,
) -> Result<Json<ARBSubmission>, StatusCode> {
    let current = match state.card_service.get(id).await {
        Ok(c) => c,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if current.card_type != CardType::ARBSubmission {
        return Err(StatusCode::NOT_FOUND);
    }

    // Merge attributes
    let mut attrs = current.attributes;
    if let Some(meeting_id) = req.meeting_id {
        attrs["meetingId"] = serde_json::json!(meeting_id);
    }
    if let Some(ref rationale) = req.rationale {
        attrs["rationale"] = serde_json::json!(rationale);
    }
    if let Some(priority) = req.priority {
        attrs["priority"] = serde_json::json!(priority);
    }

    let update_req = UpdateCardRequest {
        name: None,
        lifecycle_phase: None,
        quality_score: None,
        description: req.rationale.clone(),
        attributes: Some(attrs),
        tags: None,
    };

    let card = match state.card_service.update(id, update_req).await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Failed to update ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    match card_to_arb_submission(card) {
        Ok(submission) => return Ok(Json(submission)),
        Err(e) => {
            tracing::error!("Failed to convert card to ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Delete an ARB submission
#[utoipa::path(
    delete,
    path = "/api/v1/arb/submissions/{id}",
    params(
        ("id" = Uuid, Path, description = "ARB submission ID")
    ),
    responses(
        (status = 204, description = "ARB submission deleted"),
        (status = 404, description = "ARB submission not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "delete_arb_submission"
)]
pub async fn delete_submission(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, StatusCode> {
    match state.card_service.delete(id).await {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(AppError::NotFound(_)) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to delete ARB submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Record ARB decision for a submission
#[utoipa::path(
    post,
    path = "/api/v1/arb/submissions/{id}/decision",
    params(
        ("id" = Uuid, Path, description = "ARB submission ID")
    ),
    request_body = CreateARBDecisionRequest,
    responses(
        (status = 201, description = "ARB decision recorded", body = ARBDecision),
        (status = 400, description = "Invalid request"),
        (status = 404, description = "ARB submission not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "record_arb_decision"
)]
pub async fn record_decision(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(submission_id): Path<Uuid>,
    Json(req): Json<CreateARBDecisionRequest>,
) -> Result<Json<ARBDecision>, StatusCode> {
    // Extract user ID from JWT claims (injected by auth middleware)
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Verify submission exists
    let submission = match state.card_service.get(submission_id).await {
        Ok(s) => s,
        Err(AppError::NotFound(_)) => return Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get submission: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    if submission.card_type != CardType::ARBSubmission {
        return Err(StatusCode::NOT_FOUND);
    }

    // Create decision
    let decision_id = Uuid::new_v4();
    let decided_by = user_id; // Use the authenticated user who made the decision
    let decided_at = Utc::now();

    let decision = ARBDecision {
        id: decision_id,
        submission_id,
        decision_type: req.decision_type,
        decided_by,
        decided_at,
        conditions: req.conditions,
        rationale: req.rationale,
        valid_until: req.valid_until,
    };

    // Store decision in submission's attributes
    let mut attrs = submission.attributes;
    attrs["decision"] = serde_json::to_value(&decision).unwrap();

    let update_req = UpdateCardRequest {
        name: None,
        lifecycle_phase: Some(LifecyclePhase::Active),
        quality_score: None,
        description: None,
        attributes: Some(attrs),
        tags: None,
    };

    match state.card_service.update(submission_id, update_req).await {
        Ok(_) => Ok(Json(decision)),
        Err(e) => {
            tracing::error!("Failed to record decision: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    }
}

/// Get ARB dashboard
#[utoipa::path(
    get,
    path = "/api/v1/arb/dashboard",
    responses(
        (status = 200, description = "ARB dashboard retrieved", body = ARBDashboard),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "get_arb_dashboard"
)]
pub async fn get_dashboard(
    State(state): State<AppState>,
) -> Result<Json<ARBDashboard>, StatusCode> {
    // Get all submissions
    let (submission_cards, _) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBSubmission),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list submissions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get all meetings
    let (meeting_cards, _) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBMeeting),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list meetings: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let mut pending_submissions = 0;
    let mut critical_submissions = 0;
    let mut decisions_this_month = 0;
    let mut total_decision_time_hours = 0.0;
    let mut decision_count = 0;

    let today = Utc::now().date_naive();

    for card in &submission_cards {
        if let Ok(submission) = card_to_arb_submission(card.clone()) {
            // Count pending (no decision)
            if submission.decision.is_none() {
                pending_submissions += 1;
            } else {
                decisions_this_month += 1;
                decision_count += 1;

                // Calculate decision time
                if let Some(decision) = &submission.decision {
                    let duration = decision.decided_at.signed_duration_since(submission.submitted_at);
                    total_decision_time_hours += duration.num_hours() as f64;
                }
            }

            // Count critical
            if submission.priority == Some(ARBPriority::Critical) && submission.decision.is_none() {
                critical_submissions += 1;
            }
        }
    }

    let mut upcoming_meetings = 0;
    for card in &meeting_cards {
        if let Ok(meeting) = card_to_arb_meeting(card.clone()) {
            if meeting.scheduled_date >= today && meeting.status == ARBMeetingStatus::Scheduled {
                upcoming_meetings += 1;
            }
        }
    }

    let avg_decision_time_days = if decision_count > 0 {
        (total_decision_time_hours / decision_count as f64) / 24.0
    } else {
        0.0
    };

    let dashboard = ARBDashboard {
        pending_submissions,
        upcoming_meetings,
        decisions_this_month,
        critical_submissions,
        avg_decision_time_days,
    };

    Ok(Json(dashboard))
}

/// Get ARB statistics
#[utoipa::path(
    get,
    path = "/api/v1/arb/statistics",
    responses(
        (status = 200, description = "ARB statistics retrieved", body = ARBStatistics),
        (status = 500, description = "Internal server error")
    ),
    tag = "ARB",
    operation_id = "get_arb_statistics"
)]
pub async fn get_statistics(
    State(state): State<AppState>,
) -> Result<Json<ARBStatistics>, StatusCode> {
    // Get all submissions
    let (submission_cards, _) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBSubmission),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list submissions: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    // Get all meetings
    let (meeting_cards, _) = match state.card_service.list(crate::models::card::CardSearchParams {
        card_type: Some(CardType::ARBMeeting),
        q: None,
        lifecycle_phase: None,
        tags: None,
        page: None,
        page_size: None,
    }).await {
        Ok(result) => result,
        Err(e) => {
            tracing::error!("Failed to list meetings: {}", e);
            return Err(StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let total_submissions = submission_cards.len() as i64;
    let total_meetings = meeting_cards.len() as i64;

    let mut approvals = 0;
    let mut total_decision_time_hours = 0.0;
    let mut decision_count = 0;

    use std::collections::HashMap;
    let mut submissions_by_type: HashMap<String, i64> = HashMap::new();
    let mut decisions_by_type: HashMap<String, i64> = HashMap::new();

    for card in &submission_cards {
        if let Ok(submission) = card_to_arb_submission(card.clone()) {
            // Count by submission type
            let type_str = format!("{:?}", submission.submission_type);
            *submissions_by_type.entry(type_str).or_insert(0) += 1;

            // Count decisions
            if let Some(decision) = &submission.decision {
                decision_count += 1;

                // Count approvals
                if matches!(decision.decision_type, ARBDecisionType::Approve | ARBDecisionType::ApproveWithConditions) {
                    approvals += 1;
                }

                // Count by decision type
                let decision_type_str = format!("{:?}", decision.decision_type);
                *decisions_by_type.entry(decision_type_str).or_insert(0) += 1;

                // Calculate decision time
                let duration = decision.decided_at.signed_duration_since(submission.submitted_at);
                total_decision_time_hours += duration.num_hours() as f64;
            }
        }
    }

    let approval_rate = if decision_count > 0 {
        (approvals as f64 / decision_count as f64) * 100.0
    } else {
        0.0
    };

    let avg_decision_time_hours = if decision_count > 0 {
        total_decision_time_hours / decision_count as f64
    } else {
        0.0
    };

    // Convert HashMap counts to proper structs
    let submission_type_counts: Vec<SubmissionTypeCount> = submissions_by_type
        .into_iter()
        .map(|(type_str, count)| {
            let submission_type: ARBSubmissionType = serde_json::from_str(&format!("\"{}\"", type_str))
                .unwrap_or(ARBSubmissionType::Other(type_str));
            SubmissionTypeCount {
                submission_type,
                count,
            }
        })
        .collect();

    let decision_type_counts: Vec<DecisionTypeCount> = decisions_by_type
        .into_iter()
        .map(|(type_str, count)| {
            let decision_type: ARBDecisionType = serde_json::from_str(&format!("\"{}\"", type_str))
                .unwrap_or(ARBDecisionType::Defer);
            DecisionTypeCount {
                decision_type,
                count,
            }
        })
        .collect();

    let statistics = ARBStatistics {
        total_submissions,
        total_meetings,
        approval_rate,
        avg_decision_time_hours,
        submissions_by_type: submission_type_counts,
        decisions_by_type: decision_type_counts,
    };

    Ok(Json(statistics))
}

// ============================================================================
// ARB Templates Handlers
// ============================================================================

/// List all ARB templates
pub async fn list_templates(
    State(state): State<AppState>,
) -> Result<Json<Vec<ARBTemplate>>, AppError> {
    let templates = state.arb_template_service.list_templates().await?;
    Ok(Json(templates))
}

/// Get a specific template by ID
pub async fn get_template(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<ARBTemplate>, AppError> {
    let template = state.arb_template_service.get_template(id).await?;
    Ok(Json(template))
}

/// Create a new template from an existing submission
pub async fn create_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateTemplateRequest>,
) -> Result<Json<ARBTemplate>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Auth("Invalid user ID".to_string()))?;
    let template = state.arb_template_service.create_template(req, user_id).await?;
    Ok(Json(template))
}

/// Create a new submission from a template
pub async fn create_from_template(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(req): Json<CreateFromTemplateRequest>,
) -> Result<Json<crate::models::arb::ARBSubmission>, AppError> {
    let user_id = Uuid::parse_str(&claims.sub).map_err(|_| AppError::Auth("Invalid user ID".to_string()))?;
    let submission = state.arb_template_service.create_from_template(req, user_id).await?;
    Ok(Json(submission))
}

/// Update an existing template
pub async fn update_template(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateTemplateRequest>,
) -> Result<Json<ARBTemplate>, AppError> {
    let template = state.arb_template_service.update_template(id, req).await?;
    Ok(Json(template))
}

/// Delete a template
pub async fn delete_template(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    state.arb_template_service.delete_template(id).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ============================================================================
// Audit Log Handlers
// ============================================================================

/// Filter for audit log queries
#[derive(Debug, Deserialize, Default)]
pub struct AuditLogFilter {
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub action: Option<String>,
    pub actor_id: Option<Uuid>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
}

/// Get audit logs for a specific entity
pub async fn get_entity_audit_logs(
    State(state): State<AppState>,
    Path((entity_type, entity_id)): Path<(String, Uuid)>,
    Query(params): Query<AuditLogQueryParams>,
) -> Result<Json<Vec<crate::models::arb_audit_log::ARBAuditLog>>, AppError> {
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = params.offset.unwrap_or(0);

    let logs = state
        .arb_audit_service
        .get_entity_logs(&entity_type, entity_id, limit, offset)
        .await?;

    Ok(Json(logs))
}

/// Get audit logs with filters
pub async fn get_audit_logs(
    State(state): State<AppState>,
    Query(filters): Query<AuditLogFilter>,
    Query(params): Query<AuditLogQueryParams>,
) -> Result<Json<Vec<crate::models::arb_audit_log::ARBAuditLog>>, AppError> {
    let limit = params.limit.unwrap_or(50).min(100);
    let offset = params.offset.unwrap_or(0);

    let service_filters = crate::services::arb_audit_service::AuditLogFilter {
        entity_type: filters.entity_type,
        entity_id: filters.entity_id,
        action: filters.action,
        actor_id: filters.actor_id,
        start_date: filters.start_date,
        end_date: filters.end_date,
    };

    let logs = state
        .arb_audit_service
        .get_logs_filtered(service_filters, limit, offset)
        .await?;

    Ok(Json(logs))
}

/// Query parameters for pagination
#[derive(Debug, Deserialize)]
pub struct AuditLogQueryParams {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

