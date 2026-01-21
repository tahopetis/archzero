// Application state for Axum 0.7 .with_state() pattern
use std::sync::Arc;
use uuid::Uuid;
use tokio::sync::Mutex;

use crate::services::{
    CardService, AuthService, RelationshipService, Neo4jService,
    SagaOrchestrator, BIAService, TopologyService, MigrationService, TCOService, CsrfService, RateLimitService, CacheService, ArbTemplateService, ARBAuditService, ARBNotificationService, ExportService
};

#[derive(Clone)]
pub struct AppState {
    pub card_service: Arc<CardService>,
    pub auth_service: Arc<AuthService>,
    pub relationship_service: Arc<RelationshipService>,
    pub neo4j_service: Arc<Neo4jService>,
    pub saga_orchestrator: Arc<SagaOrchestrator>,
    pub bia_service: Arc<BIAService>,
    pub topology_service: Arc<TopologyService>,
    pub migration_service: Arc<MigrationService>,
    pub tco_service: Arc<TCOService>,
    pub csrf_service: Arc<CsrfService>,
    pub rate_limit_service: Arc<RateLimitService>,
    pub cache_service: Arc<CacheService>,
    pub arb_template_service: Arc<ArbTemplateService>,
    pub arb_audit_service: Arc<ARBAuditService>,
    pub arb_notification_service: Arc<ARBNotificationService>,
    pub export_service: Arc<ExportService>,
    pub import_jobs: Arc<Mutex<std::collections::HashMap<Uuid, crate::handlers::import::ImportJob>>>,
}
