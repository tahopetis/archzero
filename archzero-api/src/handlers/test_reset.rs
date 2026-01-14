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
