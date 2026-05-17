use axum::{
    routing::{get, patch, post, delete},
    Router,
};
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::process::Stdio;
use tokio::time::{sleep, Duration};

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

    let mut database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // SSH Tunnel Configuration
    let _tunnel_child = if std::env::var("USE_SSH_TUNNEL").unwrap_or_default() == "true" {
        let ssh_host = std::env::var("SSH_HOST").expect("SSH_HOST must be set");
        let ssh_user = std::env::var("SSH_USER").expect("SSH_USER must be set");
        let ssh_key = std::env::var("SSH_KEY_PATH").expect("SSH_KEY_PATH must be set");
        let local_port = std::env::var("DB_LOCAL_PORT").unwrap_or_else(|_| "5433".into());
        let remote_host = std::env::var("DB_REMOTE_HOST").unwrap_or_else(|_| "127.0.0.1".into());
        let remote_port = std::env::var("DB_REMOTE_PORT").unwrap_or_else(|_| "5432".into());

        tracing::info!("🔗 Starting SSH tunnel: localhost:{} -> {}:{} via {}@{}", 
            local_port, remote_host, remote_port, ssh_user, ssh_host);

        let child = tokio::process::Command::new("ssh")
            .args([
                "-L",
                &format!("{}:{}:{}", local_port, remote_host, remote_port),
                &format!("{}@{}", ssh_user, ssh_host),
                "-i",
                &ssh_key,
                "-N",
                "-o",
                "ExitOnForwardFailure=yes",
                "-o",
                "StrictHostKeyChecking=no",
                "-o",
                "ServerAliveInterval=60",
                "-o",
                "ServerAliveCountMax=3",
                "-o",
                "TCPKeepAlive=yes",
            ])
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .kill_on_drop(true)
            .spawn()?;

        // Wait a moment for the tunnel to be established
        sleep(Duration::from_secs(2)).await;

        // Update database_url to use the local port (replaces any host with localhost:local_port)
        if let Some(at_idx) = database_url.find('@') {
            if let Some(slash_idx) = database_url[at_idx..].find('/') {
                let actual_slash_idx = at_idx + slash_idx;
                database_url.replace_range(at_idx + 1..actual_slash_idx, &format!("localhost:{}", local_port));
            }
        }
        
        Some(child)
    } else {
        None
    };

    let pool = PgPoolOptions::new()
        .max_connections(50)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(600))
        .max_lifetime(Duration::from_secs(1800))
        .connect(&database_url)
        .await
        .expect("Failed to connect to the database");

    // Run database migrations automatically
    tracing::info!("⚙️ Running database migrations...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run database migrations");
    tracing::info!("✅ Migrations completed successfully");

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
        .route("/api/auth/me", get(routes::auth::get_me))
        // Dashboard
        .route("/api/dashboard/stats", get(routes::dashboard::get_stats))
        .route(
            "/api/dashboard/performance",
            get(routes::dashboard::get_performance),
        )
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
        .route("/api/products/slug/:slug", get(routes::products::get_product_by_slug))
        .route(
            "/api/categories",
            get(routes::products::list_categories).post(routes::products::create_category),
        )
        .route(
            "/api/categories/:id",
            patch(routes::products::update_category).delete(routes::products::delete_category),
        )
        // Collections
        .route(
            "/api/collections",
            get(routes::collections::list_collections).post(routes::collections::create_collection),
        )
        .route(
            "/api/collections/:id",
            get(routes::collections::get_collection)
                .patch(routes::collections::update_collection)
                .delete(routes::collections::delete_collection),
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
        // Coupons
        .route(
            "/api/coupons",
            get(routes::coupons::list_coupons).post(routes::coupons::create_coupon),
        )
        .route("/api/coupons/validate/:code", get(routes::coupons::validate_coupon))
        .route(
            "/api/coupons/:id",
            get(routes::coupons::get_coupon)
                .patch(routes::coupons::update_coupon)
                .delete(routes::coupons::delete_coupon),
        )
        // Customers
        .route(
            "/api/customers/stats",
            get(routes::customers::get_customer_stats),
        )
        .route("/api/customers", get(routes::customers::list_customers))
        .route("/api/customers/:id", get(routes::customers::get_customer))
        // Settings
        .route(
            "/api/settings",
            get(routes::settings::get_settings).patch(routes::settings::update_settings),
        )
        // Notifications
        .route("/api/notifications", get(routes::notifications::list_notifications))
        .route("/api/notifications/unread-count", get(routes::notifications::get_unread_count))
        .route("/api/notifications/:id/read", patch(routes::notifications::mark_as_read))
        // Legal
        .route("/api/legal", get(routes::legal::list_legal_pages))
        .route(
            "/api/legal/:key",
            get(routes::legal::get_legal_page).patch(routes::legal::update_legal_page),
        )
        // Storefront Customer Auth
        .route("/api/customer/register", post(routes::customer_auth::register))
        .route("/api/customer/login", post(routes::customer_auth::login))
        .route("/api/customer/auth/google", post(routes::customer_auth::google_login))
        .route("/api/customer/me", get(routes::customer_auth::get_me))
        .route("/api/customer/profile", patch(routes::customer_auth::update_profile))
        .route(
            "/api/customer/orders",
            get(routes::customer_auth::get_orders).post(routes::customer_auth::create_order),
        )
        // Cart
        .route(
            "/api/cart",
            get(routes::cart::get_cart)
                .post(routes::cart::add_to_cart)
                .delete(routes::cart::clear_cart),
        )
        .route(
            "/api/cart/:id",
            patch(routes::cart::update_cart_item).delete(routes::cart::remove_from_cart),
        )
        // Favorites
        .route(
            "/api/customer/favorites",
            get(routes::favorites::get_favorites)
                .post(routes::favorites::add_favorite),
        )
        .route(
            "/api/customer/favorites/:id",
            delete(routes::favorites::remove_favorite),
        )
        .route(
            "/api/customer/favorites/product/:product_id",
            delete(routes::favorites::remove_favorite_by_product),
        )
        .route(
            "/api/customer/favorites/folders",
            get(routes::favorites::get_favorite_folders),
        )

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
