use axum::{
    routing::{get, post, patch},
    Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod auth;
mod models;
mod routes;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to the database");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Auth
        .route("/api/auth/login", post(routes::auth::login))

        // Dashboard
        .route("/api/dashboard/stats",         get(routes::dashboard::get_stats))
        .route("/api/dashboard/recent-orders", get(routes::dashboard::get_recent_orders))

        // Products
        .route("/api/products",     get(routes::products::list_products).post(routes::products::create_product))
        .route("/api/products/{id}", get(routes::products::get_product)
                                    .patch(routes::products::update_product)
                                    .delete(routes::products::delete_product))

        // Orders
        .route("/api/orders",      get(routes::orders::list_orders))
        .route("/api/orders/{id}", get(routes::orders::get_order))
        .route("/api/orders/{id}/status", patch(routes::orders::update_order_status))

        // Customers
        .route("/api/customers/stats", get(routes::customers::get_customer_stats))
        .route("/api/customers",       get(routes::customers::list_customers))
        .route("/api/customers/{id}",  get(routes::customers::get_customer))

        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(pool);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = SocketAddr::from(([0, 0, 0, 0], port.parse()?));

    tracing::info!("🚀 Server listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
