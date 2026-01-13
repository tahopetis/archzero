use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use crate::services::AuthService;

pub async fn auth_middleware(
    State(auth_service): State<AuthService>,
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

    let claims = auth_service
        .verify_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    // Add claims to request extensions
    request.extensions_mut().insert(claims);

    Ok(next.run(request).await)
}

// Note: require_role would be implemented as a separate middleware layer
// For now, we'll handle role checks directly in handlers
