/**
 * CSRF Token Service
 *
 * Provides Cross-Site Request Forgery protection using token-based validation.
 * Tokens are generated using cryptographically secure random bytes and
 * stored with expiration times for validation.
 */

use std::collections::HashMap;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct CsrfToken {
    pub token: String,
    pub expires_at: Instant,
}

pub struct CsrfService {
    tokens: RwLock<HashMap<String, CsrfToken>>,
    default_ttl: Duration,
}

impl CsrfService {
    /// Create a new CSRF service
    pub fn new() -> Self {
        Self {
            tokens: RwLock::new(HashMap::new()),
            default_ttl: Duration::from_secs(3600), // 1 hour default
        }
    }

    /// Create a new CSRF service with custom TTL
    pub fn with_ttl(ttl: Duration) -> Self {
        Self {
            tokens: RwLock::new(HashMap::new()),
            default_ttl: ttl,
        }
    }

    /// Generate a new CSRF token
    pub async fn generate_token(&self) -> String {
        let token = Uuid::new_v4().to_string();
        let csrf_token = CsrfToken {
            token: token.clone(),
            expires_at: Instant::now() + self.default_ttl,
        };

        self.tokens.write().await.insert(token.clone(), csrf_token);
        token
    }

    /// Generate a new CSRF token with custom expiration
    pub async fn generate_token_with_ttl(&self, ttl: Duration) -> String {
        let token = Uuid::new_v4().to_string();
        let csrf_token = CsrfToken {
            token: token.clone(),
            expires_at: Instant::now() + ttl,
        };

        self.tokens.write().await.insert(token.clone(), csrf_token);
        token
    }

    /// Validate a CSRF token
    pub async fn validate_token(&self, token: &str) -> bool {
        let tokens = self.tokens.read().await;

        if let Some(csrf_token) = tokens.get(token) {
            // Check if token has expired
            if csrf_token.expires_at > Instant::now() {
                return true;
            }
        }

        false
    }

    /// Validate and consume a CSRF token (one-time use)
    pub async fn validate_and_consume_token(&self, token: &str) -> bool {
        let tokens = self.tokens.write().await;

        if let Some(csrf_token) = tokens.get(token) {
            // Check if token has expired
            if csrf_token.expires_at > Instant::now() {
                // Remove token after successful validation (one-time use)
                drop(tokens);
                self.tokens.write().await.remove(token);
                return true;
            }
        }

        false
    }

    /// Clean up expired tokens (should be called periodically)
    pub async fn cleanup_expired_tokens(&self) -> usize {
        let mut tokens = self.tokens.write().await;
        let now = Instant::now();

        let before_count = tokens.len();
        tokens.retain(|_, csrf_token| csrf_token.expires_at > now);
        let after_count = tokens.len();

        before_count - after_count
    }

    /// Get the number of active tokens
    pub async fn active_token_count(&self) -> usize {
        self.tokens.read().await.len()
    }
}

impl Default for CsrfService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_generate_and_validate_token() {
        let service = CsrfService::new();
        let token = service.generate_token().await;

        assert!(service.validate_token(&token).await);
    }

    #[tokio::test]
    async fn test_validate_and_consume_token() {
        let service = CsrfService::new();
        let token = service.generate_token().await;

        // First validation should succeed and consume the token
        assert!(service.validate_and_consume_token(&token).await);
        // Second validation should fail
        assert!(!service.validate_and_consume_token(&token).await);
    }

    #[tokio::test]
    async fn test_invalid_token() {
        let service = CsrfService::new();
        assert!(!service.validate_token("invalid-token").await);
    }

    #[tokio::test]
    async fn test_expired_token() {
        let service = CsrfService::with_ttl(Duration::from_millis(100));
        let token = service.generate_token().await;

        // Wait for token to expire
        tokio::time::sleep(Duration::from_millis(150)).await;

        assert!(!service.validate_token(&token).await);
    }

    #[tokio::test]
    async fn test_cleanup_expired_tokens() {
        let service = CsrfService::with_ttl(Duration::from_millis(100));

        // Generate some tokens
        let _token1 = service.generate_token().await;
        let _token2 = service.generate_token().await;

        assert_eq!(service.active_token_count().await, 2);

        // Wait for tokens to expire
        tokio::time::sleep(Duration::from_millis(150)).await;

        // Cleanup expired tokens
        let cleaned = service.cleanup_expired_tokens().await;
        assert_eq!(cleaned, 2);
        assert_eq!(service.active_token_count().await, 0);
    }
}
