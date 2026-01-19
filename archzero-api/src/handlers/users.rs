use axum::{
    extract::{Path, State, Extension},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use sqlx::FromRow;

use crate::{
    error::AppError,
    models::{Claims, UserRole},
    state::AppState,
};

// Response model for users
#[derive(Debug, serde::Serialize, FromRow)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub full_name: Option<String>,
    pub role: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

// GET /api/v1/users - List all users
pub async fn get_users(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<UserResponse>>, AppError> {
    // Only admins can list users
    if claims.role != UserRole::Admin {
        return Err(AppError::Auth("Insufficient permissions".to_string()));
    }

    let users = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, full_name, role, created_at, updated_at FROM users ORDER BY created_at DESC"
    )
    .fetch_all(state.auth_service.get_pool())
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?;

    Ok(Json(users))
}

// GET /api/v1/users/:id - Get a specific user
pub async fn get_user(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UserResponse>, AppError> {
    // Only admins can view user details
    if claims.role != UserRole::Admin {
        return Err(AppError::Auth("Insufficient permissions".to_string()));
    }

    let user = sqlx::query_as::<_, UserResponse>(
        "SELECT id, email, full_name, role, created_at, updated_at FROM users WHERE id = $1"
    )
    .bind(id)
    .fetch_optional(state.auth_service.get_pool())
    .await
    .map_err(|e| AppError::Internal(anyhow::anyhow!("Database error: {}", e)))?
    .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

    Ok(Json(user))
}

// POST /api/v1/users - Create a new user (not implemented for now)
pub async fn create_user() -> &'static str {
    "User creation not yet implemented"
}

// PUT /api/v1/users/:id - Update a user (not implemented for now)
pub async fn update_user() -> &'static str {
    "User update not yet implemented"
}

// DELETE /api/v1/users/:id - Delete a user (not implemented for now)
pub async fn delete_user() -> &'static str {
    "User deletion not yet implemented"
}
