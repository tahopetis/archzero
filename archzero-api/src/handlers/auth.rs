use axum::Json;
use uuid::Uuid;
use crate::models::user::{LoginRequest, LoginResponse, UserRole};
use crate::Result;

pub async fn login(
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // TODO: Implement proper authentication when database is available
    // For now, return a dummy response
    let user_id = Uuid::new_v4();
    let user = crate::models::user::User {
        id: user_id,
        email: req.email.clone(),
        full_name: None,
        role: UserRole::Admin,
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };

    // Generate a dummy token
    let token = format!("dummy_token_{}", user_id);

    Ok(Json(LoginResponse { token, user }))
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
