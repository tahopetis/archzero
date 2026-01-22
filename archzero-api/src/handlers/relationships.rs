use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use utoipa::ToSchema;

use crate::models::relationship::{Relationship, CreateRelationshipRequest, UpdateRelationshipRequest};
use crate::state::AppState;
use crate::Result;

/// Create a new relationship
#[utoipa::path(
    post,
    path = "/api/v1/relationships",
    request_body = CreateRelationshipRequest,
    responses(
        (status = 200, description = "Relationship created successfully", body = Relationship),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Relationships"
)]
pub async fn create_relationship(
    State(state): State<AppState>,
    Json(req): Json<CreateRelationshipRequest>,
) -> Result<Json<Relationship>> {
    let relationship = state.relationship_service.create(req).await?;
    Ok(Json(relationship))
}

/// Get a relationship by ID
#[utoipa::path(
    get,
    path = "/api/v1/relationships/{id}",
    params(
        ("id" = Uuid, Path, description = "Relationship ID")
    ),
    responses(
        (status = 200, description = "Relationship retrieved successfully", body = Relationship),
        (status = 404, description = "Relationship not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Relationships"
)]
pub async fn get_relationship(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Relationship>> {
    let relationship = state.relationship_service.get(id).await?;
    Ok(Json(relationship))
}

/// List relationships
#[utoipa::path(
    get,
    path = "/api/v1/relationships",
    params(
        ("card_id" = Option<Uuid>, Query, description = "Filter by card ID")
    ),
    responses(
        (status = 200, description = "Relationships retrieved successfully", body = Vec<Relationship>),
        (status = 500, description = "Internal server error")
    ),
    tag = "Relationships"
)]
pub async fn list_relationships(
    State(state): State<AppState>,
    Query(params): Query<CardRelationshipParams>,
) -> Result<Json<Vec<Relationship>>> {
    let relationships = if let Some(card_id) = params.card_id {
        state.relationship_service.list_for_card(card_id).await?
    } else {
        state.relationship_service.list_all().await?
    };
    Ok(Json(relationships))
}

/// Update a relationship
#[utoipa::path(
    put,
    path = "/api/v1/relationships/{id}",
    params(
        ("id" = Uuid, Path, description = "Relationship ID")
    ),
    request_body = UpdateRelationshipRequest,
    responses(
        (status = 200, description = "Relationship updated successfully", body = Relationship),
        (status = 404, description = "Relationship not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Relationships"
)]
pub async fn update_relationship(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateRelationshipRequest>,
) -> Result<Json<Relationship>> {
    let relationship = state.relationship_service.update(id, req).await?;
    Ok(Json(relationship))
}

/// Delete a relationship
#[utoipa::path(
    delete,
    path = "/api/v1/relationships/{id}",
    params(
        ("id" = Uuid, Path, description = "Relationship ID")
    ),
    responses(
        (status = 200, description = "Relationship deleted successfully"),
        (status = 404, description = "Relationship not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Relationships"
)]
pub async fn delete_relationship(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    state.relationship_service.delete(id).await?;
    Ok(Json(()))
}

#[derive(serde::Deserialize, ToSchema)]
pub struct CardRelationshipParams {
    pub card_id: Option<Uuid>,
}
