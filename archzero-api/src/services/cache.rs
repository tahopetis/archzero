/**
 * Redis Caching Service
 *
 * Provides distributed caching using Redis.
 * Implements cache-aside pattern with TTL policies.
 * Supports cache invalidation, warming, and monitoring.
 *
 * TTL Policies:
 * - Card lists: 15 minutes
 * - Individual cards: 1 hour
 * - Graph traversals: 30 minutes
 * - Search results: 10 minutes
 */

use std::time::Duration;
use redis::{AsyncCommands, Client};
use serde::{Deserialize, Serialize};
use tokio::time::timeout;
use tracing::{debug, error, info, warn};

/// Cache TTL policies (in seconds)
#[derive(Debug, Clone, Copy)]
pub struct CacheTtl {
    pub card_list: u64,
    pub card_detail: u64,
    pub graph_traversal: u64,
    pub search_results: u64,
    pub relationship_list: u64,
}

impl Default for CacheTtl {
    fn default() -> Self {
        Self {
            card_list: 900,        // 15 minutes
            card_detail: 3600,     // 1 hour
            graph_traversal: 1800, // 30 minutes
            search_results: 600,   // 10 minutes
            relationship_list: 900, // 15 minutes
        }
    }
}

/// Cache key prefix patterns
pub struct CacheKeys;

impl CacheKeys {
    pub const CARD_LIST: &'static str = "card:list";
    pub const CARD_DETAIL: &'static str = "card:detail";
    pub const GRAPH_TRAVERSAL: &'static str = "graph:traversal";
    pub const SEARCH_RESULTS: &'static str = "search:results";
    pub const RELATIONSHIP_LIST: &'static str = "relationship:list";

    pub fn card_list(params: &str) -> String {
        format!("{}:{}", Self::CARD_LIST, params)
    }

    pub fn card_detail(id: &str) -> String {
        format!("{}:{}", Self::CARD_DETAIL, id)
    }

    pub fn graph_traversal(id: &str, direction: &str) -> String {
        format!("{}:{}:{}", Self::GRAPH_TRAVERSAL, id, direction)
    }

    pub fn search_results(query: &str) -> String {
        format!("{}:{}", Self::SEARCH_RESULTS, query)
    }

    pub fn relationship_list(params: &str) -> String {
        format!("{}:{}", Self::RELATIONSHIP_LIST, params)
    }
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub sets: u64,
    pub deletes: u64,
    pub errors: u64,
}

impl Default for CacheStats {
    fn default() -> Self {
        Self {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
        }
    }
}

impl CacheStats {
    pub fn hit_rate(&self) -> f64 {
        let total = self.hits + self.misses;
        if total == 0 {
            0.0
        } else {
            (self.hits as f64) / (total as f64)
        }
    }
}

/// Redis Cache Service
pub struct CacheService {
    client: Client,
    ttl: CacheTtl,
    stats: std::sync::Arc<tokio::sync::RwLock<CacheStats>>,
}

impl CacheService {
    /// Create a new cache service
    pub fn new(redis_url: &str) -> Result<Self, redis::RedisError> {
        let client = Client::open(redis_url)?;

        info!("Cache service created for Redis: {}", redis_url);

        Ok(Self {
            client,
            ttl: CacheTtl::default(),
            stats: std::sync::Arc::new(tokio::sync::RwLock::new(CacheStats::default())),
        })
    }

    /// Set custom TTL policies
    pub fn with_ttl(mut self, ttl: CacheTtl) -> Self {
        self.ttl = ttl;
        self
    }

    /// Get a cached value
    pub async fn get<T>(&self, key: &str) -> Result<Option<T>, redis::RedisError>
    where
        T: for<'de> Deserialize<'de>,
    {
        let mut conn = self.client.get_async_connection().await?;
        let value: Option<String> = conn.get(key).await?;

        match value {
            Some(v) => {
                let deserialized: T = serde_json::from_str(&v)
                    .map_err(|e| redis::RedisError::from((redis::ErrorKind::TypeError, "Deserialization failed", e.to_string())))?;
                debug!("Cache HIT: {}", key);
                self.stats.write().await.hits += 1;
                Ok(Some(deserialized))
            }
            None => {
                debug!("Cache MISS: {}", key);
                self.stats.write().await.misses += 1;
                Ok(None)
            }
        }
    }

    /// Set a cached value with TTL
    pub async fn set<T>(&self, key: &str, value: &T, ttl_seconds: u64) -> Result<(), redis::RedisError>
    where
        T: Serialize,
    {
        let mut conn = self.client.get_async_connection().await?;
        let serialized = serde_json::to_string(value)
            .map_err(|_e| redis::RedisError::from((redis::ErrorKind::TypeError, "Serialization failed")))?;

        conn.set_ex::<_, _, ()>(key, serialized, ttl_seconds).await?;
        debug!("Cache SET: {} (TTL: {}s)", key, ttl_seconds);
        self.stats.write().await.sets += 1;
        Ok(())
    }

