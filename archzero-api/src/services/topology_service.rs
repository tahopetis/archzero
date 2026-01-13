use anyhow::Result;
use std::sync::Arc;
use uuid::Uuid;

use crate::models::bia::{TopologyMetrics, CriticalityLevel, EnhancedCriticality};
use crate::services::Neo4jService;

pub struct TopologyService {
    neo4j: Arc<Neo4jService>,
}

impl TopologyService {
    pub fn new(neo4j: Arc<Neo4jService>) -> Self {
        Self { neo4j }
    }

    /// Calculate topology metrics for a card (fan-in, fan-out)
    pub async fn calculate_topology_metrics(&self, card_id: Uuid) -> Result<TopologyMetrics> {
        let card_id_str = card_id.to_string();

        // Calculate fan-in (number of cards that depend on this card)
        let fan_in = self.count_fan_in(&card_id_str).await?;

        // Calculate fan-out (number of cards this card depends on)
        let fan_out = self.count_fan_out(&card_id_str).await?;

        let total_connections = fan_in + fan_out;

        // Determine if criticality should be boosted based on fan-in
        let criticality_boost = if fan_in >= 50 {
            Some(CriticalityLevel::Critical)
        } else if fan_in >= 20 {
            Some(CriticalityLevel::High)
        } else if fan_in >= 10 {
            Some(CriticalityLevel::Medium)
        } else {
            None
        };

        Ok(TopologyMetrics {
            card_id,
            fan_in,
            fan_out,
            total_connections,
            criticality_boost,
        })
    }

    /// Count fan-in (incoming dependencies)
    async fn count_fan_in(&self, card_id: &str) -> Result<u32> {
        let query = "
            MATCH (c:Card {id: $card_id})<-[:RELATED_TO]-(other:Card)
            RETURN count(other) as fan_in
        ";

        let mut result = self.neo4j
            .execute_query(neo4rs::query(query).param("card_id", card_id))
            .await?;

        if let Ok(Some(row)) = result.next().await {
            let count: i64 = row.get("fan_in").unwrap_or(0);
            Ok(count as u32)
        } else {
            Ok(0)
        }
    }

    /// Count fan-out (outgoing dependencies)
    async fn count_fan_out(&self, card_id: &str) -> Result<u32> {
        let query = "
            MATCH (c:Card {id: $card_id})-[:RELATED_TO]->(other:Card)
            RETURN count(other) as fan_out
        ";

        let mut result = self.neo4j
            .execute_query(neo4rs::query(query).param("card_id", card_id))
            .await?;

        if let Ok(Some(row)) = result.next().await {
            let count: i64 = row.get("fan_out").unwrap_or(0);
            Ok(count as u32)
        } else {
            Ok(0)
        }
    }

    /// Get all dependent cards (cards that depend on this card)
    pub async fn get_dependents(&self, card_id: Uuid) -> Result<Vec<Uuid>> {
        let card_id_str = card_id.to_string();
        let query = "
            MATCH (c:Card {id: $card_id})<-[:RELATED_TO]-(other:Card)
            RETURN other.id as id
        ";

        let mut result = self.neo4j
            .execute_query(neo4rs::query(query).param("card_id", card_id_str))
            .await?;

        let mut dependents = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            if let Some(id_str) = row.get::<String>("id") {
                if let Ok(id) = Uuid::parse_str(&id_str) {
                    dependents.push(id);
                }
            }
        }

