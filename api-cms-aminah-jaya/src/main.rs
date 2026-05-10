use axum::{
    routing::{get, patch, post},
    Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod auth;
pub mod models;
pub mod routes;
pub mod state;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .expect("Failed to connect to the database");

    // S3 / R2 Configuration
    let r2_account_id = std::env::var("R2_ACCOUNT_ID").expect("R2_ACCOUNT_ID must be set");
    let r2_access_key = std::env::var("R2_ACCESS_KEY").expect("R2_ACCESS_KEY must be set");
    let r2_secret_key = std::env::var("R2_SECRET_KEY").expect("R2_SECRET_KEY must be set");
    let r2_bucket = std::env::var("R2_BUCKET").expect("R2_BUCKET must be set");
    let r2_public_url = std::env::var("R2_PUBLIC_URL").expect("R2_PUBLIC_URL must be set");

    let s3_config = aws_config::defaults(aws_config::BehaviorVersion::latest())
        .credentials_provider(aws_credential_types::Credentials::new(
            r2_access_key,
            r2_secret_key,
            None,
            None,
            "static",
        ))
        .endpoint_url(format!(
            "https://{}.r2.cloudflarestorage.com",
            r2_account_id
        ))
        .region(aws_config::Region::new("auto"))
        .load()
        .await;

    let s3_client = aws_sdk_s3::Client::new(&s3_config);

    let state = state::AppState {
        pool,
        s3_client,
        r2_bucket,
        r2_public_url,
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        // Auth
        .route("/api/auth/login", post(routes::auth::login))
        // Dashboard
        .route("/api/dashboard/stats", get(routes::dashboard::get_stats))
        .route(
            "/api/dashboard/recent-orders",
            get(routes::dashboard::get_recent_orders),
        )
        // Products
        .route(
            "/api/products",
            get(routes::products::list_products).post(routes::products::create_product),
        )
        .route(
            "/api/products/:id",
            get(routes::products::get_product)
                .patch(routes::products::update_product)
                .delete(routes::products::delete_product),
        )
        .route(
            "/api/categories",
            get(routes::products::list_categories).post(routes::products::create_category),
        )
        .route(
            "/api/categories/:id",
            patch(routes::products::update_category).delete(routes::products::delete_category),
        )
        // Upload
        .route("/api/upload", post(routes::upload::upload_file))
        // Orders
        .route("/api/orders", get(routes::orders::list_orders))
        .route("/api/orders/:id", get(routes::orders::get_order))
        .route(
            "/api/orders/:id/status",
            patch(routes::orders::update_order_status),
        )
        // Flash Sales
        .route(
            "/api/flash-sales",
            get(routes::flash_sales::list_flash_sales).post(routes::flash_sales::create_flash_sale),
        )
        .route(
            "/api/flash-sales/active",
            get(routes::flash_sales::get_active_flash_sale),
        )
        .route(
            "/api/flash-sales/:id",
            get(routes::flash_sales::get_flash_sale).delete(routes::flash_sales::delete_flash_sale),
        )
        // Blogs
        .route(
            "/api/blogs",
            get(routes::blogs::list_blogs).post(routes::blogs::create_blog),
        )
        .route("/api/blogs/latest", get(routes::blogs::get_latest_blogs))
        .route(
            "/api/blogs/:id",
            get(routes::blogs::get_blog).delete(routes::blogs::delete_blog),
        )
        // Banners
        .route(
            "/api/banners",
            get(routes::banners::list_banners).post(routes::banners::create_banner),
        )
        .route("/api/banners/all", get(routes::banners::list_all_banners))
        .route(
            "/api/banners/:id",
            patch(routes::banners::update_banner).delete(routes::banners::delete_banner),
        )
        // Customers
        .route(
            "/api/customers/stats",
            get(routes::customers::get_customer_stats),
        )
        .route("/api/customers", get(routes::customers::list_customers))
        .route("/api/customers/:id", get(routes::customers::get_customer))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .layer(axum::extract::DefaultBodyLimit::max(10 * 1024 * 1024))
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
    let addr = SocketAddr::from(([0, 0, 0, 0], port.parse()?));

    tracing::info!("🚀 Server listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
