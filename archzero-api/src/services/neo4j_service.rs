use neo4rs::Graph;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::models::card::Card;
use crate::models::relationship::Relationship;
use crate::error::AppError;

#[derive(Clone)]
pub struct Neo4jService {
    graph: Arc<RwLock<Graph>>,
}

impl Neo4jService {
    pub async fn new(uri: &str, user: &str, password: &str) -> Result<Self, AppError> {
        let config = neo4rs::ConfigBuilder::new()
            .uri(uri)
            .user(user)
            .password(password)
            .db("neo4j")
            .build()
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to create Neo4j config: {}", e)))?;

        let graph = Graph::connect(config).await
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to connect to Neo4j: {}", e)))?;

        Ok(Self {
            graph: Arc::new(RwLock::new(graph)),
        })
    }

    /// Execute a generic Neo4j query
    pub async fn execute_query(&self, query: neo4rs::Query) -> Result<neo4rs::RowStream, AppError> {
        let graph = self.graph.read().await;
        Ok(graph.execute(query).await.map_err(|e| AppError::Internal(anyhow::anyhow!("Neo4j query failed: {}", e)))?)
    }

    /// Create a card node in Neo4j
    pub async fn create_card_node(&self, card: &Card) -> Result<(), AppError> {
        let card_type_str = serde_json::to_string(&card.card_type)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize card type: {}", e)))?
            .trim_matches('"')
            .to_string();

        let lifecycle_phase_str = serde_json::to_string(&card.lifecycle_phase)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize lifecycle phase: {}", e)))?
            .trim_matches('"')
            .to_string();

        let graph = self.graph.write().await;

        let query = format!(
            r#"
            CREATE (c:Card {{id: $id, name: $name, type: $type, lifecyclePhase: $lifecyclePhase,
                               qualityScore: $qualityScore, description: $description,
                               status: $status, createdAt: $createdAt, updatedAt: $updatedAt}})
            "#,
        );

        let query = neo4rs::query(&query)
            .param("id", card.id.to_string())
            .param("name", card.name.clone())
            .param("type", card_type_str)
            .param("lifecyclePhase", lifecycle_phase_str)
            .param("qualityScore", card.quality_score.unwrap_or(0))
            .param("description", card.description.clone().unwrap_or_default())
            .param("status", card.status.clone())
            .param("createdAt", card.created_at.to_rfc3339())
            .param("updatedAt", card.updated_at.to_rfc3339());

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to create card node: {}", e)))?;

        Ok(())
    }

    /// Update a card node in Neo4j
    pub async fn update_card_node(&self, card: &Card) -> Result<(), AppError> {
        let card_type_str = serde_json::to_string(&card.card_type)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize card type: {}", e)))?
            .trim_matches('"')
            .to_string();

        let lifecycle_phase_str = serde_json::to_string(&card.lifecycle_phase)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize lifecycle phase: {}", e)))?
            .trim_matches('"')
            .to_string();

        let graph = self.graph.write().await;

        let query = format!(
            r#"
            MATCH (c:Card {{id: $id}})
            SET c.name = $name, c.type = $type, c.lifecyclePhase = $lifecyclePhase,
                c.qualityScore = $qualityScore, c.description = $description,
                c.status = $status, c.updatedAt = $updatedAt
            "#,
        );

        let query = neo4rs::query(&query)
            .param("id", card.id.to_string())
            .param("name", card.name.clone())
            .param("type", card_type_str)
            .param("lifecyclePhase", lifecycle_phase_str)
            .param("qualityScore", card.quality_score.unwrap_or(0))
            .param("description", card.description.clone().unwrap_or_default())
            .param("status", card.status.clone())
            .param("updatedAt", card.updated_at.to_rfc3339());

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to update card node: {}", e)))?;

        Ok(())
    }

    /// Delete a card node from Neo4j
    pub async fn delete_card_node(&self, card_id: Uuid) -> Result<(), AppError> {
        let graph = self.graph.write().await;

        let query = "MATCH (c:Card {id: $id}) DETACH DELETE c";

        let query = neo4rs::query(&query)
            .param("id", card_id.to_string());

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to delete card node: {}", e)))?;

        Ok(())
    }

    /// Create a relationship between two cards in Neo4j
    pub async fn create_relationship(&self, relationship: &Relationship) -> Result<(), AppError> {
        let relationship_type_str = serde_json::to_string(&relationship.relationship_type)
            .map_err(|e| AppError::Internal(anyhow::anyhow!("Failed to serialize relationship type: {}", e)))?
            .trim_matches('"')
            .to_string();

        let graph = self.graph.write().await;

        // Use the relationship type as the edge label (must be alphanumeric)
        // Validate to prevent Neo4j injection - only allow alphanumeric and underscore
        let edge_type = relationship_type_str.replace(" ", "");
        if !edge_type.chars().all(|c| c.is_alphanumeric() || c == '_') {
            return Err(AppError::Internal(anyhow::anyhow!("Invalid relationship type: {}", edge_type)));
        }

        let query = format!(
            r#"
            MATCH (from:Card {{id: $fromId}}), (to:Card {{id: $toId}})
            CREATE (from)-[r:{REL_TYPE} {{validFrom: $validFrom, validTo: $validTo, confidence: $confidence}}]->(to)
            "#,
            REL_TYPE = edge_type.to_uppercase()
        );

        let query = neo4rs::query(&query)
            .param("fromId", relationship.from_card_id.to_string())
            .param("toId", relationship.to_card_id.to_string())
            .param("validFrom", relationship.valid_from.clone())
            .param("validTo", relationship.valid_to.clone().unwrap_or_default())
            .param("confidence", relationship.confidence.unwrap_or(1.0));

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to create relationship: {}", e)))?;

        Ok(())
    }

    /// Delete a relationship from Neo4j
    pub async fn delete_relationship(&self, relationship_id: Uuid) -> Result<(), AppError> {
        let graph = self.graph.write().await;

        let query = "MATCH ()-[r]->() WHERE elementId(r).toString() CONTAINS $id DELETE r";

        let query = neo4rs::query(&query)
            .param("id", relationship_id.to_string());

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to delete relationship: {}", e)))?;

        Ok(())
    }

    /// Delete all relationships connected to a card
    pub async fn delete_card_relationships(&self, card_id: Uuid) -> Result<(), AppError> {
        let graph = self.graph.write().await;

        let query = "MATCH (c:Card {id: $id})-[r]-(other) DELETE r";

        let query = neo4rs::query(&query)
            .param("id", card_id.to_string());

        graph.run(query).await
            .map_err(|e| AppError::Neo4j(format!("Failed to delete card relationships: {}", e)))?;

        Ok(())
    }
}
