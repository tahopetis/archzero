/**
 * Cache Monitoring Handler
 *
 * Provides endpoints for monitoring cache health and statistics.
 */

use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

use crate::{state::AppState, Result, error::AppError};
use crate::services::cache::CacheStats;

#[derive(Debug, Serialize, ToSchema)]
pub struct CacheHealthResponse {
    pub status: String,
    pub size: u64,
    pub memory_bytes: u64,
    pub memory_human: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct CacheStatsResponse {
    pub hits: u64,
    pub misses: u64,
    pub sets: u64,
    pub deletes: u64,
    pub errors: u64,
    pub hit_rate: f64,
    pub total_requests: u64,
}

/// Get cache health status
///
/// Returns the current health and size of the Redis cache.
#[utoipa::path(
    get,
    path = "/api/v1/cache/health",
    responses(
        (status = 200, description = "Cache health status", body = CacheHealthResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cache"
)]
pub async fn get_cache_health(
    State(state): State<AppState>,
) -> Result<Json<CacheHealthResponse>> {
    let is_healthy = state.cache_service.health_check().await;

    let size = state.cache_service.size().await.unwrap_or(0);
    let memory_bytes = state.cache_service.memory_usage().await.unwrap_or(0);

    Ok(Json(CacheHealthResponse {
        status: if is_healthy.is_ok() { "healthy".to_string() } else { "unhealthy".to_string() },
        size,
        memory_bytes,
        memory_human: format_bytes(memory_bytes),
    }))
}

/// Get cache statistics
///
/// Returns cache performance statistics including hit rate.
#[utoipa::path(
    get,
    path = "/api/v1/cache/stats",
    responses(
        (status = 200, description = "Cache statistics", body = CacheStatsResponse),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cache"
)]
pub async fn get_cache_stats(
    State(state): State<AppState>,
) -> Result<Json<CacheStatsResponse>> {
    let stats = state.cache_service.stats().await;
    let total_requests = stats.hits + stats.misses;

    Ok(Json(CacheStatsResponse {
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        errors: stats.errors,
        hit_rate: stats.hit_rate(),
        total_requests,
    }))
}

/// Reset cache statistics
///
/// Resets all cache statistics counters to zero.
#[utoipa::path(
    post,
    path = "/api/v1/cache/stats/reset",
    responses(
        (status = 200, description = "Statistics reset successfully"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cache"
)]
pub async fn reset_cache_stats(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>> {
    state.cache_service.reset_stats().await;
    Ok(Json(serde_json::json!({
        "message": "Cache statistics reset successfully"
    })))
}

/// Flush all cache entries
///
/// **WARNING**: This clears all cached data. Use with caution!
#[utoipa::path(
    post,
    path = "/api/v1/cache/flush",
    responses(
        (status = 200, description = "Cache flushed successfully"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cache"
)]
pub async fn flush_cache(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>> {
    state.cache_service.flush_all().await?;
    Ok(Json(serde_json::json!({
        "message": "Cache flushed successfully"
    })))
}

/// Warm the cache
///
/// Preloads frequently accessed data into the cache.
#[utoipa::path(
    post,
    path = "/api/v1/cache/warm",
    responses(
        (status = 200, description = "Cache warmed successfully"),
        (status = 500, description = "Internal server error")
    ),
    tag = "Cache"
)]
pub async fn warm_cache(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>> {
    state.cache_service.warm_cache().await
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Cache warming failed: {}", e)))?;
    Ok(Json(serde_json::json!({
        "message": "Cache warming completed"
    })))
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} bytes", bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(500), "500 bytes");
        assert_eq!(format_bytes(2048), "2.00 KB");
        assert_eq!(format_bytes(2_097_152), "2.00 MB");
        assert_eq!(format_bytes(2_147_483_648), "2.00 GB");
    }
}
