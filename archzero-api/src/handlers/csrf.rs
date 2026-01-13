/**
 * CSRF Token Handler
 *
 * Provides endpoints for generating and managing CSRF tokens.
 */

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{state::AppState, Result};
use crate::error::AppError;

#[derive(Debug, Serialize, ToSchema)]
pub struct CsrfTokenResponse {
    pub token: String,
    pub expires_in: u64, // seconds until expiration
}

#[derive(Debug, Deserialize)]
pub struct CsrfValidateRequest {
    pub token: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct CsrfValidateResponse {
    pub valid: bool,
}

/// Generate a new CSRF token
///
/// Returns a new CSRF token that should be included in state-changing requests.
#[utoipa::path(
    post,
    path = "/api/v1/csrf/token",
    responses(
        (status = 200, description = "CSRF token generated successfully", body = CsrfTokenResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "CSRF"
)]
pub async fn generate_csrf_token(
    State(state): State<AppState>,
) -> Result<Json<CsrfTokenResponse>> {
    let token = state.csrf_service.generate_token().await;

    Ok(Json(CsrfTokenResponse {
        token,
        expires_in: 3600, // 1 hour in seconds
    }))
}

/// Validate a CSRF token
///
/// Checks if a CSRF token is valid without consuming it.
#[utoipa::path(
    post,
    path = "/api/v1/csrf/validate",
    request_body = CsrfValidateRequest,
    responses(
        (status = 200, description = "Token validation result", body = CsrfValidateResponse),
        (status = 400, description = "Bad request"),
        (status = 500, description = "Internal server error")
    ),
    tag = "CSRF"
)]
pub async fn validate_csrf_token(
    State(state): State<AppState>,
    Json(req): Json<CsrfValidateRequest>,
) -> Result<Json<CsrfValidateResponse>> {
    let is_valid = state.csrf_service.validate_token(&req.token).await;

    Ok(Json(CsrfValidateResponse { valid: is_valid }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_serialize_token_response() {
        let response = CsrfTokenResponse {
            token: "test-token".to_string(),
            expires_in: 3600,
        };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("test-token"));
        assert!(json.contains("3600"));
    }

    #[test]
    fn test_serialize_validate_response() {
        let response = CsrfValidateResponse { valid: true };

        let json = serde_json::to_string(&response).unwrap();
        assert!(json.contains("true"));
    }
}
