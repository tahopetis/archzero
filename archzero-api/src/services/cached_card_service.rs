/**
 * Cached Card Service
 *
 * Wrapper around CardService that adds Redis caching layer.
 * Implements cache-aside pattern:
 * 1. Check cache first
 * 2. If miss, query database
 * 3. Store result in cache
 * 4. Invalidate cache on updates
 */

use std::sync::Arc;
use uuid::Uuid;
use crate::services::{CardService, CacheService};
use crate::services::cache::CacheKeys;
use crate::models::card::{Card, CreateCardRequest, UpdateCardRequest, CardSearchParams};
use crate::error::AppError;

pub struct CachedCardService {
    card_service: Arc<CardService>,
    cache_service: Arc<CacheService>,
}

impl CachedCardService {
    pub fn new(card_service: Arc<CardService>, cache_service: Arc<CacheService>) -> Self {
        Self {
            card_service,
            cache_service,
        }
    }

    /// Create a new card (invalidates list caches)
    pub async fn create(&self, req: CreateCardRequest) -> Result<Card, AppError> {
        let result = self.card_service.create(req).await?;

        // Invalidate card list caches
        let _ = self.cache_service.delete_pattern("card:list:*").await;

        Ok(result)
    }

    /// Get a card by ID (cached for 1 hour)
    pub async fn get(&self, id: Uuid) -> Result<Card, AppError> {
        let cache_key = CacheKeys::card_detail(&id.to_string());

        // Try cache first
        if let Ok(Some(cached_card)) = self.cache_service.get::<Card>(&cache_key).await {
            tracing::debug!("Cache HIT for card: {}", id);
            return Ok(cached_card);
        }

        // Cache miss - query database
        tracing::debug!("Cache MISS for card: {}", id);
        let card = self.card_service.get(id).await?;

        // Store in cache (1 hour TTL)
        let _ = self.cache_service.set(&cache_key, &card, 3600).await;

        Ok(card)
    }

    /// List cards with pagination and filters (cached for 15 minutes)
    pub async fn list(&self, params: CardSearchParams) -> Result<(Vec<Card>, i64), AppError> {
        // Create cache key from search params
        let cache_key = self.cache_key_from_params(&params);

        // Try cache first
        if let Ok(Some(cached_result)) = self.cache_service.get::<(Vec<Card>, i64)>(&cache_key).await {
            tracing::debug!("Cache HIT for card list");
            return Ok(cached_result);
        }

        // Cache miss - query database
        tracing::debug!("Cache MISS for card list");
        let result = self.card_service.list(params).await?;

        // Store in cache (15 minutes TTL)
        let _ = self.cache_service.set(&cache_key, &result, 900).await;

        Ok(result)
    }

    /// Update a card (invalidates all caches for this card and lists)
    pub async fn update(&self, id: Uuid, req: UpdateCardRequest) -> Result<Card, AppError> {
        let result = self.card_service.update(id, req).await?;

        // Invalidate caches
        let _ = self.cache_service.invalidate_card(&id.to_string()).await;

        Ok(result)
    }

    /// Delete a card (invalidates all caches)
    pub async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        let result = self.card_service.delete(id).await?;

        // Invalidate caches
        let _ = self.cache_service.invalidate_card(&id.to_string()).await;

        Ok(result)
    }

    /// Generate cache key from search parameters
    fn cache_key_from_params(&self, params: &CardSearchParams) -> String {
        use std::collections::HashMap;

        let mut map = HashMap::new();
        if let Some(page) = params.page {
            map.insert("page", page.to_string());
        }
        if let Some(page_size) = params.page_size {
            map.insert("page_size", page_size.to_string());
        }
        if let Some(ref q) = params.q {
            map.insert("q", q.clone());
        }
        if let Some(ref card_type) = params.card_type {
            if let Ok(type_str) = serde_json::to_string(card_type) {
                map.insert("card_type", type_str);
            }
        }
        if let Some(ref lifecycle_phase) = params.lifecycle_phase {
            if let Ok(phase_str) = serde_json::to_string(lifecycle_phase) {
                map.insert("lifecycle_phase", phase_str);
            }
        }

        // Create deterministic key
        let mut parts = Vec::new();
        for (k, v) in map.iter() {
            parts.push(format!("{}={}", k, v));
        }
        parts.sort();

        CacheKeys::card_list(&parts.join("&"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_key_generation() {
        // Test that cache keys are deterministic
        let params1 = CardSearchParams {
            page: Some(1),
            page_size: Some(20),
            q: Some("test".to_string()),
            card_type: None,
            lifecycle_phase: None,
        };

        let params2 = CardSearchParams {
            page: Some(1),
            page_size: Some(20),
            q: Some("test".to_string()),
            card_type: None,
            lifecycle_phase: None,
        };

        // Same params should generate same key
        let service = create_test_service();
        let key1 = service.cache_key_from_params(&params1);
        let key2 = service.cache_key_from_params(&params2);
        assert_eq!(key1, key2);
    }

    fn create_test_service() -> CachedCardService {
        // This would need mock services in a real test
        unimplemented!()
    }
}
