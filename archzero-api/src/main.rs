use axum::{
    routing::{get, post, delete},
    Router,
    Json,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use sqlx::postgres::PgPool;
use std::sync::Arc;
use uuid::Uuid;
use utoipa::OpenApi;

use archzero_api::{
    config::Settings,
    state::AppState,
    handlers::{auth, cards, health, relationships, bia, migration, tco, policies, principles, standards, exceptions, initiatives, risks, compliance, arb, graph, import, bulk, csrf, cache, test_reset, users, export},
    services::{CardService, AuthService, RelationshipService, Neo4jService, SagaOrchestrator, BIAService, TopologyService, MigrationService, TCOService, CsrfService, RateLimitService, CacheService, ArbTemplateService, ARBAuditService, ARBNotificationService},
    middleware::{security_headers, security_logging, rate_limit_middleware, auth_middleware},
    models::card::{Card, CardType, LifecyclePhase, CreateCardRequest, UpdateCardRequest, CardSearchParams},
    models::relationship::{Relationship, RelationshipType, CreateRelationshipRequest, UpdateRelationshipRequest},
    models::principles::*,
    models::standards::*,
    models::policies::*,
    models::exceptions::*,
    models::initiatives::*,
    models::risks::*,
    models::compliance::*,
    models::arb::*,
    models::arb_template::*,
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
        bia::list_profiles,
        bia::get_profile,
        bia::create_assessment,
        bia::get_assessment,
        bia::get_enhanced_criticality,
        bia::get_topology_metrics,
        bia::get_critical_paths,
        bia::get_dependents,
        bia::get_dependencies,
        migration::assess_migration,
        migration::get_recommendation,
        migration::get_card_recommendations,
        tco::calculate_tco,
        tco::get_portfolio_tco,
        tco::get_tco_breakdown,
        tco::get_tco_comparison,
        tco::get_cost_trend,
        // Phase 3: Governance & Compliance
        principles::list_principles,
        principles::get_principle,
        principles::create_principle,
        principles::update_principle,
        principles::delete_principle,
        principles::get_principle_compliance,
        standards::list_standards,
        standards::get_standard,
        standards::create_standard,
        standards::update_standard,
        standards::delete_standard,
        standards::get_radar,
        standards::get_debt_report,
        policies::list_policies,
        policies::get_policy,
        policies::create_policy,
        policies::update_policy,
        policies::delete_policy,
        policies::check_policy_compliance,
        policies::validate_policy,
        policies::list_violations,
        exceptions::list_exceptions,
        exceptions::get_exception,
        exceptions::create_exception_request,
        exceptions::approve_exception,
        exceptions::reject_exception,
        exceptions::list_expiring_exceptions,
        exceptions::delete_exception,
        initiatives::list_initiatives,
        initiatives::get_initiative,
        initiatives::create_initiative,
        initiatives::update_initiative,
        initiatives::delete_initiative,
        initiatives::get_initiative_impact_map,
        initiatives::link_cards_to_initiative,
        risks::list_risks,
        risks::get_risk,
        risks::create_risk,
        risks::update_risk,
        risks::delete_risk,
        risks::get_risk_heat_map,
        risks::get_top_risks,
        compliance::list_compliance_requirements,
        compliance::get_compliance_requirement,
        compliance::create_compliance_requirement,
        compliance::update_compliance_requirement,
        compliance::delete_compliance_requirement,
        compliance::assess_card_compliance,
        compliance::get_compliance_dashboard,
        // Phase 3: ARB Workflow
        arb::list_meetings,
        arb::get_meeting,
        arb::create_meeting,
        arb::update_meeting,
        arb::delete_meeting,
        arb::get_meeting_agenda,
        arb::add_submission_to_agenda,
        arb::list_submissions,
        arb::get_submission,
        arb::create_submission,
        arb::update_submission,
        arb::delete_submission,
        arb::record_decision,
        arb::get_dashboard,
        arb::get_statistics,
        // Phase 4: Graph Visualization
        graph::get_graph,
        graph::get_graph_stats,
        graph::get_node_count,
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
            // Phase 3: Governance & Compliance schemas
            // Principles
            ArchitecturePrinciple,
            PrincipleCategory,
            CreatePrincipleRequest,
            UpdatePrincipleRequest,
            PrincipleSearchParams,
            PrincipleComplianceReport,
            ComplianceViolation,
            PrinciplesListResponse,
            // Standards
            TechnologyStandard,
            TechnologyStatus,
            RadarQuadrant,
            RadarRing,
            TechnologyRadar,
            CreateStandardRequest,
            UpdateStandardRequest,
            StandardSearchParams,
            StandardsListResponse,
            TechnologyDebtReport,
            DebtItem,
            // Policies
            ArchitecturePolicy,
            CreatePolicyRequest,
            UpdatePolicyRequest,
            PolicySearchParams,
            PolicySeverity,
            PolicyEnforcement,
            PolicyComplianceCheckRequest,
            PolicyComplianceCheckResponse,
            policies::CardComplianceResult,
            policies::ComplianceStatus,
            PolicyViolation,
            PolicyViolationListResponse,
            ViolationPagination,
            ValidatePolicyRequest,
            ValidatePolicyResponse,
            PolicyListResponse,
            PolicyPagination,
            ViolationSearchParams,
            // Exceptions
            Exception,
            ExceptionStatus,
            ExceptionDuration,
            CreateExceptionRequest,
            ExceptionListParams,
            ExceptionListResponse,
            ExceptionPagination,
            ApproveExceptionRequest,
            RejectExceptionRequest,
            // Initiatives
            Initiative,
            InitiativeStatus,
            InitiativeHealth,
            InitiativeType,
            CreateInitiativeRequest,
            UpdateInitiativeRequest,
            InitiativeSearchParams,
            InitiativeListResponse,
            InitiativeImpactMap,
            ImpactedCard,
            CardLinkRequest,
            CardLinkResponse,
            // Risks
            Risk,
            RiskType,
            RiskStatus,
            CreateRiskRequest,
            UpdateRiskRequest,
            RiskSearchParams,
            RiskListResponse,
            RiskHeatMapData,
            HeatMapCell,
            TopRisksResponse,
            TopRiskItem,
            // Compliance
            ComplianceRequirement,
            ComplianceFramework,
            CreateComplianceRequirementRequest,
            UpdateComplianceRequirementRequest,
            ComplianceRequirementSearchParams,
            ComplianceRequirementsListResponse,
            CardComplianceAssessmentResult,
            RequirementComplianceStatus,
            AssessComplianceRequest,
            ComplianceAssessment,
            ComplianceSummary,
            CardTypeBreakdown,
            ComplianceDashboard,
            CompliancePagination,
            // Phase 3: ARB Workflow schemas
            ARBMeeting,
            ARBMeetingStatus,
            CreateARBMeetingRequest,
            UpdateARBMeetingRequest,
            ARBMeetingSearchParams,
            ARBMeetingListResponse,
            ARBSubmission,
            ARBSubmissionType,
            ARBSubmissionStatus,
            ARBPriority,
            CreateARBSubmissionRequest,
            UpdateARBSubmissionRequest,
            ARBSubmissionSearchParams,
            ARBSubmissionListResponse,
            ARBDecision,
            ARBDecisionType,
            CreateARBDecisionRequest,
            UpdateARBDecisionRequest,
            ARBAgendaItem,
            AddSubmissionToMeetingRequest,
            ARBDashboard,
            ARBStatistics,
            ARBPagination,
            SubmissionTypeCount,
            DecisionTypeCount,
            // Phase 4: Graph Visualization
            graph::GraphData,
            graph::GraphNode,
            graph::NodePosition,
            graph::GraphNodeData,
            graph::GraphEdge,
            graph::GraphEdgeData,
            graph::GraphStats,
            graph::GraphSearchParams,
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
        (name = "Principles", description = "Architecture Principles management endpoints"),
        (name = "Standards", description = "Technology Standards management endpoints"),
        (name = "Policies", description = "Architecture Policy management endpoints"),
        (name = "Exceptions", description = "Exception management endpoints"),
        (name = "Initiatives", description = "Initiative portfolio management endpoints"),
        (name = "Risks", description = "Risk register endpoints"),
        (name = "Compliance", description = "Compliance requirements tracking endpoints"),
        (name = "ARB", description = "Architecture Review Board workflow endpoints"),
        (name = "Graph", description = "Graph visualization endpoints"),
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
    let csrf_service = Arc::new(CsrfService::new());
    let rate_limit_service = Arc::new(RateLimitService::new());

    // Initialize Phase 5: Redis Cache Service
    let redis_url = settings.cache.redis_url.clone().unwrap_or_else(|| "redis://127.0.0.1:6379".to_string());
    let cache_service = match CacheService::new(&redis_url) {
        Ok(cache) => {
            tracing::info!("Redis cache service initialized");
            Arc::new(cache)
        }
        Err(e) => {
            tracing::warn!("Redis cache service unavailable: {}. Running without cache.", e);
            // In production, you might want a no-op cache implementation here
            // For now, we'll try to create a default one
            Arc::new(CacheService::new("redis://127.0.0.1:6379").expect("Failed to create cache service"))
        }
    };

    // Initialize ARB Template Service
    let arb_template_service = Arc::new(ArbTemplateService::new(pool.clone()));

    // Initialize ARB Audit Service
    let arb_audit_service = Arc::new(ARBAuditService::new(pool.clone()));

    // Initialize ARB Notification Service
    let arb_notification_service = Arc::new(ARBNotificationService::new(pool.clone()));

    // Initialize Export Service
    let export_service = Arc::new(ExportService::new(pool.clone()));

    let import_jobs: Arc<tokio::sync::Mutex<std::collections::HashMap<Uuid, import::ImportJob>>> =
        Arc::new(tokio::sync::Mutex::new(std::collections::HashMap::new()));

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
        arb_template_service: arb_template_service.clone(),
        arb_audit_service: arb_audit_service.clone(),
        arb_notification_service: arb_notification_service.clone(),
        export_service: export_service.clone(),
        import_jobs: import_jobs.clone(),
    };

    // Build our application with routes
    let app = Router::new()
        .nest(
            "/api/v1/health",
            Router::new().route("/", get(health::health_check)),
        )
        // Phase 5: CSRF Protection endpoints
        .nest(
            "/api/v1/csrf",
            Router::new()
                .route("/token", post(csrf::generate_csrf_token))
                .route("/validate", post(csrf::validate_csrf_token)),
        )
        // Phase 5: Cache monitoring endpoints
        .nest(
            "/api/v1/cache",
            Router::new()
                .route("/health", get(cache::get_cache_health))
                .route("/stats", get(cache::get_cache_stats))
                .route("/stats/reset", post(cache::reset_cache_stats))
                .route("/flush", post(cache::flush_cache))
                .route("/warm", post(cache::warm_cache)),
        )
        // Test-only endpoints (only available in development)
        .route("/api/v1/test/reset-auth-state", post(test_reset::reset_auth_state))
        .route("/api/v1/test/cleanup-all-cards", post(test_reset::cleanup_all_cards))
        .route("/api/v1/test/seed-arb-users", post(test_reset::seed_arb_users))
        .nest(
            "/api/v1/auth",
            Router::new()
                .route("/login", post(auth::login))
                .route("/logout", post(auth::logout))
                .route("/me", get(auth::me)),
        )
        .nest(
            "/api/v1/users",
            Router::new()
                .route("/", get(users::get_users).post(users::create_user))
                .route("/:id", get(users::get_user).put(users::update_user).delete(users::delete_user))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
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
        // Phase 4: Export endpoints
        .nest(
            "/api/v1/export",
            Router::new()
                .route("/cards", post(export::export_cards))
                .route("/history", get(export::get_export_history))
                .route("/:domain", post(export::export_domain)),
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
        // Phase 3: Architecture Policy endpoints
        .nest(
            "/api/v1/policies",
            Router::new()
                .route("/", get(policies::list_policies).post(policies::create_policy))
                .route("/:id", get(policies::get_policy).put(policies::update_policy).delete(policies::delete_policy))
                .route("/check", post(policies::check_policy_compliance))
                .route("/:id/validate", post(policies::validate_policy))
                .route("/violations", get(policies::list_violations))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Architecture Principles endpoints
        .nest(
            "/api/v1/principles",
            Router::new()
                .route("/", get(principles::list_principles).post(principles::create_principle))
                .route("/:id", get(principles::get_principle).put(principles::update_principle).delete(principles::delete_principle))
                .route("/:id/compliance", get(principles::get_principle_compliance))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Technology Standards endpoints
        .nest(
            "/api/v1/tech-standards",
            Router::new()
                .route("/", get(standards::list_standards).post(standards::create_standard))
                .route("/:id", get(standards::get_standard).put(standards::update_standard).delete(standards::delete_standard))
                .route("/radar", get(standards::get_radar))
                .route("/debt-report", get(standards::get_debt_report))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Exceptions endpoints
        .nest(
            "/api/v1/exceptions",
            Router::new()
                .route("/", get(exceptions::list_exceptions).post(exceptions::create_exception_request))
                .route("/:id", get(exceptions::get_exception).delete(exceptions::delete_exception))
                .route("/:id/approve", post(exceptions::approve_exception))
                .route("/:id/reject", post(exceptions::reject_exception))
                .route("/expiring", get(exceptions::list_expiring_exceptions))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Initiatives endpoints
        .nest(
            "/api/v1/initiatives",
            Router::new()
                .route("/", get(initiatives::list_initiatives).post(initiatives::create_initiative))
                .route("/:id", get(initiatives::get_initiative).put(initiatives::update_initiative).delete(initiatives::delete_initiative))
                .route("/:id/impact-map", get(initiatives::get_initiative_impact_map))
                .route("/:id/link-cards", post(initiatives::link_cards_to_initiative))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Risks endpoints
        .nest(
            "/api/v1/risks",
            Router::new()
                .route("/", get(risks::list_risks).post(risks::create_risk))
                .route("/:id", get(risks::get_risk).put(risks::update_risk).delete(risks::delete_risk))
                .route("/heat-map", get(risks::get_risk_heat_map))
                .route("/top-10", get(risks::get_top_risks))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: Compliance Requirements endpoints
        .nest(
            "/api/v1/compliance-requirements",
            Router::new()
                .route("/", get(compliance::list_compliance_requirements).post(compliance::create_compliance_requirement))
                .route("/:id", get(compliance::get_compliance_requirement).put(compliance::update_compliance_requirement).delete(compliance::delete_compliance_requirement))
                .route("/:id/assess", post(compliance::assess_card_compliance))
                .route("/:id/dashboard", get(compliance::get_compliance_dashboard))
                // Removed Extension layer to fix type inference),
        )
        // Phase 4.2: Compliance Audit endpoints
        .nest(
            "/api/v1/compliance-audits",
            Router::new()
                .route("/", get(compliance::list_compliance_audits).post(compliance::create_compliance_audit))
                .route("/:id", get(compliance::get_compliance_audit).put(compliance::update_compliance_audit).delete(compliance::delete_compliance_audit))
                // Removed Extension layer to fix type inference),
        )
        // Phase 3: ARB Workflow endpoints (with authentication)
        .nest(
            "/api/v1/arb/meetings",
            Router::new()
                .route("/", get(arb::list_meetings).post(arb::create_meeting))
                .route("/:id", get(arb::get_meeting).put(arb::update_meeting).delete(arb::delete_meeting))
                .route("/:id/agenda", get(arb::get_meeting_agenda).post(arb::add_submission_to_agenda))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        .nest(
            "/api/v1/arb/submissions",
            Router::new()
                .route("/", get(arb::list_submissions).post(arb::create_submission))
                .route("/:id", get(arb::get_submission).put(arb::update_submission).delete(arb::delete_submission))
                .route("/:id/decision", post(arb::record_decision))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        .nest(
            "/api/v1/arb/templates",
            Router::new()
                .route("/", get(arb::list_templates).post(arb::create_template))
                .route("/:id", get(arb::get_template).put(arb::update_template).delete(arb::delete_template))
                .route("/from-template", post(arb::create_from_template))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        .nest(
            "/api/v1/arb/audit-logs",
            Router::new()
                .route("/", get(arb::get_audit_logs))
                .route("/:entity_type/:entity_id", get(arb::get_entity_audit_logs))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        .nest(
            "/api/v1/arb/notifications",
            Router::new()
                .route("/", get(arb::get_notifications))
                .route("/unread-count", get(arb::get_unread_count))
                .route("/:id/read", post(arb::mark_notification_read))
                .route("/read-all", post(arb::mark_all_read))
                .route("/:id", delete(arb::delete_notification))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        .nest(
            "/api/v1/arb",
            Router::new()
                .route("/dashboard", get(arb::get_dashboard))
                .route("/statistics", get(arb::get_statistics))
                .layer(axum::middleware::from_fn_with_state(
                    app_state.clone(),
                    auth_middleware,
                )),
        )
        // Phase 4: Graph Visualization endpoints
        .nest(
            "/api/v1/graph",
            Router::new()
                .route("/", get(graph::get_graph))
                .route("/stats", get(graph::get_graph_stats))
                .route("/count", get(graph::get_node_count)),
        )
        // Phase 4: Bulk Import endpoints
        .nest(
            "/api/v1/import",
            Router::new()
                .route("/cards", post(import::bulk_import_cards))
                .route("/status/:job_id", get(import::get_import_status))
                // Removed Extension layer to fix type inference),
        )
        // Phase 4: Bulk Operations endpoints
        .nest(
            "/api/v1/cards",
            Router::new()
                .route("/bulk", axum::routing::delete(bulk::bulk_delete_cards))
                .route("/bulk/update", axum::routing::put(bulk::bulk_update_cards))
                // Removed Extension layer to fix type inference),
        )
        .nest(
            "/api/v1/export",
            Router::new()
                .route("/bulk", post(bulk::bulk_export_cards))
                // Removed Extension layer to fix type inference),
        )
        // API Documentation routes
        .route("/api-docs/openapi.json", get(openapi_json))
        // Security middleware (applied to all routes)
        .layer(axum::middleware::from_fn(security_headers))
        .layer(axum::middleware::from_fn(security_logging))
        // Phase 5: CSRF Protection (Available via /api/v1/csrf/token endpoint)
        // Note: CSRF middleware is disabled globally to prevent breaking existing API calls.
        // Clients should obtain tokens from /api/v1/csrf/token and include them in
        // the X-CSRF-Token header for state-changing operations.
        // .layer(axum::middleware::from_fn(csrf_protect))
        // Phase 5: Rate Limiting (Available via rate_limit_service)
        // Note: Rate limiting middleware is disabled globally to prevent blocking development.
        // To enable, uncomment the line below and adjust rate limits in middleware/rate_limit.rs
        // .layer(axum::middleware::from_fn(rate_limit_middleware))
        // CORS (should be after security headers)
        .layer(CorsLayer::permissive())
        // Application state
        .with_state(app_state);

    // Start server
    let addr = format!("{}:{}", settings.server.host, settings.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app)
        .await?;

    Ok(())
}
