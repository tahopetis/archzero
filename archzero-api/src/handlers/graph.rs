/**
 * Graph Visualization Handlers
 * Provide graph data for ReactFlow visualization
 */

use axum::{
    extract::{Query, State},
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use utoipa::ToSchema;

use crate::{
    services::CardService,
    error::AppError,
    models::card::CardSearchParams,
    state::AppState,
};

#[derive(Debug, Deserialize, ToSchema)]
pub struct GraphSearchParams {
    pub center_card_id: Option<Uuid>,
    pub depth: Option<u32>,
    pub relationship_types: Option<Vec<String>>,
    pub card_types: Option<Vec<String>>,
    pub min_confidence: Option<f64>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphNode {
    pub id: String,
    pub position: NodePosition,
    pub data: GraphNodeData,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct NodePosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphNodeData {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub node_type: String,
    pub lifecycle_phase: String,
    pub quality_score: Option<i32>,
    pub description: Option<String>,
    pub tags: Vec<String>,
    pub color: String,
    pub size: f64,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphEdge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub data: GraphEdgeData,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphEdgeData {
    #[serde(rename = "relationshipType")]
    pub relationship_type: String,
    pub confidence: f64,
    #[serde(rename = "validFrom")]
    pub valid_from: String,
    #[serde(rename = "validTo")]
    pub valid_to: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphData {
    pub nodes: Vec<GraphNode>,
    pub edges: Vec<GraphEdge>,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct GraphStats {
    pub total_nodes: u32,
    pub total_edges: u32,
    pub connected_components: u32,
    pub average_degree: f64,
    pub max_depth: u32,
}

/// Get graph data for visualization
#[utoipa::path(
    get,
    path = "/api/v1/graph",
    params(
        ("center_card_id" = Option<Uuid>, Query, description = "Center card ID"),
        ("depth" = Option<u32>, Query, description = "Graph traversal depth"),
        ("relationship_types" = Option<Vec<String>>, Query, description = "Filter by relationship types"),
        ("card_types" = Option<Vec<String>>, Query, description = "Filter by card types"),
        ("min_confidence" = Option<f64>, Query, description = "Minimum confidence threshold"),
    ),
    responses(
        (status = 200, description = "Graph data retrieved successfully", body = GraphData),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Graph"
)]
pub async fn get_graph(
    State(state): State<AppState>,
    Query(params): Query<GraphSearchParams>,
) -> Result<Json<GraphData>, AppError> {
    let depth = params.depth.unwrap_or(2).min(5);
    let min_confidence = params.min_confidence.unwrap_or(0.0);

    // Get cards and relationships from Neo4j
    let (nodes, edges) = if let Some(center_id) = params.center_card_id {
        // Get graph centered on a specific card
        get_graph_centered(&state.card_service, center_id, depth, min_confidence).await?
    } else {
        // Get full graph
        get_full_graph(&state.card_service, depth, min_confidence).await?
    };

    Ok(Json(GraphData { nodes, edges }))
}

/// Get graph statistics
#[utoipa::path(
    get,
    path = "/api/v1/graph/stats",
    responses(
        (status = 200, description = "Graph statistics", body = GraphStats),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Graph"
)]
pub async fn get_graph_stats(
    State(state): State<AppState>,
) -> Result<Json<GraphStats>, AppError> {
    // Calculate graph statistics from Neo4j
    let stats = calculate_graph_stats(&state.card_service).await?;

    Ok(Json(stats))
}

/// Get total node count
#[utoipa::path(
    get,
    path = "/api/v1/graph/count",
    responses(
        (status = 200, description = "Node count"),
        (status = 500, description = "Internal server error"),
    ),
    tag = "Graph"
)]
pub async fn get_node_count(
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    // Get all cards to count
    let cards = state.card_service.list(CardSearchParams {
        page: Some(1),
        page_size: Some(1),
        ..Default::default()
    }).await?;

    Ok(Json(serde_json::json!({ "count": cards.1 })))
}

async fn get_graph_centered(
    card_service: &CardService,
    center_id: Uuid,
    _depth: u32,
    _min_confidence: f64,
) -> Result<(Vec<GraphNode>, Vec<GraphEdge>), AppError> {
    // For now, just return the center card
    let center_card = card_service.get(center_id).await?;

    let nodes = vec![GraphNode {
        id: center_card.id.to_string(),
        position: NodePosition { x: 500.0, y: 300.0 },
        data: GraphNodeData {
            id: center_card.id.to_string(),
            name: center_card.name.clone(),
            node_type: format!("{:?}", center_card.card_type),
            lifecycle_phase: format!("{:?}", center_card.lifecycle_phase),
            quality_score: center_card.quality_score,
            description: center_card.description,
            tags: center_card.tags.clone(),
            color: get_card_color(&format!("{:?}", center_card.card_type)),
            size: 1.0,
        },
    }];

    // TODO: Get relationships and connected cards
    let edges = vec![];

    Ok((nodes, edges))
}

async fn get_full_graph(
    card_service: &CardService,
    _depth: u32,
    _min_confidence: f64,
) -> Result<(Vec<GraphNode>, Vec<GraphEdge>), AppError> {
    // Get all cards (limited for performance)
    let (cards, _total) = card_service.list(CardSearchParams {
        page: Some(1),
        page_size: Some(100),
        ..Default::default()
    }).await?;

    let nodes: Vec<GraphNode> = cards.into_iter()
        .enumerate()
        .map(|(i, card)| {
            // Simple circular layout
            let angle = (i as f64 / 100.0) * 2.0 * std::f64::consts::PI;
            let radius = 300.0;
            let x = 500.0 + radius * angle.cos();
            let y = 300.0 + radius * angle.sin();

            GraphNode {
                id: card.id.to_string(),
                position: NodePosition { x, y },
                data: GraphNodeData {
                    id: card.id.to_string(),
                    name: card.name.clone(),
                    node_type: format!("{:?}", card.card_type),
                    lifecycle_phase: format!("{:?}", card.lifecycle_phase),
                    quality_score: card.quality_score,
                    description: card.description,
                    tags: card.tags.clone(),
                    color: get_card_color(&format!("{:?}", card.card_type)),
                    size: 1.0,
                },
            }
        })
        .collect();

    // TODO: Get relationships
    let edges = vec![];

    Ok((nodes, edges))
}

async fn calculate_graph_stats(
    _card_service: &CardService,
) -> Result<GraphStats, AppError> {
    // Query Neo4j for graph statistics
    // For now, return placeholder data
    Ok(GraphStats {
        total_nodes: 0,
        total_edges: 0,
        connected_components: 0,
        average_degree: 0.0,
        max_depth: 0,
    })
}

fn get_card_color(card_type: &str) -> String {
    match card_type {
        "BusinessCapability" => "#8b5cf6".to_string(),    // purple
        "Objective" => "#a78bfa".to_string(),             // light purple
        "Application" => "#3b82f6".to_string(),            // blue
        "Interface" => "#06b6d4".to_string(),              // cyan
        "ITComponent" => "#10b981".to_string(),            // emerald
        "Platform" => "#14b8a6".to_string(),               // teal
        "ArchitecturePrinciple" => "#6366f1".to_string(),  // indigo
        "TechnologyStandard" => "#8b5cf6".to_string(),     // violet
        "ArchitecturePolicy" => "#f43f5e".to_string(),     // rose
        "Exception" => "#f59e0b".to_string(),              // amber
        "Initiative" => "#ec4899".to_string(),             // pink
        "Risk" => "#ef4444".to_string(),                   // red
        "ComplianceRequirement" => "#f97316".to_string(),  // orange
        _ => "#64748b".to_string(),                        // slate
    }
}
