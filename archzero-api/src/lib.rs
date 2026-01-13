pub mod config;
pub mod error;
pub mod models;
pub mod state;

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
        handlers::risks::list_risks,
        handlers::risks::get_risk,
        handlers::risks::create_risk,
        handlers::risks::update_risk,
        handlers::risks::delete_risk,
        handlers::risks::get_risk_heat_map,
        handlers::risks::get_top_risks,
        handlers::compliance::list_compliance_requirements,
        handlers::compliance::get_compliance_requirement,
        handlers::compliance::create_compliance_requirement,
        handlers::compliance::update_compliance_requirement,
        handlers::compliance::delete_compliance_requirement,
        handlers::compliance::assess_card_compliance,
        handlers::compliance::get_compliance_dashboard,
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
            models::risks::Risk,
            models::risks::RiskType,
            models::risks::RiskStatus,
            models::risks::CreateRiskRequest,
            models::risks::UpdateRiskRequest,
            models::risks::RiskListResponse,
            models::risks::PaginationMetadata,
            models::risks::RiskHeatMapData,
            models::risks::RiskHeatMapRisk,
            models::risks::TopRisk,
            models::risks::TopRisksResponse,
            models::compliance::ComplianceRequirement,
            models::compliance::ComplianceFramework,
            models::compliance::CreateComplianceRequirementRequest,
            models::compliance::UpdateComplianceRequirementRequest,
            models::compliance::ComplianceRequirementSearchParams,
            models::compliance::ComplianceRequirementsListResponse,
            models::compliance::CompliancePagination,
            models::compliance::RequirementComplianceStatus,
            models::compliance::CardComplianceAssessmentResult,
            models::compliance::AssessComplianceRequest,
            models::compliance::ComplianceAssessment,
            models::compliance::ComplianceSummary,
            models::compliance::CardTypeBreakdown,
            models::compliance::ComplianceDashboard,
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
        (name = "Risks", description = "Risk register and heat map APIs"),
        (name = "Compliance", description = "Compliance requirements tracking APIs"),
    )
)]
struct ApiDoc;

async fn openapi_json() -> Json<utoipa::openapi::OpenApi> {
    Json(ApiDoc::openapi())
}

/// Create the application router with all services initialized
/// This is used by both main.rs and integration tests
pub async fn create_app(settings: Settings) -> axum::Router {
    use sqlx::postgres::PgPool;
    use tokio::sync::Mutex;
    use handlers::{auth, cards, health, relationships, bia, migration, tco, risks, compliance};
    use services::{
        CardService, AuthService, RelationshipService, Neo4jService,
        SagaOrchestrator, BIAService, TopologyService, MigrationService, TCOService, CsrfService, RateLimitService, CacheService
    };
    use state::AppState;

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
    let csrf_service = Arc::new(CsrfService::new());
    let rate_limit_service = Arc::new(RateLimitService::new());

    // Initialize Phase 5: Redis Cache Service (optional - fails gracefully if Redis unavailable)
    let cache_service = if let Ok(cache) = CacheService::new(&settings.cache.redis_url.clone().unwrap_or_else(|| "redis://127.0.0.1:6379".to_string())) {
        Arc::new(cache)
    } else {
        tracing::warn!("Redis cache service unavailable - running without cache");
        // Create a dummy cache service that gracefully handles failures
        // For now, we'll just skip caching if Redis is unavailable
        Arc::new(CacheService::new("redis://127.0.0.1:6379").unwrap_or_else(|_| {
            // This is a fallback - in production you might want a no-op cache implementation
            panic!("Cache service initialization failed")
        }))
    };

    // Create application state
    let app_state = AppState {
        card_service: card_service.clone(),
        auth_service: auth_service.clone(),
        relationship_service: relationship_service.clone(),
        neo4j_service: neo4j_service.clone(),
        saga_orchestrator: saga_orchestrator.clone(),
        bia_service: bia_service.clone(),
        topology_service: topology_service.clone(),
        migration_service: migration_service.clone(),
        tco_service: tco_service.clone(),
        csrf_service: csrf_service.clone(),
        rate_limit_service: rate_limit_service.clone(),
        cache_service: cache_service.clone(),
        import_jobs: Arc::new(Mutex::new(std::collections::HashMap::new())),
    };

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
                .route("/:id", get(cards::get_card).put(cards::update_card).delete(cards::delete_card)),
        )
        .nest(
            "/api/v1/relationships",
            Router::new()
                .route("/", get(relationships::list_relationships).post(relationships::create_relationship))
                .route("/:id", get(relationships::get_relationship).put(relationships::update_relationship).delete(relationships::delete_relationship)),
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
        // Phase 3: Risk register endpoints
        .nest(
            "/api/v1/risks",
            Router::new()
                .route("/", get(risks::list_risks).post(risks::create_risk))
                .route("/:id", get(risks::get_risk).put(risks::update_risk).delete(risks::delete_risk))
                .route("/heat-map", get(risks::get_risk_heat_map))
                .route("/top-10", get(risks::get_top_risks)),
        )
        // Phase 3: Compliance requirements endpoints
        .nest(
            "/api/v1/compliance-requirements",
            Router::new()
                .route("/", get(compliance::list_compliance_requirements).post(compliance::create_compliance_requirement))
                .route("/:id", get(compliance::get_compliance_requirement).put(compliance::update_compliance_requirement).delete(compliance::delete_compliance_requirement))
                .route("/:id/assess", post(compliance::assess_card_compliance))
                .route("/:id/dashboard", get(compliance::get_compliance_dashboard)),
        )
        // API Documentation
        .route("/api-docs/openapi.json", get(openapi_json))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(app_state)
}
