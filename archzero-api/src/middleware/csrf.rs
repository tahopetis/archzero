/**
 * CSRF Protection Middleware
 *
 * Validates CSRF tokens for state-changing operations (POST, PUT, DELETE, PATCH).
 * Safe methods (GET, HEAD, OPTIONS, TRACE) are exempt from CSRF validation.
 *
 * NOTE: The global CSRF middleware is disabled by default to prevent breaking
 * existing API clients. CSRF tokens can be obtained from /api/v1/csrf/token and
 * should be included in the X-CSRF-Token header for state-changing operations.
 */

use axum::http::{HeaderMap, Method};

/// CSRF header name for token validation
pub const CSRF_HEADER_NAME: &str = "X-CSRF-Token";

/// CSRF form field name
pub const CSRF_FIELD_NAME: &str = "csrf_token";

/// Check if HTTP method is safe (doesn't modify state)
pub fn is_safe_method(method: &Method) -> bool {
    matches!(
        *method,
        Method::GET | Method::HEAD | Method::OPTIONS | Method::TRACE
    )
}

/// Extract CSRF token from request headers
pub fn extract_csrf_token(headers: &HeaderMap) -> Option<String> {
    // Try X-CSRF-Token header first
    if let Some(token) = headers.get(CSRF_HEADER_NAME) {
        if let Ok(token_str) = token.to_str() {
            return Some(token_str.to_string());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_safe_method() {
        assert!(is_safe_method(&Method::GET));
        assert!(is_safe_method(&Method::HEAD));
        assert!(is_safe_method(&Method::OPTIONS));
        assert!(is_safe_method(&Method::TRACE));
        assert!(!is_safe_method(&Method::POST));
        assert!(!is_safe_method(&Method::PUT));
        assert!(!is_safe_method(&Method::DELETE));
        assert!(!is_safe_method(&Method::PATCH));
    }
}
