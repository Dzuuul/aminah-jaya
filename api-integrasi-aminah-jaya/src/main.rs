pub mod biteship;
pub mod config;
pub mod duitku;
pub mod models;
pub mod routes;
pub mod services;

use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("info".parse().unwrap()),
        )
        .init();

    info!("Starting Aminah Jaya integration API...");

    let config = Arc::new(config::env::Config::load());
    let port = config.port;

    let allowed_origins: Vec<axum::http::HeaderValue> = config
        .allowed_origins
        .iter()
        .filter_map(|origin| origin.parse().ok())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(allowed_origins)
        .allow_methods([
            axum::http::Method::GET,
            axum::http::Method::POST,
            axum::http::Method::PUT,
            axum::http::Method::DELETE,
            axum::http::Method::OPTIONS,
        ])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
            axum::http::header::ORIGIN,
        ])
        .allow_credentials(true);

    let api = Router::new()
        .route(
            "/shipping/couriers",
            get(routes::shipping::list_couriers),
        )
        .route(
            "/shipping/maps/areas",
            get(routes::shipping::search_maps_areas),
        )
        .route(
            "/shipping/rates",
            post(routes::shipping::get_shipping_rates),
        )
        .route(
            "/shipping/draft-orders",
            post(routes::shipping::create_draft_order),
        )
        .route(
            "/shipping/draft-orders/:id/rates",
            get(routes::shipping::get_draft_order_rates),
        )
        .route(
            "/shipping/draft-orders/:id/confirm",
            post(routes::shipping::confirm_draft_order),
        )
        .route(
            "/shipping/orders",
            post(routes::shipping::create_biteship_order),
        )
        .route(
            "/shipping/orders/:id",
            get(routes::shipping::get_biteship_order),
        )
        .route(
            "/shipping/tracking/:id",
            get(routes::shipping::get_biteship_tracking),
        );

    let app = Router::new()
        .nest("/api", api)
        .route("/webhook", get(routes::webhook::verify_webhook))
        .route("/webhook", post(routes::webhook::handle_webhook))
        .route(
            "/payments/duitku/methods",
            get(duitku::handlers::get_payment_methods_handler),
        )
        .route(
            "/payments/duitku",
            post(duitku::handlers::create_payment_handler),
        )
        .route(
            "/payments/duitku/callback",
            post(duitku::handlers::duitku_callback_handler),
        )
        .layer(cors)
        .layer(tower_http::trace::TraceLayer::new_for_http())
        .with_state(config);

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    info!("Listening on {}", addr);

    axum::serve(listener, app).await.unwrap();
}
