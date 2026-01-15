use axum::{Json, extract::State};
use crate::Result;
use crate::state::AppState;

/// Reset authentication state for testing
/// This endpoint should ONLY be available in development/test environments
pub async fn reset_auth_state(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>> {
    // Reset all users' failed login attempts and lock status
    state.auth_service.reset_auth_state().await?;

    Ok(Json(serde_json::json!({
        "status": "ok",
        "message": "Authentication state reset"
    })))
}

/// Clean up ALL cards from the database (including soft-deleted ones)
/// This endpoint should ONLY be available in development/test environments
pub async fn cleanup_all_cards(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>> {
    // Delete ALL cards from the database
    let deleted_count = state.card_service.delete_all().await?;

    Ok(Json(serde_json::json!({
        "status": "ok",
        "message": "All cards cleaned up",
        "deleted_count": deleted_count
    })))
}
