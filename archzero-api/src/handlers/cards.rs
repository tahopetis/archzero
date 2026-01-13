use axum::{extract::{Path, Query, State}, Json};
use uuid::Uuid;
use serde::Serialize;
use utoipa::ToSchema;

use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::Result;
use crate::state::AppState;

#[derive(Serialize, ToSchema)]
pub struct CardListResponse {
    pub data: Vec<Card>,
    pub total: i64,
    pub page: u32,
    pub page_size: u32,
}

/// Create a new card
#[utoipa::path(
    post,
    path = "/api/v1/cards",
    request_body = CreateCardRequest,
    responses(
        (status = 200, description = "Card created successfully", body = Card),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn create_card(
    State(state): State<AppState>,
    Json(req): Json<CreateCardRequest>,
) -> Result<Json<Card>> {
    let card = state.saga_orchestrator.create_card(req).await?;
    Ok(Json(card))
}

/// Get a card by ID
#[utoipa::path(
    get,
    path = "/api/v1/cards/{id}",
    params(
        ("id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "Card retrieved successfully", body = Card),
        (status = 404, description = "Card not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn get_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Card>> {
    // For reads, we only need PostgreSQL
    let card = state.saga_orchestrator.get_card_service().get(id).await?;
    Ok(Json(card))
}

/// List cards with optional filters
#[utoipa::path(
    get,
    path = "/api/v1/cards",
    params(CardSearchParams),
    responses(
        (status = 200, description = "Cards retrieved successfully", body = CardListResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn list_cards(
    State(state): State<AppState>,
    Query(params): Query<CardSearchParams>,
) -> Result<Json<CardListResponse>> {
    let page = params.page.unwrap_or(1);
    let page_size = params.page_size.unwrap_or(20);
    let (cards, total) = state.saga_orchestrator.get_card_service().list(params).await?;
    Ok(Json(CardListResponse {
        data: cards,
        total,
        page,
        page_size,
    }))
}

/// Update a card
#[utoipa::path(
    put,
    path = "/api/v1/cards/{id}",
    params(
        ("id" = Uuid, Path, description = "Card ID")
    ),
    request_body = UpdateCardRequest,
    responses(
        (status = 200, description = "Card updated successfully", body = Card),
        (status = 404, description = "Card not found"),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn update_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCardRequest>,
) -> Result<Json<Card>> {
    let card = state.saga_orchestrator.update_card(id, req).await?;
    Ok(Json(card))
}

/// Delete a card
#[utoipa::path(
    delete,
    path = "/api/v1/cards/{id}",
    params(
        ("id" = Uuid, Path, description = "Card ID")
    ),
    responses(
        (status = 200, description = "Card deleted successfully"),
        (status = 404, description = "Card not found"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cards"
)]
pub async fn delete_card(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    state.saga_orchestrator.delete_card(id).await?;
    Ok(Json(()))
}