        Ok(dependents)
    }

    /// Get all dependencies (cards this card depends on)
    pub async fn get_dependencies(&self, card_id: Uuid) -> Result<Vec<Uuid>> {
        let card_id_str = card_id.to_string();
        let query = "
            MATCH (c:Card {id: $card_id})-[:RELATED_TO]->(other:Card)
            RETURN other.id as id
        ";

        let mut result = self.neo4j
            .execute_query(neo4rs::query(query).param("card_id", card_id_str))
            .await?;

        let mut dependencies = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            if let Some(id_str) = row.get::<String>("id") {
                if let Ok(id) = Uuid::parse_str(&id_str) {
                    dependencies.push(id);
                }
            }
        }

        Ok(dependencies)
    }

    /// Calculate enhanced criticality combining BIA score and topology
    pub fn calculate_enhanced_criticality(
        &self,
        bia_score: f64,
        bia_level: CriticalityLevel,
        topology_metrics: TopologyMetrics,
    ) -> Result<EnhancedCriticality> {
        let (final_level, escalation_reason) = if let Some(boost) = &topology_metrics.criticality_boost {
            // Topology boost overrides BIA level if boost is higher
            if Self::compare_criticality(boost, &bia_level) > 0 {
                let reason = format!(
                    "Escalated from {:?} to {:?} based on {} incoming dependencies",
                    bia_level, boost, topology_metrics.fan_in
                );
                (boost.clone(), Some(reason))
            } else {
                (bia_level.clone(), None)
            }
        } else {
            (bia_level.clone(), None)
        };

        Ok(EnhancedCriticality {
            bia_score,
            bia_level,
            topology_metrics,
            final_level,
            escalation_reason,
        })
    }

    /// Compare two criticality levels, returns >0 if a is higher, 0 if equal, <0 if b is higher
    fn compare_criticality(a: &CriticalityLevel, b: &CriticalityLevel) -> i32 {
        let order = vec![
            CriticalityLevel::Minimal,
            CriticalityLevel::Low,
            CriticalityLevel::Medium,
            CriticalityLevel::High,
            CriticalityLevel::Critical,
        ];

        let pos_a = order.iter().position(|x| x == a).unwrap_or(0);
        let pos_b = order.iter().position(|x| x == b).unwrap_or(0);

        (pos_a as i32) - (pos_b as i32)
    }

    /// Get topology metrics for multiple cards in bulk
    pub async fn calculate_bulk_topology_metrics(&self, card_ids: Vec<Uuid>) -> Result<Vec<TopologyMetrics>> {
        let mut metrics = Vec::new();

        for card_id in card_ids {
            match self.calculate_topology_metrics(card_id).await {
                Ok(metric) => metrics.push(metric),
                Err(e) => {
                    tracing::warn!("Failed to calculate topology for card {}: {:?}", card_id, e);
                    // Continue with other cards
                }
            }
        }

        Ok(metrics)
    }

    /// Find critical paths (cards with high fan-in that are dependencies for many cards)
    pub async fn find_critical_paths(&self, threshold: u32) -> Result<Vec<(Uuid, u32)>> {
        let query = "
            MATCH (c:Card)<-[:RELATED_TO]-(other:Card)
            WITH c, count(other) as fan_in
            WHERE fan_in >= $threshold
            RETURN c.id as card_id, fan_in
            ORDER BY fan_in DESC
        ";

        let mut result = self.neo4j
            .execute_query(neo4rs::query(query).param("threshold", threshold))
            .await?;

        let mut critical_paths = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            if let Some(id_str) = row.get::<String>("card_id") {
                if let Ok(id) = Uuid::parse_str(&id_str) {
                    let fan_in: i64 = row.get("fan_in").unwrap_or(0);
                    critical_paths.push((id, fan_in as u32));
                }
            }
        }

        Ok(critical_paths)
    }

    /// Get topology metrics for all cards
    pub async fn get_all_topology_metrics(&self) -> Result<Vec<TopologyMetrics>> {
        let query = "
            MATCH (c:Card)
            RETURN c.id as card_id
        ";

        let mut result = self.neo4j.execute_query(neo4rs::query(query)).await?;

        let mut card_ids = Vec::new();
        while let Ok(Some(row)) = result.next().await {
            if let Some(id_str) = row.get::<String>("card_id") {
                if let Ok(id) = Uuid::parse_str(&id_str) {
                    card_ids.push(id);
                }
            }
        }

        self.calculate_bulk_topology_metrics(card_ids).await
    }
}
