/**
 * Rate Limiting Middleware
 *
 * Applies rate limiting to incoming requests based on IP address and endpoint.
 * Uses the RateLimitService to check and enforce rate limits.
 *
 * NOTE: This middleware is disabled by default to prevent blocking development.
 * To enable, uncomment the middleware layer in main.rs.
 */

use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};

use crate::state::AppState;
use crate::services::rate_limit::{RateLimitConfig, RateLimitResult};
use crate::error::AppError;

/// Default rate limit configuration (adjust based on your needs)
const DEFAULT_RATE_LIMIT: RateLimitConfig = RateLimitConfig {
    max_requests: 100,
    window_seconds: 60,
};

/// Strict rate limit for sensitive endpoints (e.g., auth, critical operations)
const STRICT_RATE_LIMIT: RateLimitConfig = RateLimitConfig {
    max_requests: 10,
    window_seconds: 60,
};

/// Extract IP address from request headers
fn extract_client_ip(headers: &HeaderMap) -> Option<String> {
    // Try common proxy headers first
    if let Some(forwarded_for) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            // X-Forwarded-For can contain multiple IPs, take the first one
            if let Some(first_ip) = forwarded_str.split(',').next() {
                return Some(first_ip.trim().to_string());
            }
        }
    }

    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(ip_str) = real_ip.to_str() {
            return Some(ip_str.to_string());
        }
    }

    if let Some(cf_connecting_ip) = headers.get("cf-connecting-ip") {
        if let Ok(ip_str) = cf_connecting_ip.to_str() {
            return Some(ip_str.to_string());
        }
    }

    None
}

/// Rate limiting middleware
///
/// Checks rate limits based on client IP and request endpoint.
/// Returns 429 Too Many Requests if limit is exceeded.
pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Result<Response, AppError> {
    // Extract client IP
    let headers = req.headers();
    let client_ip = extract_client_ip(headers).unwrap_or_else(|| "unknown".to_string());

    // Get the request path
    let path = req.uri().path();

    // Determine appropriate rate limit based on endpoint
    let ip_config = if path.contains("/auth/") || path.contains("/csrf/") {
        // Stricter limits for auth and CSRF endpoints
        STRICT_RATE_LIMIT
    } else {
        DEFAULT_RATE_LIMIT
    };

    let endpoint_config = DEFAULT_RATE_LIMIT;

    // Check combined rate limit (IP + endpoint)
    let result = state
        .rate_limit_service
        .check_combined_rate_limit(&client_ip, path, &ip_config, &endpoint_config)
        .await;

    if !result.allowed {
        // Rate limit exceeded - return 429
        return Err(AppError::RateLimitExceeded {
            retry_after: result.retry_after,
        });
    }

    // Add rate limit info to response headers
    let mut response = next.run(req).await;

    let headers = response.headers_mut();
    headers.insert("X-RateLimit-Limit", ip_config.max_requests.to_string().parse().unwrap());
    headers.insert("X-RateLimit-Remaining", result.remaining.to_string().parse().unwrap());
    headers.insert("X-RateLimit-Reset", result.reset_at.to_string().parse().unwrap());

    if let Some(retry_after) = result.retry_after {
        headers.insert("Retry-After", retry_after.to_string().parse().unwrap());
    }

    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    #[test]
    fn test_extract_client_ip_from_x_forwarded_for() {
        let mut headers = HeaderMap::new();
        headers.insert("x-forwarded-for", HeaderValue::from_static("203.0.113.195, 70.41.3.18"));

        let ip = extract_client_ip(&headers);
        assert_eq!(ip, Some("203.0.113.195".to_string()));
    }

    #[test]
    fn test_extract_client_ip_from_x_real_ip() {
        let mut headers = HeaderMap::new();
        headers.insert("x-real-ip", HeaderValue::from_static("198.51.100.42"));

        let ip = extract_client_ip(&headers);
        assert_eq!(ip, Some("198.51.100.42".to_string()));
    }

    #[test]
    fn test_extract_client_ip_from_cf_connecting_ip() {
        let mut headers = HeaderMap::new();
        headers.insert("cf-connecting-ip", HeaderValue::from_static("192.0.2.1"));

        let ip = extract_client_ip(&headers);
        assert_eq!(ip, Some("192.0.2.1".to_string()));
    }

    #[test]
    fn test_extract_client_ip_unknown() {
        let headers = HeaderMap::new();

        let ip = extract_client_ip(&headers);
        assert_eq!(ip, Some("unknown".to_string()));
    }
}
