use axum::{
    extract::Request,
    http::header::HeaderValue,
    middleware::Next,
    response::Response,
};

/// Security headers middleware
///
/// Adds comprehensive security headers to all responses:
/// - Strict-Transport-Security (HSTS): Enforces HTTPS connections
/// - X-Frame-Options: Prevents clickjacking attacks
/// - X-Content-Type-Options: Prevents MIME-sniffing
/// - Content-Security-Policy (CSP): Controls resource sources
/// - X-XSS-Protection: Enables XSS filtering
/// - Referrer-Policy: Controls referrer information
pub async fn security_headers(req: Request, next: Next) -> Response {
    // Check if request is for a static asset before moving req
    let is_static = is_static_asset(&req);

    let mut response = next.run(req).await;

    let headers = response.headers_mut();

    // Strict-Transport-Security (HSTS)
    // Forces HTTPS for 1 year including subdomains
    headers.insert(
        "Strict-Transport-Security",
        HeaderValue::from_static("max-age=31536000; includeSubDomains; preload"),
    );

    // X-Frame-Options
    // Prevents clickjacking by blocking iframe embedding
    headers.insert(
        "X-Frame-Options",
        HeaderValue::from_static("DENY"),
    );

    // X-Content-Type-Options
    // Prevents MIME-sniffing
    headers.insert(
        "X-Content-Type-Options",
        HeaderValue::from_static("nosniff"),
    );

    // Content-Security-Policy (CSP)
    // Restricts resource sources to prevent XSS
    // Note: In production, customize based on your actual domains
    headers.insert(
        "Content-Security-Policy",
        HeaderValue::from_static(
            "default-src 'self'; \
             script-src 'self' 'unsafe-inline' 'unsafe-eval'; \
             style-src 'self' 'unsafe-inline'; \
             img-src 'self' data: https:; \
             font-src 'self' data:; \
             connect-src 'self'; \
             frame-ancestors 'none'; \
             base-uri 'self'; \
             form-action 'self';"
        ),
    );

    // X-XSS-Protection
    // Enables browser XSS filtering (legacy, but still useful)
    headers.insert(
        "X-XSS-Protection",
        HeaderValue::from_static("1; mode=block"),
    );

    // Referrer-Policy
    // Controls how much referrer information is sent
    headers.insert(
        "Referrer-Policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );

    // Permissions-Policy
    // Controls browser features access
    headers.insert(
        "Permissions-Policy",
        HeaderValue::from_static(
            "geolocation=(), \
             microphone=(), \
             camera=(), \
             payment=(), \
             usb=(), \
             magnetometer=(), \
             gyroscope=(), \
             accelerometer=()"
        ),
    );

    // Cross-Origin-Opener-Policy
    // Helps process isolation
    headers.insert(
        "Cross-Origin-Opener-Policy",
        HeaderValue::from_static("same-origin"),
    );

    // Cross-Origin-Resource-Policy
    // Prevents cross-origin resource loading
    headers.insert(
        "Cross-Origin-Resource-Policy",
        HeaderValue::from_static("same-origin"),
    );

    // Cache-Control for API responses
    // Prevents caching of sensitive API data
    if !is_static {
        headers.insert(
            "Cache-Control",
            HeaderValue::from_static("no-store, no-cache, must-revalidate, private"),
        );
        headers.insert("Pragma", HeaderValue::from_static("no-cache"));
    }

    // Remove server information
    headers.remove("server");

    response
}

/// Check if request is for a static asset
fn is_static_asset(req: &Request) -> bool {
    let uri = req.uri().path();
    uri.contains("/static/") || uri.contains("/api-docs/")
}

/// Security logging middleware
///
/// Logs security-relevant information for audit trails
pub async fn security_logging(
    req: Request,
    next: Next,
) -> Response {
    let method = req.method().clone();
    let uri = req.uri().clone();
    let user_agent = req
        .headers()
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();

    // Get client IP from headers (accounting for proxies)
    let client_ip = req
        .headers()
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .or_else(|| req.headers().get("x-real-ip").and_then(|v| v.to_str().ok()))
        .unwrap_or("unknown")
        .to_string();

    // Log the request
    tracing::info!(
        method = %method,
        uri = %uri,
        client_ip = %client_ip,
        user_agent = %user_agent,
        "API request"
    );

    let response = next.run(req).await;

    // Log response status
    let status = response.status();
    if status.is_client_error() || status.is_server_error() {
        tracing::warn!(
            method = %method,
            uri = %uri,
            status = %status,
            client_ip = %client_ip,
            "API request error"
        );
    }

    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::StatusCode,
        routing::get,
        Router,
    };
    use tower::ServiceExt;

    #[tokio::test]
    async fn test_security_headers() {
        async fn handler() -> &'static str {
            "OK"
        }

        let app = Router::new()
            .route("/test", get(handler))
            .layer(axum::middleware::from_fn(security_headers));

        let response = app
            .oneshot(
                Request::builder()
                    .uri("/test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);

        let headers = response.headers();

        // Verify security headers are present
        assert!(headers.contains_key("Strict-Transport-Security"));
        assert!(headers.contains_key("X-Frame-Options"));
        assert!(headers.contains_key("X-Content-Type-Options"));
        assert!(headers.contains_key("Content-Security-Policy"));
        assert!(headers.contains_key("X-XSS-Protection"));
        assert!(headers.contains_key("Referrer-Policy"));

        // Verify header values
        assert_eq!(
            headers.get("X-Frame-Options").unwrap(),
            "DENY"
        );
        assert_eq!(
            headers.get("X-Content-Type-Options").unwrap(),
            "nosniff"
        );
    }
}
