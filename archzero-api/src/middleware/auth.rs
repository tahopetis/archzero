use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
    Extension,
};
use crate::state::AppState;
use crate::models::user::{Claims, UserRole};

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    let token = auth_header
        .and_then(|h| h.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = state
        .auth_service
        .verify_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions
    request.extensions_mut().insert(claims.clone());

    Ok(next.run(request).await)
}

/// ARB Role-Based Access Control Middleware
/// Only allows users with Admin, ArbChair, or ArbMember roles
pub async fn require_arb_role(
    Extension(claims): Extension<Claims>,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    match claims.role {
        UserRole::Admin | UserRole::ArbChair | UserRole::ArbMember => {
            Ok(next.run(request).await)
        }
        _ => Err(StatusCode::FORBIDDEN),
    }
}
