/// Smoke test for Phase 2 endpoints
/// This test verifies that all Phase 2 routes are registered and accessible
use axum::{
    body::Body,
    http::{Request, StatusCode, Method},
};
use tower::ServiceExt;
use serde_json::Value;

/// Helper to create test app
async fn create_test_app() -> axum::Router {
    // Load test configuration
    let config = archzero_api::Settings::new().expect("Failed to load config");

    // For smoke tests, we just verify the app compiles and routes exist
    // Actual endpoint testing requires database setup

    // Create minimal app (in production, use full app setup)
    archzero_api::create_app(config).await
}

#[tokio::test]
async fn test_health_check() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/health")
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_bia_profiles_route_exists() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/bia/profiles")
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap();

    // Route exists (may return 500 if DB not configured, but should not be 404)
    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_topology_metrics_route_exists() {
    let app = create_test_app().await;

    // Use a valid UUID format
    let test_uuid = uuid::Uuid::new_v4();

    let response = app
        .oneshot(
            Request::builder()
                .uri(&format!("/api/v1/topology/cards/{}/metrics", test_uuid))
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap();

    // Route exists
    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_migration_assess_route_exists() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/migration/assess")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"card_id":"00000000-0000-0000-0000-000000000000","factors":{"business_criticality":"Medium","customization_level":"None","integration_complexity":"Low","maintenance_burden":"Low","performance_issues":false,"strategic_fit":"Core","technology_age_years":5,"user_satisfaction":0.7},"target_environment":"Aws}"#))
                .unwrap()
        )
        .await
        .unwrap();

    // Route exists (may fail validation, but should not be 404)
    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_tco_calculate_route_exists() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/tco/calculate")
                .header("content-type", "application/json")
                .body(Body::from(r#"{"card_id":"00000000-0000-0000-0000-000000000000","cost_breakdown":{"hardware":1000,"software":500,"personnel":2000,"facilities":300,"support":400,"training":100,"licensing":150,"cloud_costs":800,"migration_costs":0,"retirement_costs":0,"risk_mitigation":0,"contingency":0},"allocation_strategy":{"method":"EvenSplit"},"currency":"USD","calculation_period_months":12}"#))
                .unwrap()
        )
        .await
        .unwrap();

    // Route exists
    assert_ne!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_openapi_docs_accessible() {
    let app = create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api-docs/openapi.json")
                .body(Body::empty())
                .unwrap()
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    // Verify OpenAPI spec includes Phase 2 endpoints
    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
    let openapi: Value = serde_json::from_slice(&body).unwrap();

    // Check that Phase 2 paths exist
    let paths = openapi["paths"].as_object().expect("paths should exist");

    // BIA paths
    assert!(paths.contains_key("/api/v1/bia/profiles"), "BIA profiles path missing");
    assert!(paths.contains_key("/api/v1/bia/profiles/{name}"), "BIA profile path missing");
    assert!(paths.contains_key("/api/v1/bia/assessments"), "BIA assessments path missing");

    // Topology paths
    assert!(paths.contains_key("/api/v1/topology/cards/{card_id}/criticality"), "Topology criticality path missing");
    assert!(paths.contains_key("/api/v1/topology/cards/{card_id}/metrics"), "Topology metrics path missing");
    assert!(paths.contains_key("/api/v1/topology/critical-paths"), "Critical paths path missing");
    assert!(paths.contains_key("/api/v1/topology/cards/{card_id}/dependents"), "Dependents path missing");
    assert!(paths.contains_key("/api/v1/topology/cards/{card_id}/dependencies"), "Dependencies path missing");

    // Migration paths
    assert!(paths.contains_key("/api/v1/migration/assess"), "Migration assess path missing");
    assert!(paths.contains_key("/api/v1/migration/recommendations/{id}"), "Migration recommendations path missing");
    assert!(paths.contains_key("/api/v1/migration/cards/{card_id}/recommendations"), "Card recommendations path missing");

    // TCO paths
    assert!(paths.contains_key("/api/v1/tco/calculate"), "TCO calculate path missing");
    assert!(paths.contains_key("/api/v1/tco/portfolio"), "TCO portfolio path missing");
    assert!(paths.contains_key("/api/v1/tco/cards/{card_id}"), "TCO breakdown path missing");
    assert!(paths.contains_key("/api/v1/tco/cards/{card_id}/comparison"), "TCO comparison path missing");
    assert!(paths.contains_key("/api/v1/tco/cards/{card_id}/trend"), "Cost trend path missing");

    // Check tags
    let tags = openapi["tags"].as_array().expect("tags should exist");
    let tag_names: Vec<&str> = tags.iter()
        .filter_map(|t| t["name"].as_str())
        .collect();

    assert!(tag_names.contains(&"BIA"), "BIA tag missing");
    assert!(tag_names.contains(&"Topology"), "Topology tag missing");
    assert!(tag_names.contains(&"Migration"), "Migration tag missing");
    assert!(tag_names.contains(&"TCO"), "TCO tag missing");
}
