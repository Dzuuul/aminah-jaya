pub mod config;
pub mod models;
pub mod routes;
pub mod services;

use axum::{routing::{get, post}, Router};
use std::sync::Arc;
use tracing::info;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("info".parse().unwrap())
        )
        .init();

    info!("Starting WhatsApp Cloud API backend...");

    // Load configuration
    let config = Arc::new(config::env::Config::load());
    let port = config.port;

    // Build the router
    let app = Router::new()
        .route("/webhook", get(routes::webhook::verify_webhook))
        .route("/webhook", post(routes::webhook::handle_webhook))
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .with_state(config);

    // Run the server
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("Listening on {}", addr);
    
    axum::serve(listener, app).await.unwrap();
}
