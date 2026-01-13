use axum::{
    routing::{get, post},
    Router,
    Json,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use utoipa::OpenApi;

use archzero_api::{
    config::Settings,
    handlers::{auth, cards, health, relationships, bia, migration, tco},
    services::{CardService, AuthService, RelationshipService, Neo4jService, SagaOrchestrator, BIAService, TopologyService, MigrationService, TCOService},
    models::card::{Card, CardType, LifecyclePhase, CreateCardRequest, UpdateCardRequest, CardSearchParams},
    models::relationship::{Relationship, RelationshipType, CreateRelationshipRequest, UpdateRelationshipRequest},
};

/// Arc Zero API Documentation
#[derive(OpenApi)]
#[openapi(
    paths(
        cards::create_card,
        cards::get_card,
        cards::list_cards,
        cards::update_card,
        cards::delete_card,
        relationships::create_relationship,
        relationships::get_relationship,
        relationships::list_relationships,
        relationships::update_relationship,
        relationships::delete_relationship,
        health::health_check,
        // TODO: Add OpenAPI path attributes to Phase 2 handlers
        // bia::list_profiles,
        // bia::get_profile,
        // bia::create_assessment,
        // bia::get_enhanced_criticality,
        // bia::get_topology_metrics,
        // bia::get_critical_paths,
        // migration::assess_migration,
        // tco::calculate_tco,
        // tco::get_portfolio_tco,
    ),
    components(
        schemas(
            Card,
            CardType,
            LifecyclePhase,
            CreateCardRequest,
            UpdateCardRequest,
            CardSearchParams,
            Relationship,
            RelationshipType,
            CreateRelationshipRequest,
            UpdateRelationshipRequest,
            cards::CardListResponse,
            relationships::CardRelationshipParams,
            health::HealthResponse,
        )
    ),
    tags(
        (name = "Cards", description = "Card management endpoints"),
        (name = "Relationships", description = "Relationship management endpoints"),
        (name = "Health", description = "Health check endpoints"),
        (name = "BIA", description = "Business Impact Analysis endpoints"),
        (name = "Topology", description = "Topology analysis endpoints"),
        (name = "Migration", description = "6R Migration decision endpoints"),
        (name = "TCO", description = "Total Cost of Ownership endpoints"),
    ),
    info(
        title = "Arc Zero API",
        version = "0.1.0",
        description = "API for managing architecture cards and their relationships with intelligence engines",
        contact(
            name = "Arc Zero Team",
        )
    )
)]
struct ApiDoc;

/// OpenAPI JSON endpoint
async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "archzero_api=debug,tower_http=debug,axum=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let settings = Settings::new()?;
    tracing::info!("Loaded configuration");

    // Connect to PostgreSQL
    let pool = PgPool::connect(&settings.database.postgres_url).await?;
    tracing::info!("Connected to PostgreSQL");

    // Connect to Neo4j
    let neo4j_service = Arc::new(
        Neo4jService::new(
            &settings.database.neo4j_uri,
            &settings.database.neo4j_user,
            &settings.database.neo4j_password,
        )
        .await
        .map_err(|e| anyhow::anyhow!("Failed to connect to Neo4j: {}", e))?
    );
    tracing::info!("Connected to Neo4j");

    // Initialize services
    let card_service = Arc::new(CardService::new(pool.clone()));
    let auth_service = Arc::new(AuthService::new(
        pool.clone(),
        settings.jwt.secret.clone(),
        settings.jwt.expiration_hours * 3600,
    ));
    let relationship_service = Arc::new(RelationshipService::new(pool.clone()));

    // Initialize SAGA orchestrator
    let saga_orchestrator = Arc::new(SagaOrchestrator::new(
        card_service.clone(),
        relationship_service.clone(),
        neo4j_service.clone(),
    ));

    // Initialize Phase 2 intelligence services
    let bia_service = Arc::new(BIAService::new());
    let topology_service = Arc::new(TopologyService::new(neo4j_service.clone()));
    let migration_service = Arc::new(MigrationService::new());
    let tco_service = Arc::new(TCOService::new());

    // Build our application with routes
    let app = Router::new()
        .nest(
            "/api/v1/health",
            Router::new().route("/", get(health::health_check)),
        )
        .nest(
            "/api/v1/auth",
            Router::new()
                .route("/login", post(auth::login))
                .route("/logout", post(auth::logout))
                .route("/me", get(auth::me)),
        )
        .nest(
            "/api/v1/cards",
            Router::new()
                .route("/", get(cards::list_cards).post(cards::create_card))
                .route("/:id", get(cards::get_card).put(cards::update_card).delete(cards::delete_card))
                .layer(axum::Extension(saga_orchestrator.clone())),
        )
        .nest(
            "/api/v1/relationships",
            Router::new()
                .route("/", get(relationships::list_relationships).post(relationships::create_relationship))
                .route("/:id", get(relationships::get_relationship).put(relationships::update_relationship).delete(relationships::delete_relationship))
                .layer(axum::Extension(relationship_service.clone())),
        )
        // Phase 2: BIA endpoints
        .nest(
            "/api/v1/bia",
            Router::new()
                .route("/profiles", get(bia::list_profiles))
                .route("/profiles/:name", get(bia::get_profile))
                .route("/assessments", post(bia::create_assessment))
                .route("/assessments/:id", get(bia::get_assessment)),
        )
        // Phase 2: Topology endpoints
        .nest(
            "/api/v1/topology",
            Router::new()
                .route("/cards/:card_id/criticality", get(bia::get_enhanced_criticality))
                .route("/cards/:card_id/metrics", get(bia::get_topology_metrics))
                .route("/cards/:card_id/dependents", get(bia::get_dependents))
                .route("/cards/:card_id/dependencies", get(bia::get_dependencies))
                .route("/critical-paths", get(bia::get_critical_paths)),
        )
        // Phase 2: Migration endpoints
        .nest(
            "/api/v1/migration",
            Router::new()
                .route("/assess", post(migration::assess_migration))
                .route("/recommendations/:id", get(migration::get_recommendation))
                .route("/cards/:card_id/recommendations", get(migration::get_card_recommendations)),
        )
        // Phase 2: TCO endpoints
        .nest(
            "/api/v1/tco",
            Router::new()
                .route("/calculate", post(tco::calculate_tco))
                .route("/portfolio", get(tco::get_portfolio_tco))
                .route("/cards/:card_id", get(tco::get_tco_breakdown))
                .route("/cards/:card_id/comparison", get(tco::get_tco_comparison))
                .route("/cards/:card_id/trend", get(tco::get_cost_trend)),
        )
        // API Documentation routes
        .route("/api-docs/openapi.json", get(openapi_json))
        .layer(CorsLayer::permissive())
        // Layer with shared state
        .layer(axum::Extension(card_service.clone()))
        .layer(axum::Extension(bia_service.clone()))
        .layer(axum::Extension(topology_service.clone()))
        .layer(axum::Extension(migration_service.clone()))
        .layer(axum::Extension(tco_service.clone()));

    // Start server
    let addr = format!("{}:{}", settings.server.host, settings.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
