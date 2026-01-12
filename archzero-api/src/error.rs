use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

pub type Result<T> = std::result::Result<T, AppError>;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Neo4j error: {0}")]
    Neo4j(String),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AppError::Database(e) => {
                tracing::error!("Database error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Database error".to_string())
            }
            AppError::Neo4j(msg) => {
                tracing::error!("Neo4j error: {}", msg);
                (StatusCode::INTERNAL_SERVER_ERROR, "Graph database error".to_string())
            }
            AppError::Redis(e) => {
                tracing::error!("Redis error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Cache error".to_string())
            }
            AppError::Auth(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::Jwt(e) => {
                tracing::error!("JWT error: {:?}", e);
                (StatusCode::UNAUTHORIZED, "Invalid token".to_string())
            }
            AppError::Validation(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Internal(e) => {
                tracing::error!("Internal error: {:?}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error".to_string())
            }
        };

        let body = json!({
            "error": error_message,
        });

        (status, Json(body)).into_response()
    }
}
