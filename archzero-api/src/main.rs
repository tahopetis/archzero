use axum::{
    routing::{get, post},
    Router,
};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use archzero_api::{
    config::Settings,
    handlers::{auth, cards, health},
};

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

    // Build our application with routes
    // Note: State will be added in Phase 0.6 when database is set up
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
        .layer(CorsLayer::permissive());

    // Start server
    let addr = format!("{}:{}", settings.server.host, settings.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