    /// Delete a cached value
    pub async fn delete(&self, key: &str) -> Result<bool, redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let deleted: bool = conn.del(key).await?;
        debug!("Cache DELETE: {}", key);
        self.stats.write().await.deletes += 1;
        Ok(deleted)
    }

    /// Delete multiple keys matching a pattern
    pub async fn delete_pattern(&self, pattern: &str) -> Result<u64, redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;

        // Get all keys matching pattern
        let keys: Vec<String> = conn.keys(pattern).await?;

        if keys.is_empty() {
            return Ok(0);
        }

        // Delete all matching keys
        let deleted: u64 = conn.del(keys).await?;
        info!("Cache DELETE_PATTERN: {} (deleted: {})", pattern, deleted);
        self.stats.write().await.deletes += deleted;
        Ok(deleted)
    }

    /// Invalidate card-related cache entries
    pub async fn invalidate_card(&self, card_id: &str) -> Result<(), redis::RedisError> {
        // Delete specific card detail
        let detail_key = CacheKeys::card_detail(card_id);
        self.delete(&detail_key).await?;

        // Invalidate all card lists (broad invalidation)
        self.delete_pattern(&format!("{}:*", CacheKeys::CARD_LIST)).await?;

        // Invalidate related graph traversals
        self.delete_pattern(&format!("{}:{}:*", CacheKeys::GRAPH_TRAVERSAL, card_id)).await?;

        info!("Cache invalidated for card: {}", card_id);
        Ok(())
    }

    /// Invalidate relationship-related cache entries
    pub async fn invalidate_relationship(&self, relationship_id: &str) -> Result<(), redis::RedisError> {
        // Delete specific relationship
        self.delete(relationship_id).await?;

        // Invalidate all relationship lists
        self.delete_pattern(&format!("{}:*", CacheKeys::RELATIONSHIP_LIST)).await?;

        info!("Cache invalidated for relationship: {}", relationship_id);
        Ok(())
    }

    /// Get cache statistics
    pub async fn stats(&self) -> CacheStats {
        self.stats.read().await.clone()
    }

    /// Reset cache statistics
    pub async fn reset_stats(&self) {
        *self.stats.write().await = CacheStats::default();
        info!("Cache statistics reset");
    }

    /// Clear all cache (use with caution!)
    pub async fn flush_all(&self) -> Result<(), redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        redis::cmd("FLUSHDB").query_async::<_, ()>(&mut conn).await?;
        warn!("Cache FLUSH_ALL executed");
        Ok(())
    }

    /// Health check
    pub async fn health_check(&self) -> Result<bool, redis::RedisError> {
        // Simple health check - try to get a connection
        match self.client.get_multiplexed_async_connection().await {
            Ok(_) => Ok(true),
            Err(e) => Err(e),
        }
    }

    /// Cache warming - preload frequently accessed data
    pub async fn warm_cache(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("Starting cache warming...");

        // Note: This is a placeholder for future implementation
        // To implement actual cache warming:
        //
        // 1. Fetch most frequently accessed cards (from analytics or recent access logs)
        // 2. Cache common graph traversals (upstream/downstream for critical cards)
        // 3. Pre-compute expensive queries (topology metrics, critical paths)
        // 4. Cache search results for common terms
        //
        // Example implementation:
        // let popular_cards = card_service.get_most_accessed(100).await?;
        // for card in popular_cards {
        //     let key = CacheKeys::card_detail(&card.id.to_string());
        //     self.set(&key, &card, 3600).await?;
        // }
        //
        // let common_queries = vec!["microservice", "api", "database"];
        // for query in common_queries {
        //     let results = card_service.search(query, 20).await?;
        //     let key = CacheKeys::search_results(query);
        //     self.set(&key, &results, 600).await?;
        // }

        info!("Cache warming complete (no data to warm yet - implementation placeholder)");
        Ok(())
    }

    /// Get cache size (number of keys)
    pub async fn size(&self) -> Result<u64, redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let size: u64 = redis::cmd("DBSIZE").query_async(&mut conn).await?;
        Ok(size)
    }

    /// Get memory usage (in bytes)
    pub async fn memory_usage(&self) -> Result<u64, redis::RedisError> {
        let mut conn = self.client.get_async_connection().await?;
        let info: String = redis::cmd("INFO")
            .arg("memory")
            .query_async(&mut conn)
            .await?;

        // Parse INFO output to get used_memory
        for line in info.lines() {
            if line.starts_with("used_memory:") {
                let value = line.split(':').nth(1).unwrap_or("0");
                return Ok(value.trim().parse().unwrap_or(0));
            }
        }

        Ok(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        assert_eq!(CacheKeys::card_list("all"), "card:list:all");
        assert_eq!(CacheKeys::card_detail("123"), "card:detail:123");
        assert_eq!(CacheKeys::graph_traversal("123", "upstream"), "graph:traversal:123:upstream");
        assert_eq!(CacheKeys::search_results("test"), "search:results:test");
    }

    #[test]
    fn test_cache_stats_hit_rate() {
        let stats = CacheStats {
            hits: 80,
            misses: 20,
            sets: 50,
            deletes: 5,
            errors: 0,
        };

        assert_eq!(stats.hit_rate(), 0.8);
    }

    #[test]
    fn test_cache_ttl_default() {
        let ttl = CacheTtl::default();
        assert_eq!(ttl.card_list, 900);
        assert_eq!(ttl.card_detail, 3600);
        assert_eq!(ttl.graph_traversal, 1800);
        assert_eq!(ttl.search_results, 600);
    }
}
