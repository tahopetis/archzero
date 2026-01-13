pub mod config;
pub mod error;
pub mod models;

pub mod handlers;
pub mod middleware;
pub mod services;

// Re-export common types
pub use error::{AppError, Result};
pub use config::Settings;

use axum::{Router, Json, routing::{get, post}};
use std::sync::Arc;
use utoipa::OpenApi;

/// Arc Zero API Documentation
#[derive(OpenApi)]
#[openapi(
    paths(
        handlers::cards::create_card,
        handlers::cards::get_card,
        handlers::cards::list_cards,
        handlers::cards::update_card,
        handlers::cards::delete_card,
        handlers::relationships::create_relationship,
        handlers::relationships::get_relationship,
        handlers::relationships::list_relationships,
        handlers::relationships::update_relationship,
        handlers::relationships::delete_relationship,
        handlers::health::health_check,
        handlers::bia::list_profiles,
        handlers::bia::get_profile,
        handlers::bia::create_assessment,
        handlers::bia::get_assessment,
        handlers::bia::get_enhanced_criticality,
        handlers::bia::get_topology_metrics,
        handlers::bia::get_critical_paths,
        handlers::bia::get_dependents,
        handlers::bia::get_dependencies,
        handlers::migration::assess_migration,
        handlers::migration::get_recommendation,
        handlers::migration::get_card_recommendations,
        handlers::tco::calculate_tco,
        handlers::tco::get_portfolio_tco,
        handlers::tco::get_tco_breakdown,
        handlers::tco::get_tco_comparison,
        handlers::tco::get_cost_trend,
    ),
    components(
        schemas(
            models::card::Card,
            models::card::CardType,
            models::card::LifecyclePhase,
            models::card::CreateCardRequest,
            models::card::UpdateCardRequest,
            models::relationship::Relationship,
            models::relationship::RelationshipType,
            models::relationship::CreateRelationshipRequest,
            models::relationship::UpdateRelationshipRequest,
        )
    ),
    tags(
        (name = "Cards", description = "Card management APIs"),
        (name = "Relationships", description = "Relationship management APIs"),
        (name = "BIA", description = "Business Impact Analysis APIs"),
        (name = "Topology", description = "Topology and dependency APIs"),
        (name = "Migration", description = "Migration recommendation APIs"),
        (name = "TCO", description = "Total Cost of Ownership APIs"),
        (name = "Health", description = "Health check APIs"),
    )
)]
struct ApiDoc;

async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

/// Create the application router with all services initialized
/// This is used by both main.rs and integration tests
pub async fn create_app(settings: Settings) -> Router {
    use sqlx::postgres::PgPool;
    use handlers::{auth, cards, health, relationships, bia, migration, tco};
    use services::{
        CardService, AuthService, RelationshipService, Neo4jService,
        SagaOrchestrator, BIAService, TopologyService, MigrationService, TCOService
    };

    // Connect to databases (in tests, use test configuration)
    let pool = PgPool::connect(&settings.database.postgres_url)
        .await
        .expect("Failed to connect to PostgreSQL");

    let neo4j_service = Arc::new(
        Neo4jService::new(
            &settings.database.neo4j_uri,
            &settings.database.neo4j_user,
            &settings.database.neo4j_password,
        )
        .await
        .expect("Failed to connect to Neo4j")
    );

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

    // Build router
    Router::new()
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
                .layer(axum::Extension(saga_orchestrator)),
        )
        .nest(
            "/api/v1/relationships",
            Router::new()
                .route("/", get(relationships::list_relationships).post(relationships::create_relationship))
                .route("/:id", get(relationships::get_relationship).put(relationships::update_relationship).delete(relationships::delete_relationship))
                .layer(axum::Extension(relationship_service)),
        )
        // Phase 2: BIA endpoints
        .nest(
            "/api/v1/bia",
            Router::new()
                .route("/profiles", get(bia::list_profiles))
                .route("/profiles/:name", get(bia::get_profile))
                .route("/assessments", post(bia::create_assessment))
                .route("/assessments/:id", get(bia::get_assessment))
                .layer(axum::Extension(bia_service.clone()))
                .layer(axum::Extension(topology_service.clone()))
                .layer(axum::Extension(card_service.clone())),
        )
        // Phase 2: Topology endpoints
        .nest(
            "/api/v1/topology",
            Router::new()
                .route("/cards/:card_id/criticality", get(bia::get_enhanced_criticality))
                .route("/cards/:card_id/metrics", get(bia::get_topology_metrics))
                .route("/cards/:card_id/dependents", get(bia::get_dependents))
                .route("/cards/:card_id/dependencies", get(bia::get_dependencies))
                .route("/critical-paths", get(bia::get_critical_paths))
                .layer(axum::Extension(bia_service.clone()))
                .layer(axum::Extension(topology_service.clone()))
                .layer(axum::Extension(card_service.clone())),
        )
        // Phase 2: Migration endpoints
        .nest(
            "/api/v1/migration",
            Router::new()
                .route("/assess", post(migration::assess_migration))
                .route("/recommendations/:id", get(migration::get_recommendation))
                .route("/cards/:card_id/recommendations", get(migration::get_card_recommendations))
                .layer(axum::Extension(migration_service))
                .layer(axum::Extension(card_service.clone())),
        )
        // Phase 2: TCO endpoints
        .nest(
            "/api/v1/tco",
            Router::new()
                .route("/calculate", post(tco::calculate_tco))
                .route("/portfolio", get(tco::get_portfolio_tco))
                .route("/cards/:card_id", get(tco::get_tco_breakdown))
                .route("/cards/:card_id/comparison", get(tco::get_tco_comparison))
                .route("/cards/:card_id/trend", get(tco::get_cost_trend))
                .layer(axum::Extension(tco_service))
                .layer(axum::Extension(card_service))
                .layer(axum::Extension(topology_service)),
        )
        // API Documentation
        .route("/api-docs/openapi.json", get(openapi_json))
        .layer(tower_http::cors::CorsLayer::permissive())
}
