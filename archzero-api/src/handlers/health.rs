use axum::{Json, response::IntoResponse};
use serde_json::json;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "archzero-api",
        "version": "0.1.0"
    }))
}
