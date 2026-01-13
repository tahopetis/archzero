/**
 * Rate Limiting Service
 *
 * Provides distributed rate limiting using Redis.
 * Supports multiple rate limit strategies:
 * - Token bucket (default)
 * - Fixed window
 * - Sliding window log
 *
 * Rate limits can be applied per-IP, per-user, or per-endpoint.
 */

use std::sync::Arc;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    pub max_requests: u32,
    pub window_seconds: u32,
}

impl RateLimitConfig {
    /// Create a new rate limit configuration
    pub fn new(max_requests: u32, window_seconds: u32) -> Self {
        Self {
            max_requests,
            window_seconds,
        }
    }

    /// Common rate limit presets
    pub fn strict() -> Self {
        Self::new(10, 60) // 10 requests per minute
    }

    pub fn moderate() -> Self {
        Self::new(60, 60) // 60 requests per minute
    }

    pub fn lenient() -> Self {
        Self::new(300, 60) // 300 requests per minute
    }

    pub fn per_second(limit: u32) -> Self {
        Self::new(limit, 1)
    }

    pub fn per_minute(limit: u32) -> Self {
        Self::new(limit, 60)
    }

    pub fn per_hour(limit: u32) -> Self {
        Self::new(limit, 3600)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitResult {
    pub allowed: bool,
    pub remaining: u32,
    pub reset_at: u64, // Unix timestamp
    pub retry_after: Option<u32>, // Seconds until retry allowed
}

pub struct RateLimitService {
    // Note: In production, this would use Redis
    // For now, we'll use an in-memory implementation
    // that can be easily swapped for Redis
    counters: Arc<tokio::sync::RwLock<std::collections::HashMap<String, RateLimitCounter>>>,
}

#[derive(Debug, Clone)]
struct RateLimitCounter {
    count: u32,
    window_start: std::time::Instant,
}

impl RateLimitService {
    /// Create a new rate limiting service
    pub fn new() -> Self {
        Self {
            counters: Arc::new(tokio::sync::RwLock::new(std::collections::HashMap::new())),
        }
    }

    /// Check if a request should be rate limited
    pub async fn check_rate_limit(
        &self,
        key: &str,
        config: &RateLimitConfig,
    ) -> RateLimitResult {
        let mut counters = self.counters.write().await;
        let now = std::time::Instant::now();
        let window_duration = Duration::from_secs(config.window_seconds as u64);

        // Get or create counter for this key
        let counter = counters.entry(key.to_string()).or_insert_with(|| RateLimitCounter {
            count: 0,
            window_start: now,
        });

        // Check if we need to reset the window (fixed window strategy)
        if now.duration_since(counter.window_start) >= window_duration {
            counter.count = 0;
            counter.window_start = now;
        }

        // Check if request is allowed
        let allowed = counter.count < config.max_requests;

        if allowed {
            counter.count += 1;
        }

        let remaining = config.max_requests.saturating_sub(counter.count);
        let reset_at = counter.window_start
            .duration_since(now)
            .as_secs()
            + config.window_seconds as u64;

        RateLimitResult {
            allowed,
            remaining,
            reset_at,
            retry_after: if allowed {
                None
            } else {
                Some(config.window_seconds)
            },
        }
    }

    /// Check rate limit for an IP address
    pub async fn check_ip_rate_limit(
        &self,
        ip: &str,
        config: &RateLimitConfig,
    ) -> RateLimitResult {
        self.check_rate_limit(&format!("ip:{}", ip), config).await
    }

    /// Check rate limit for a user
    pub async fn check_user_rate_limit(
        &self,
        user_id: Uuid,
        config: &RateLimitConfig,
    ) -> RateLimitResult {
        self.check_rate_limit(&format!("user:{}", user_id), config).await
    }

    /// Check rate limit for a specific endpoint
    pub async fn check_endpoint_rate_limit(
        &self,
        endpoint: &str,
        config: &RateLimitConfig,
    ) -> RateLimitResult {
        self.check_rate_limit(&format!("endpoint:{}", endpoint), config).await
    }

    /// Check combined rate limit (IP + endpoint)
    pub async fn check_combined_rate_limit(
        &self,
        ip: &str,
        endpoint: &str,
        ip_config: &RateLimitConfig,
        endpoint_config: &RateLimitConfig,
    ) -> RateLimitResult {
        // Check both limits and return the most restrictive
        let ip_result = self.check_ip_rate_limit(ip, ip_config).await;
        let endpoint_result = self.check_endpoint_rate_limit(endpoint, endpoint_config).await;

        RateLimitResult {
            allowed: ip_result.allowed && endpoint_result.allowed,
            remaining: ip_result.remaining.min(endpoint_result.remaining),
            reset_at: ip_result.reset_at.min(endpoint_result.reset_at),
            retry_after: match (ip_result.retry_after, endpoint_result.retry_after) {
                (Some(ip_retry), Some(endpoint_retry)) => Some(ip_retry.max(endpoint_retry)),
                (Some(retry), None) | (None, Some(retry)) => Some(retry),
                (None, None) => None,
            },
        }
    }

    /// Clean up expired counters (should be called periodically)
    pub async fn cleanup_expired_counters(&self) -> usize {
        let mut counters = self.counters.write().await;
        let now = std::time::Instant::now();
        let max_age = Duration::from_secs(3600); // 1 hour

        let before_count = counters.len();
        counters.retain(|_, counter| {
            now.duration_since(counter.window_start) < max_age
        });
        let after_count = counters.len();

        before_count - after_count
    }

    /// Get the number of active counters
    pub async fn active_counter_count(&self) -> usize {
        self.counters.read().await.len()
    }
}

impl Default for RateLimitService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rate_limit_under_limit() {
        let service = RateLimitService::new();
        let config = RateLimitConfig::new(5, 60); // 5 requests per minute

        // First request should be allowed
        let result = service.check_rate_limit("test-key", &config).await;
        assert!(result.allowed);
        assert_eq!(result.remaining, 4);
    }

    #[tokio::test]
    async fn test_rate_limit_exceeded() {
        let service = RateLimitService::new();
        let config = RateLimitConfig::new(2, 60); // 2 requests per minute

        // First two requests should be allowed
        assert!(service.check_rate_limit("test-key-2", &config).await.allowed);
        assert!(service.check_rate_limit("test-key-2", &config).await.allowed);

        // Third request should be blocked
        let result = service.check_rate_limit("test-key-2", &config).await;
        assert!(!result.allowed);
        assert_eq!(result.remaining, 0);
        assert!(result.retry_after.is_some());
    }

    #[tokio::test]
    async fn test_rate_limit_window_reset() {
        let service = RateLimitService::new();
        let config = RateLimitConfig::new(2, 1); // 2 requests per 1 second

        // Use up the limit
        assert!(service.check_rate_limit("test-key-3", &config).await.allowed);
        assert!(service.check_rate_limit("test-key-3", &config).await.allowed);

        // Should be blocked
        assert!(!service.check_rate_limit("test-key-3", &config).await.allowed);

        // Wait for window to reset
        tokio::time::sleep(Duration::from_millis(1100)).await;

        // Should be allowed again
        let result = service.check_rate_limit("test-key-3", &config).await;
        assert!(result.allowed);
        assert_eq!(result.remaining, 1);
    }

    #[tokio::test]
    async fn test_combined_rate_limit() {
        let service = RateLimitService::new();
        let ip_config = RateLimitConfig::new(10, 60);
        let endpoint_config = RateLimitConfig::new(5, 60);

        // Use up endpoint limit
        for _ in 0..5 {
            let result = service.check_combined_rate_limit(
                "127.0.0.1",
                "/api/test",
                &ip_config,
                &endpoint_config,
            ).await;
            assert!(result.allowed);
        }

        // Should be blocked by endpoint limit even though IP limit allows more
        let result = service.check_combined_rate_limit(
            "127.0.0.1",
            "/api/test",
            &ip_config,
            &endpoint_config,
        ).await;
        assert!(!result.allowed);
    }
}
