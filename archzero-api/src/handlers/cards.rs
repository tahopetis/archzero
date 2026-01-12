use axum::{extract::{Path, State, Query}, Json};
use uuid::Uuid;
use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::services::CardService;
use crate::Result;

pub async fn create_card(
    State(card_service): State<CardService>,
    Json(req): Json<CreateCardRequest>,
) -> Result<Json<Card>> {
    let card = card_service.create(req).await?;
    Ok(Json(card))
}

pub async fn get_card(
    State(card_service): State<CardService>,
    Path(id): Path<Uuid>,
) -> Result<Json<Card>> {
    let card = card_service.get(id).await?;
    Ok(Json(card))
}

pub async fn list_cards(
    State(card_service): State<CardService>,
    Query(params): Query<CardSearchParams>,
) -> Result<Json<Vec<Card>>> {
    let cards = card_service.list(params).await?;
    Ok(Json(cards))
}

pub async fn update_card(
    State(card_service): State<CardService>,
    Path(id): Path<Uuid>,
    Json(req): Json<UpdateCardRequest>,
) -> Result<Json<Card>> {
    let card = card_service.update(id, req).await?;
    Ok(Json(card))
}

pub async fn delete_card(
    State(card_service): State<CardService>,
    Path(id): Path<Uuid>,
) -> Result<Json<()>> {
    card_service.delete(id).await?;
    Ok(Json(()))
}
