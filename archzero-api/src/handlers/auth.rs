use axum::{Json, extract::State};
use uuid::Uuid;
use crate::models::user::{LoginRequest, LoginResponse, UserRole};
use crate::Result;
use crate::state::AppState;

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Call auth service to authenticate
    let response = state.auth_service.login(req).await?;

    Ok(Json(response))
}

pub async fn logout() -> &'static str {
    // JWT is stateless, logout is client-side
    "Logged out"
}

pub async fn me() -> Result<Json<crate::models::user::User>> {
    // TODO: Implement when auth middleware is set up
    let user = crate::models::user::User {
        id: Uuid::new_v4(),
        email: "user@example.com".to_string(),
        full_name: None,
        role: UserRole::Viewer,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    Ok(Json(user))
}
